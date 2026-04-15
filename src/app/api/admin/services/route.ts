// GET /api/admin/services — Liste des services autorisés
// POST /api/admin/services — Ajouter un service

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleBusinessError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

export async function GET() {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const services = await prisma.authorizedService.findMany({
    orderBy: { serviceName: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();

    if (!body.serviceName) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "serviceName est requis." },
        { status: 400 }
      );
    }

    const service = await prisma.authorizedService.create({
      data: { serviceName: body.serviceName },
    });

    await logAudit({
      userEntraId: auth.session.user.entraId,
      userEmail: auth.session.user.email,
      action: "SERVICE_ADDED",
      entityType: "service",
      entityId: service.id,
      details: { serviceName: body.serviceName },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return handleBusinessError(error);
  }
}
