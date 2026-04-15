// src/app/api/auth/check-admin/route.ts — Route de vérification du rôle admin (debug)

import { NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const entraId = session.user.entraId;
  const adminStatus = await isAdmin(entraId);

  return NextResponse.json({
    user: {
      name: session.user.name,
      email: session.user.email,
      entraId,
    },
    isAdmin: adminStatus,
  });
}
