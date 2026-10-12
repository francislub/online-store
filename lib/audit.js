// lib/audit.js
import db from "@/lib/db";

export async function logAudit({ actorId, action, entity, entityId, metadata }) {
  try {
    await db.auditLog.create({
      data: { actorId, action, entity, entityId: entityId || null, metadata: metadata || undefined },
    });
  } catch (error) {
    console.log("Audit log failed:", error);
  }
}