// components/backoffice/DashboardCharts.jsx
import React from "react";
import WeeklySalesChart from "./WeeklySalesChart";
import BestSellingProductsCharts from "./BestSellingProductsCharts";
import OrderStatusChart from "./OrderStatusChart";

export default function DashboardCharts({ weekly, topProducts, statusCounts, totalOrders, showMoney }) {
  return (
    <div className="grid grid-cols-1 gap-4 py-3 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <WeeklySalesChart data={weekly} showMoney={showMoney} />
      </div>
      <OrderStatusChart counts={statusCounts} total={totalOrders} />
      <div className="lg:col-span-3">
        <BestSellingProductsCharts products={topProducts} showMoney={showMoney} />
      </div>
    </div>
  );
}