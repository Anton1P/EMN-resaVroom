// GET /api/admin/admins — Liste des admins
// POST /api/admin/admins — Ajouter un admin

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleBusinessError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(admins);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();

    if (!body.userEntraId || !body.userEmail) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "userEntraId et userEmail sont requis." },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.create({
      data: {
        userEntraId: body.userEntraId,
        userEmail: body.userEmail,
      },
    });

    await logAudit({
      userEntraId: auth.session.user.entraId,
      userEmail: auth.session.user.email,
      action: "ADMIN_PROMOTED",
      entityType: "admin",
      entityId: admin.id,
      details: { promotedEmail: body.userEmail },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    return handleBusinessError(error);
  }
}
