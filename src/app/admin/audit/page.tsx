/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select } from "@/components/ui/Select";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("all");

  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("limit", "15");
  if (entityType !== "all") searchParams.set("entity", entityType);

  const url = `/api/admin/audit?${searchParams.toString()}`;
  const { data, error } = useSWR(url, fetcher);

  const renderDetails = (details: any) => {
    if (!details) return "-";
    try {
      return (
        <pre
          style={{
            margin: 0,
            fontSize: "0.8rem",
            whiteSpace: "pre-wrap",
            background: "var(--color-bg-secondary)",
            padding: "0.5rem",
            borderRadius: "4px",
          }}
        >
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
      <Card style={{ marginBottom: "1.5rem", overflow: "visible" }}>
        <CardBody
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "flex-end",
            flexWrap: "wrap",
            overflow: "visible",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <Select
              label="Type d&#39;entité"
              options={[
                { value: "all", label: "Tous" },
                { value: "trip", label: "Trajets" },
                { value: "vehicle", label: "Véhicules" },
                { value: "admin", label: "Administrateurs" },
                { value: "service", label: "Services autorisés" },
                { value: "setting", label: "Paramètres" },
              ]}
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              style={{ width: "100%" }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Liste d&#39;audit */}
      <Card style={{ padding: 0 }}>
        {error ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--color-danger)",
            }}
          >
            Erreur lors du chargement des logs.
          </div>
        ) : !data ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            Chargement...
          </div>
        ) : (
          <>
            {/* Pagination TOP */}
            {data.totalPages > 1 && (
              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                  Page {data.page} sur {data.totalPages} ({data.total} logs)
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}

            <div style={{ overflowX: "auto", transform: "rotateX(180deg)" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  transform: "rotateX(180deg)",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-bg-secondary)",
                    }}
                  >
                    <th style={{ padding: "1rem" }}>Date</th>
                    <th style={{ padding: "1rem" }}>Utilisateur</th>
                    <th style={{ padding: "1rem" }}>Action</th>
                    <th style={{ padding: "1rem" }}>Entité</th>
                    <th style={{ padding: "1rem" }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log: any) => (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        verticalAlign: "top",
                      }}
                    >
                      <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.9rem" }}>
                          {log.userEmail}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div
                          className="badge badge-neutral"
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {log.action}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {log.entityType}
                        </span>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {log.entityId}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", maxWidth: "300px" }}>
                        {renderDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                  {data.logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Aucun log trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination BOTTOM */}
            {data.totalPages > 1 && (
              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                  Page {data.page} sur {data.totalPages} ({data.total} logs)
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
