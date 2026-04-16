/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminTripsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // all, SCHEDULED, CANCELLED
  const [dateFilter, setDateFilter] = useState("");

  // Construit l&#39;URL avec les paramètres
  const url = new URL("/api/admin/trips", window.location.origin);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("limit", "15");
  if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
  if (dateFilter) url.searchParams.set("date", dateFilter);

  const { data, error, mutate } = useSWR(url.pathname + url.search, fetcher);

  // Etat pour la modale de confirmation
  const [tripToDelete, setTripToDelete] = useState<  any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/trips/${tripToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de la suppression.");
      }

      toast.success("Le trajet a été annulé avec succès. Les passagers ont été notifiés.");
      setTripToDelete(null);
      mutate();
    } catch (err:   any) {
      toast.error(err.message || "Une erreur est survenue.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestion des Trajets</h1>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
         <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Statut</label>
            <select className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: "100%" }}>
                <option value="all">Tous (sauf annulés par défaut si non spécifié, mais ici tous)</option>
                <option value="SCHEDULED">Planifiés/En cours</option>
                <option value="CANCELLED">Annulés</option>
            </select>
         </div>
         <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Date exacte</label>
            <input type="date" className="input" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} style={{ width: "100%" }} />
         </div>
         <button className="btn btn-ghost" onClick={() => { setStatusFilter("all"); setDateFilter(""); setPage(1); }} title="Réinitialiser les filtres">
            Réinitialiser
         </button>
      </div>

      {/* Liste des trajets */}
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        {error ? (
           <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-danger)" }}>Erreur lors du chargement des trajets.</div>
        ) : !data ? (
           <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
                  <th style={{ padding: "1rem" }}>Date & Heure</th>
                  <th style={{ padding: "1rem" }}>Conducteur</th>
                  <th style={{ padding: "1rem" }}>Véhicule</th>
                  <th style={{ padding: "1rem" }}>Itinéraire</th>
                  <th style={{ padding: "1rem" }}>Passagers</th>
                  <th style={{ padding: "1rem" }}>Statut</th>
                  <th style={{ padding: "1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.trips.map((trip:   any) => (
                  <tr key={trip.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{format(new Date(trip.departureTime), "dd MMM yyyy", { locale: fr })}</div>
                        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{format(new Date(trip.departureTime), "HH:mm")}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 500 }}>{trip.driverDisplayName}</div>
                        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{trip.driverEmail}</div>
                    </td>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                        <div className="badge badge-outline" style={{ display: "inline-flex" }}>{trip.vehicle.licensePlate}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.9rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <strong>{trip.originCampus.name}</strong>
                            {" → "}
                            <strong>{trip.destinationCampus?.name || trip.destinationOtherLabel}</strong>
                        </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div className="badge badge-neutral">{trip.passengers.length}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                        {trip.status === "CANCELLED" ? (
                            <span className="badge badge-danger">Annulé</span>
                        ) : (
                            <span className={`badge ${trip.displayStatus === "completed" ? "badge-neutral" : trip.displayStatus === "in_progress" ? "badge-warning" : "badge-success"}`}>
                                {trip.displayStatus === "completed" ? "Terminé" : trip.displayStatus === "in_progress" ? "En cours" : "Planifié"}
                            </span>
                        )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                        {trip.status !== "CANCELLED" && (
                            <button className="btn btn-ghost btn-sm text-danger" style={{ color: "var(--color-danger)" }} onClick={() => setTripToDelete(trip)} title="Forcer l&#39;annulation">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
                {data.trips.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                      Aucun trajet ne correspond à ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
                <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)" }}>
                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                        Page {data.pagination.page} sur {data.pagination.totalPages} ({data.pagination.total} trajets)
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
                        <button className="btn btn-outline btn-sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
                    </div>
                </div>
            )}
          </>
        )}
      </div>

      {/* Modale de confirmation de suppression */}
      {tripToDelete && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="modal card" style={{ width: "100%", maxWidth: "450px", padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", color: "var(--color-danger)" }}>
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold" style={{ color: "inherit" }}>Forcer l&#39;annulation</h2>
            </div>

            <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                Êtes-vous sûr de vouloir annuler ce trajet du <strong>{format(new Date(tripToDelete.departureTime), "dd/MM/yyyy à HH:mm")}</strong> ?
            </p>
            <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                Cette action est irréversible. Un email sera automatiquement envoyé au conducteur et aux {tripToDelete.passengers.length} passager(s).
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button className="btn btn-ghost" onClick={() => setTripToDelete(null)} disabled={isDeleting}>Annuler</button>
                <button className="btn btn-primary" style={{ backgroundColor: "var(--color-danger)" }} onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Annulation..." : "Confirmer l&#39;annulation"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
