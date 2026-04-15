// GET /api/admin/settings — Lire les paramètres
// PATCH /api/admin/settings — Modifier un paramètre

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const settings = await prisma.appSetting.findMany();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const body = await request.json();

  if (!body.key || !body.value) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "key et value sont requis." },
      { status: 400 }
    );
  }

  const oldSetting = await prisma.appSetting.findUnique({ where: { key: body.key } });

  const setting = await prisma.appSetting.upsert({
    where: { key: body.key },
    update: { value: body.value },
    create: { key: body.key, value: body.value },
  });

  await logAudit({
    userEntraId: auth.session.user.entraId,
    userEmail: auth.session.user.email,
    action: "SETTINGS_UPDATED",
    entityType: "setting",
    entityId: body.key,
    details: { oldValue: oldSetting?.value, newValue: body.value },
  });

  return NextResponse.json(setting);
}
