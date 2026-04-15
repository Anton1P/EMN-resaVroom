// GET /api/vehicles/availability — Véhicules disponibles pour un créneau donné

import { NextRequest, NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/api-helpers";
import { getAvailableVehicles, getSuggestedTrips } from "@/lib/services/vehicle-service";

export async function GET(request: NextRequest) {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  const searchParams = request.nextUrl.searchParams;
  const originCampusId = searchParams.get("originCampusId");
  const departureTimeStr = searchParams.get("departureTime");
  const estimatedArrivalTimeStr = searchParams.get("estimatedArrivalTime");
  const returnDepartureTimeStr = searchParams.get("returnDepartureTime");
  const estimatedReturnArrivalTimeStr = searchParams.get("estimatedReturnArrivalTime");
  const destinationCampusId = searchParams.get("destinationCampusId");

  // Validation des paramètres requis
  if (!originCampusId || !departureTimeStr || !estimatedArrivalTimeStr) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "originCampusId, departureTime et estimatedArrivalTime sont requis." },
      { status: 400 }
    );
  }

  const departureTime = new Date(departureTimeStr);
  const estimatedArrivalTime = new Date(estimatedArrivalTimeStr);

  if (isNaN(departureTime.getTime()) || isNaN(estimatedArrivalTime.getTime())) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Les dates doivent être au format ISO 8601." },
      { status: 400 }
    );
  }

  try {
    const [availableVehicles, suggestedTrips] = await Promise.all([
      getAvailableVehicles({
        originCampusId,
        departureTime,
        estimatedArrivalTime,
        ...(returnDepartureTimeStr && { returnDepartureTime: new Date(returnDepartureTimeStr) }),
        ...(estimatedReturnArrivalTimeStr && { estimatedReturnArrivalTime: new Date(estimatedReturnArrivalTimeStr) }),
      }),
      getSuggestedTrips(originCampusId, destinationCampusId, departureTime),
    ]);

    return NextResponse.json({ availableVehicles, suggestedTrips });
  } catch (error) {
    console.error("[API] GET /api/vehicles/availability error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur lors de la recherche de disponibilité." },
      { status: 500 }
    );
  }
}
