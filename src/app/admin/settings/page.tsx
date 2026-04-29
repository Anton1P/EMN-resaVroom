/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";
import { Card, CardBody, CardTitle, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatabaseControls } from "@/components/admin/DatabaseControls";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminSettingsPage() {
  const {
    data: settings,
    error,
    mutate,
  } = useSWR<any[]>("/api/admin/settings", fetcher);

  const [bufferMinutes, setBufferMinutes] = useState("30");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && settings.length > 0) {
      const bufferSetting = settings.find(
        (s: any) => s.key === "buffer_minutes",
      );
      if (bufferSetting) {
        setBufferMinutes(bufferSetting.value);
      }
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "buffer_minutes", value: bufferMinutes }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la sauvegarde.");
      }

      toast.success("Paramètres mis à jour avec succès.");
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (error)
    return (
      <div className="text-danger">Erreur de chargement des paramètres.</div>
    );
  if (!settings) return <div>Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres Globaux</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: "1 1 400px", maxWidth: "600px" }}>
          <DatabaseControls />
        </div>

        <div style={{ flex: "1 1 400px", maxWidth: "600px" }}>
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <CardTitle
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Clock size={24} style={{ color: "var(--color-primary)" }} />
                Configuration de la flotte
              </CardTitle>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <p
                    className="text-muted"
                    style={{ fontSize: "0.9rem", marginBottom: "1rem" }}
                  >
                    C&#39;est le temps minimum nécessaire avant qu&#39;un
                    véhicule puisse être réservé à nouveau après un trajet.
                    Permet d&#39;absorber les retards et de garantir la
                    disponibilité.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <Input
                      type="number"
                      label="Temps de buffer entre les réservations"
                      min="0"
                      max="120"
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(e.target.value)}
                      required
                      style={{ width: "150px" }}
                    />
                    <span style={{ paddingTop: "25px" }}>minutes</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "1.5rem",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    <Save size={18} />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
