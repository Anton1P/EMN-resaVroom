/* eslint-disable @typescript-eslint/no-explicit-any */
// PATCH /api/admin/vehicles/[id] — Modifier un véhicule

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, handleBusinessError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminSession();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();

    const oldVehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!oldVehicle) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Véhicule non trouvé." }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        licensePlate: body.licensePlate !== undefined ? body.licensePlate : undefined,
        seats: body.seats !== undefined ? parseInt(body.seats, 10) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        defaultCampusId: body.defaultCampusId !== undefined ? body.defaultCampusId : undefined,
      },
    });

    let action: any = "VEHICLE_UPDATED";
    if (oldVehicle.status !== vehicle.status) {
      action = vehicle.status === "MAINTENANCE" ? "VEHICLE_MAINTENANCE_ON" : "VEHICLE_MAINTENANCE_OFF";
    }

    await logAudit({
      userEntraId: auth.session.user.entraId,
      userEmail: auth.session.user.email,
      action,
      entityType: "vehicle",
      entityId: vehicle.id,
      details: { changedFields: body },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return handleBusinessError(error);
  }
}
