// POST /api/trips/[id]/passengers — Ajouter un passager
// DELETE handled via /api/trips/[id]/passengers/[passengerId]

import { NextRequest, NextResponse } from "next/server";
import { requireAuthSession, handleBusinessError } from "@/lib/api-helpers";
import { addPassenger } from "@/lib/services/trip-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  const { id: tripId } = await params;

  try {
    const body = await request.json();
    const addedBy = body.addedBy ?? "SELF";

    if (addedBy === "SELF") {
      // L'utilisateur s'inscrit lui-même
      await addPassenger(
        tripId,
        auth.session.user.entraId,
        auth.session.user.email,
        auth.session.user.name,
        "SELF",
        auth.session.user.entraId,
        auth.session.user.email
      );
    } else if (addedBy === "DRIVER") {
      // Le conducteur ajoute un passager
      if (!body.userEntraId || !body.userEmail || !body.userDisplayName) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", message: "userEntraId, userEmail et userDisplayName sont requis pour addedBy=DRIVER." },
          { status: 400 }
        );
      }

      await addPassenger(
        tripId,
        body.userEntraId,
        body.userEmail,
        body.userDisplayName,
        "DRIVER",
        auth.session.user.entraId,
        auth.session.user.email
      );
    } else {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "addedBy doit être 'SELF' ou 'DRIVER'." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Passager ajouté." }, { status: 201 });
  } catch (error) {
    return handleBusinessError(error);
  }
}
