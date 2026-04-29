/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Car,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Edit,
  Wrench,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminVehiclesPage() {
  const {
    data: vehicles,
    error,
    mutate,
  } = useSWR<any[]>("/api/vehicles", fetcher);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 15;

  // Form states
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [seats, setSeats] = useState(5);
  const [defaultCampusId, setDefaultCampusId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les campus à partir des véhicules existants (simplification) ou idéalement fetch /api/campuses (si ça existait)
  // Comme il n'y a pas d&#39;endpoint GET /api/campuses on peut utiliser ceux disponibles sur les véhicules (ils ont un defaultCampus).
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (vehicles && vehicles.length > 0 && campuses.length === 0) {
      const uniqueCampuses = new Map();
      vehicles.forEach((v) => {
        if (v.defaultCampus) {
          uniqueCampuses.set(v.defaultCampus.id, v.defaultCampus);
        }
      });
      setCampuses(Array.from(uniqueCampuses.values()));
    }
  }, [vehicles, campuses.length]);

  const openNewVehicleModal = () => {
    setEditingVehicle(null);
    setName("");
    setLicensePlate("");
    setSeats(5);
    setDefaultCampusId(campuses[0]?.id || "");
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setName(vehicle.name);
    setLicensePlate(vehicle.licensePlate);
    setSeats(vehicle.seats);
    setDefaultCampusId(vehicle.defaultCampusId);
    setIsModalOpen(true);
  };

  const handleToggleMaintenance = async (vehicle: any) => {
    const newStatus =
      vehicle.status === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE";

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Erreur lors de la modification du statut.");

      toast.success(`Le véhicule a été passé en statut: ${newStatus}`);
      mutate();
    } catch (err) {
      toast.error("Impossible de modifier le statut.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      licensePlate,
      seats,
      defaultCampusId,
    };

    try {
      const res = await fetch(
        editingVehicle
          ? `/api/admin/vehicles/${editingVehicle.id}`
          : "/api/admin/vehicles",
        {
          method: editingVehicle ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erreur serveur.");
      }

      toast.success(
        editingVehicle
          ? "Véhicule modifié avec succès."
          : "Véhicule ajouté avec succès.",
      );
      setIsModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div>Erreur de chargement des véhicules.</div>;
  if (!vehicles) return <div>Chargement...</div>;

  const totalPages = Math.ceil(vehicles.length / limit);
  const paginatedVehicles = vehicles.slice((page - 1) * limit, page * limit);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 className="text-2xl font-bold">Gestion des Véhicules</h1>
        <Button variant="primary" onClick={openNewVehicleModal}>
          <Plus size={18} />
          Ajouter un véhicule
        </Button>
      </div>

      <Card style={{ padding: "0" }}>
        {/* Pagination TOP */}
        {totalPages > 1 && (
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
              Page {page} sur {totalPages} ({vehicles.length} véhicules)
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
                disabled={page === totalPages}
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
                <th style={{ padding: "1rem" }}>Véhicule</th>
                <th style={{ padding: "1rem" }}>Immatriculation</th>
                <th style={{ padding: "1rem" }}>Places</th>
                <th style={{ padding: "1rem" }}>Campus d&#39;attache</th>
                <th style={{ padding: "1rem" }}>Statut</th>
                <th style={{ padding: "1rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.map((v) => (
                <tr
                  key={v.id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: "500" }}>
                    {v.name}
                  </td>
                  <td style={{ padding: "1rem" }}>{v.licensePlate}</td>
                  <td style={{ padding: "1rem" }}>{v.seats}</td>
                  <td style={{ padding: "1rem" }}>
                    {v.defaultCampus?.name || "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      className={`badge ${v.status === "AVAILABLE" ? "badge-success" : "badge-danger"}`}
                    >
                      {v.status === "AVAILABLE"
                        ? "Disponible"
                        : "En Maintenance"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(v)}
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant={
                          v.status === "AVAILABLE" ? "secondary" : "primary"
                        }
                        size="sm"
                        onClick={() => handleToggleMaintenance(v)}
                        title={
                          v.status === "AVAILABLE"
                            ? "Passer en maintenance"
                            : "Remettre disponible"
                        }
                      >
                        {v.status === "AVAILABLE" ? (
                          <Wrench size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedVehicles.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Aucun véhicule enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination BOTTOM */}
        {totalPages > 1 && (
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
              Page {page} sur {totalPages} ({vehicles.length} véhicules)
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
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal card"
            style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingVehicle ? "Modifier le véhicule" : "Nouveau véhicule"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Nom du véhicule
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Renault Megane Grise"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Plaque d&#39;immatriculation
                </label>
                <Input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  required
                  placeholder="AB-123-CD"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Nombre de places (conducteur inclus)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={9}
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                  required
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Campus d&#39;attache
                </label>
                <Select
                  value={defaultCampusId}
                  onChange={(e) => setDefaultCampusId(e.target.value)}
                  required
                  style={{ width: "100%" }}
                  options={[
                    { value: "", label: "Sélectionner un campus" },
                    ...campuses.map((c: any) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Enregistrement..."
                    : editingVehicle
                      ? "Modifier"
                      : "Ajouter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
