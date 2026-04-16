/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("all");

  // Construit l&#39;URL avec les paramètres
  const url = new URL("/api/admin/audit", window.location.origin);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("limit", "15");
  if (entityType !== "all") url.searchParams.set("entityType", entityType);

  const { data, error } = useSWR(url.pathname + url.search, fetcher);

  const renderDetails = (details:   any) => {
    if (!details) return "-";
    try {
        return (
            <pre style={{ margin: 0, fontSize: "0.8rem", whiteSpace: "pre-wrap", background: "var(--color-bg-secondary)", padding: "0.5rem", borderRadius: "4px" }}>
                {JSON.stringify(details, null, 2)}
            </pre>
        );
    } catch {
        return "Données invalides";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Journal d&#39;Audit</h1>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
         <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Type d&#39;entité</label>
            <select className="select" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} style={{ width: "100%" }}>
                <option value="all">Tous</option>
                <option value="trip">Trajets</option>
                <option value="vehicle">Véhicules</option>
                <option value="admin">Administrateurs</option>
                <option value="service">Services autorisés</option>
                <option value="setting">Paramètres</option>
            </select>
         </div>
      </div>

      {/* Liste d&#39;audit */}
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {error ? (
           <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-danger)" }}>Erreur lors du chargement des logs.</div>
        ) : !data ? (
           <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
                  <th style={{ padding: "1rem" }}>Date</th>
                  <th style={{ padding: "1rem" }}>Utilisateur</th>
                  <th style={{ padding: "1rem" }}>Action</th>
                  <th style={{ padding: "1rem" }}>Entité</th>
                  <th style={{ padding: "1rem" }}>Détails</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log:   any) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)", verticalAlign: "top" }}>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.9rem" }}>{log.userEmail}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <div className="badge badge-neutral" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{log.action}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{log.entityType}</span>
                        <div style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{log.entityId}</div>
                    </td>
                    <td style={{ padding: "1rem", maxWidth: "300px" }}>
                        {renderDetails(log.details)}
                    </td>
                  </tr>
                ))}
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                      Aucun log trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)" }}>
                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                        Page {data.page} sur {data.totalPages} ({data.total} logs)
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-outline btn-sm" disabled={data.page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
                        <button className="btn btn-outline btn-sm" disabled={data.page === data.totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
