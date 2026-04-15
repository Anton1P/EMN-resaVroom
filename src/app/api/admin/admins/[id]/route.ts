// DELETE /api/admin/admins/[id] — Révoquer un admin

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Administrateur non trouvé." },
      { status: 404 }
    );
  }

  // Empêcher la suppression de soi-même
  if (admin.userEntraId === auth.session.user.entraId) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Vous ne pouvez pas vous révoquer vous-même." },
      { status: 403 }
    );
  }

  await prisma.admin.delete({ where: { id } });

  await logAudit({
    userEntraId: auth.session.user.entraId,
    userEmail: auth.session.user.email,
    action: "ADMIN_REVOKED",
    entityType: "admin",
    entityId: id,
    details: { revokedEmail: admin.userEmail },
  });

  return NextResponse.json({ message: "Administrateur révoqué." });
}
