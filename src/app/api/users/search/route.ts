// GET /api/users/search?q=... — Recherche d'utilisateurs
// En mode dev : retourne les utilisateurs simulés.
// En production : appelle Microsoft Graph API.

import { NextRequest, NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/api-helpers";

// Utilisateurs simulés pour le développement (même liste que auth.ts)
const DEV_USERS = [
  { entraId: "TO_BE_CONFIGURED", displayName: "Admin Dev", email: "admin@entreprise.fr" },
  { entraId: "dev-user-entra-001", displayName: "Jean Dupont", email: "jean.dupont@entreprise.fr" },
  { entraId: "dev-user-entra-002", displayName: "Marie Martin", email: "marie.martin@entreprise.fr" },
];

export async function GET(request: NextRequest) {
  const auth = await requireAuthSession();
  if ("error" in auth) return auth.error;

  const q = request.nextUrl.searchParams.get("q")?.toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // TODO: Remplacer par un appel Graph API quand les credentials Entra ID seront disponibles
  // GET https://graph.microsoft.com/v1.0/users
  //   ?$filter=startswith(displayName,'${q}') or startswith(mail,'${q}')
  //   &$select=id,displayName,mail
  //   &$top=5

  const results = DEV_USERS.filter(
    (u) =>
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );

  return NextResponse.json(results);
}
