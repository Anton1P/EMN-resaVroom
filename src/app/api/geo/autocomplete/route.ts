// GET /api/geo/autocomplete?q=... — Proxy vers BAN (autocomplétion villes)

import { NextRequest, NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/api-helpers";
import { searchAddress } from "@/lib/services/geo-service";

export async function GET(request: NextRequest) {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchAddress(q);
  return NextResponse.json(results);
}
