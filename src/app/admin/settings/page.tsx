/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminSettingsPage() {
  const { data: settings, error, mutate } = useSWR<  any[]>("/api/admin/settings", fetcher);

  const [bufferMinutes, setBufferMinutes] = useState("30");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && settings.length > 0) {
      const bufferSetting = settings.find((s:   any) => s.key === "buffer_minutes");
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
    } catch (err:   any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <div className="text-danger">Erreur de chargement des paramètres.</div>;
  if (!settings) return <div>Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres Globaux</h1>

      <div className="card" style={{ maxWidth: "600px" }}>
        <h2 className="text-xl font-bold mb-4" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={24} style={{ color: "var(--color-primary)" }} />
            Configuration de la flotte
        </h2>

        <form onSubmit={handleSave}>
            <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Temps de buffer entre les réservations (en minutes)
                </label>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                    C&#39;est le temps minimum nécessaire avant qu&#39;un véhicule puisse être réservé à nouveau après un trajet.
                    Permet d&#39;absorber les retards et de garantir la disponibilité.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <input
                        type="number"
                        min="0"
                        max="120"
                        className="input"
                        value={bufferMinutes}
                        onChange={(e) => setBufferMinutes(e.target.value)}
                        required
                        style={{ width: "150px" }}
                    />
                    <span>minutes</span>
                </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <Save size={18} />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
