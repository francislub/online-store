// lib/staff.js
import { STAFF_ROLES } from "@/lib/auth";

export function isValidId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

export function buildStaffWhere(query, role) {
  const q = (query || "").trim();
  const where = {
    role: STAFF_ROLES.includes(role) ? role : { in: STAFF_ROLES },
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}