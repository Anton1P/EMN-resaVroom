// GET /api/vehicles — Liste des véhicules avec position actuelle

import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/api-helpers";
import { getAllVehiclesWithPositions } from "@/lib/services/vehicle-service";

export async function GET() {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  try {
    const vehicles = await getAllVehiclesWithPositions();
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("[API] GET /api/vehicles error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur lors de la récupération des véhicules." },
      { status: 500 }
    );
  }
}
