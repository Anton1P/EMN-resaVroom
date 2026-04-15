// GET /api/admin/audit — Journal d'audit avec pagination

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-helpers";
import { getAuditLogs } from "@/lib/services/audit-service";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(sp.get("limit") ?? "20", 10), 100);
  const entityType = sp.get("entityType") ?? undefined;
  const entityId = sp.get("entityId") ?? undefined;

  const result = await getAuditLogs({ page, limit, entityType, entityId });

  return NextResponse.json({
    logs: result.logs,
    total: result.pagination.total,
    page: result.pagination.page,
    limit: result.pagination.limit,
    totalPages: result.pagination.totalPages,
  });
}
