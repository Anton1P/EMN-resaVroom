// src/app/dashboard/page.tsx — Page dashboard (placeholder Phase 6)

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Tableau de bord</h1>
      <p>Bienvenue, <strong>{session.user.name}</strong> ({session.user.email})</p>
      <p>Entra ID : <code>{session.user.entraId}</code></p>
      <p style={{ color: "#666", marginTop: "1rem" }}>
        Le contenu du dashboard sera implémenté en Phase 6.
      </p>
    </div>
  );
}
