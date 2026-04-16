import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthSession } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(campuses);
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
