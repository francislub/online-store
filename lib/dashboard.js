// lib/dashboard.js
import db from "@/lib/db";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const PAGE_SIZE = 10;
export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

export const SCOPES = {
  ADMIN: { money: true, finance: true, profit: true, inventory: true, customers: true, quotes: true, activity: true },
  CASHIER: { money: true, finance: true, profit: false, inventory: false, customers: true, quotes: false, activity: false },
  SALES: { money: true, finance: false, profit: false, inventory: false, customers: true, quotes: true, activity: false },
  STOREKEEPER: { money: false, finance: false, profit: false, inventory: true, customers: false, quotes: false, activity: false },
};

function startOfDay(date) {
  const shifted = new Date(date.getTime() + EAT_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - EAT_OFFSET_MS);
}

function startOfMonth(date) {
  const shifted = new Date(date.getTime() + EAT_OFFSET_MS);
  shifted.setUTCDate(1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - EAT_OFFSET_MS);
}

function dayKey(date) {
  return new Date(date.getTime() + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

function dayLabel(date) {
  return new Date(date.getTime() + EAT_OFFSET_MS).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

const live = { status: { not: "CANCELLED" } };
const none = Promise.resolve(null);

function orderAggregate(extra) {
  return db.order.aggregate({
    where: { ...live, ...extra },
    _sum: { total: true, discount: true },
    _count: { _all: true },
  });
}

function summarize(aggregate) {
  return {
    total: aggregate?._sum?.total || 0,
    discount: aggregate?._sum?.discount || 0,
    count: aggregate?._count?._all || 0,
  };
}

export async function getDashboardData(role) {
  const scope = SCOPES[role];
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
  const monthStart = startOfMonth(now);
  const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const paidFilter = { status: { in: ["PAID", "PARTIAL"] } };

  const [
    todayAgg,
    yesterdayAgg,
    monthAgg,
    allTimeAgg,
    statusGroups,
    weekOrders,
    topGroups,
    pendingReturns,
    customerCount,
    recentCustomers,
    openQuotes,
    receivablesAgg,
    overdueCount,
    paymentsMonthAgg,
    paymentMethodGroups,
    expensesAgg,
    monthItems,
    products,
    pendingPurchases,
    suppliersAgg,
    activity,
  ] = await Promise.all([
    scope.money ? orderAggregate({ createdAt: { gte: todayStart } }) : none,
    scope.money ? orderAggregate({ createdAt: { gte: yesterdayStart, lt: todayStart } }) : none,
    scope.money ? orderAggregate({ createdAt: { gte: monthStart } }) : none,
    scope.money ? orderAggregate({}) : none,
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.findMany({
      where: { ...live, createdAt: { gte: weekStart } },
      select: { createdAt: true, total: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { order: live },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.return.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
    scope.customers ? db.user.count({ where: { role: "CUSTOMER" } }) : none,
    scope.customers
      ? db.user.findMany({
          where: { role: "CUSTOMER" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
        })
      : none,
    scope.quotes ? db.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }) : none,
    scope.finance
      ? db.invoice.aggregate({
          where: { status: { in: ["ISSUED", "SENT", "OVERDUE"] } },
          _sum: { balance: true },
          _count: { _all: true },
        })
      : none,
    scope.finance ? db.invoice.count({ where: { status: "OVERDUE" } }) : none,
    scope.finance
      ? db.payment.aggregate({
          where: { ...paidFilter, paidAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: { _all: true },
        })
      : none,
    scope.finance
      ? db.payment.groupBy({
          by: ["method"],
          where: { ...paidFilter, paidAt: { gte: monthStart } },
          _sum: { amount: true },
          _count: { _all: true },
        })
      : none,
    scope.profit
      ? db.expense.aggregate({ where: { spentAt: { gte: monthStart } }, _sum: { amount: true } })
      : none,
    scope.profit
      ? db.orderItem.findMany({
          where: { order: { ...live, createdAt: { gte: monthStart } } },
          select: { quantity: true, unitPrice: true, costPrice: true },
        })
      : none,
    scope.inventory
      ? db.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, sku: true, stock: true, reorderLevel: true, costPrice: true },
        })
      : none,
    scope.inventory ? db.purchase.count({ where: { status: "ORDERED" } }) : none,
    scope.inventory
      ? db.supplier.aggregate({
          where: { isActive: true },
          _sum: { balance: true },
          _count: { _all: true },
        })
      : none,
    scope.activity
      ? db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            createdAt: true,
            actor: { select: { name: true, role: true } },
          },
        })
      : none,
  ]);

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count?._all || 0;
  }
  const totalOrders = ORDER_STATUSES.reduce((sum, status) => sum + statusCounts[status], 0);

  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayStart.getTime() - i * DAY_MS);
    weekly.push({ date: dayKey(date), label: dayLabel(date), total: 0, count: 0 });
  }
  for (const order of weekOrders) {
    const bucket = weekly.find((day) => day.date === dayKey(order.createdAt));
    if (bucket) {
      bucket.total += order.total;
      bucket.count += 1;
    }
  }

  let topProducts = [];
  if (topGroups.length > 0) {
    const named = await db.product.findMany({
      where: { id: { in: topGroups.map((group) => group.productId) } },
      select: { id: true, name: true, sku: true },
    });
    topProducts = topGroups.map((group) => {
      const product = named.find((item) => item.id === group.productId);
      return {
        id: group.productId,
        name: product?.name || "Deleted product",
        sku: product?.sku || "",
        units: group._sum?.quantity || 0,
        revenue: group._sum?.total || 0,
      };
    });
  }

  let inventory = null;
  if (products) {
    const attention = products
      .filter((product) => product.stock <= product.reorderLevel)
      .sort((a, b) => a.stock - b.stock);
    inventory = {
      products: products.length,
      units: products.reduce((sum, product) => sum + product.stock, 0),
      costValue: products.reduce((sum, product) => sum + product.stock * product.costPrice, 0),
      outOfStock: products.filter((product) => product.stock <= 0).length,
      lowStock: products.filter((product) => product.stock > 0 && product.stock <= product.reorderLevel).length,
      attention: attention.slice(0, 6),
      pendingPurchases: pendingPurchases || 0,
      suppliers: suppliersAgg?._count?._all || 0,
      supplierBalance: suppliersAgg?._sum?.balance || 0,
    };
  }

  const month = summarize(monthAgg);

  let profit = null;
  if (scope.profit) {
    const margin = (monthItems || []).reduce(
      (sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity,
      0
    );
    const gross = margin - month.discount;
    const expenses = expensesAgg?._sum?.amount || 0;
    profit = { gross, expenses, net: gross - expenses };
  }

  return {
    scope,
    totalOrders,
    statusCounts,
    weekly,
    topProducts,
    pendingReturns,
    money: scope.money
      ? {
          today: summarize(todayAgg),
          yesterday: summarize(yesterdayAgg),
          month,
          allTime: summarize(allTimeAgg),
        }
      : null,
    customers: scope.customers ? { count: customerCount || 0, recent: recentCustomers || [] } : null,
    openQuotes: openQuotes || 0,
    finance: scope.finance
      ? {
          receivables: {
            total: receivablesAgg?._sum?.balance || 0,
            count: receivablesAgg?._count?._all || 0,
          },
          overdue: overdueCount || 0,
          paymentsMonth: {
            total: paymentsMonthAgg?._sum?.amount || 0,
            count: paymentsMonthAgg?._count?._all || 0,
          },
          byMethod: (paymentMethodGroups || [])
            .map((group) => ({
              method: group.method,
              total: group._sum?.amount || 0,
              count: group._count?._all || 0,
            }))
            .sort((a, b) => b.total - a.total),
        }
      : null,
    profit,
    inventory,
    activity: activity || [],
  };
}

export async function getOrdersPage({ page, status }) {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const where = ORDER_STATUSES.includes(status) ? { status } : {};

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        phone: true,
        createdAt: true,
        customer: { select: { name: true, email: true } },
        payments: { select: { amount: true, status: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page: currentPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    status: where.status || "",
  };
}