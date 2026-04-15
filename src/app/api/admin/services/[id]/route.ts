// DELETE /api/admin/services/[id] — Supprimer un service autorisé

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const service = await prisma.authorizedService.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Service non trouvé." },
      { status: 404 }
    );
  }

  await prisma.authorizedService.delete({ where: { id } });

  await logAudit({
    userEntraId: auth.session.user.entraId,
    userEmail: auth.session.user.email,
    action: "SERVICE_REMOVED",
    entityType: "service",
    entityId: id,
    details: { serviceName: service.serviceName },
  });

  return NextResponse.json({ message: "Service supprimé." });
}
