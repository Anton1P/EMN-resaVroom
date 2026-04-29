"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Database, Trash2, RefreshCw } from "lucide-react";
import { Card, CardBody, CardTitle, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { getNeonMetrics, cleanupDatabase } from "@/app/admin/settings/actions";

function MetricCard({ title, data, unit }: { title: string, data: any, unit: string }) {
  if (!data) return null;
  const isDanger = data.percent >= 80;
  
  return (
    <div style={{ padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", display: "flex", flexDirection: "column" }}>
        <h5 style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>{title}</h5>
        <div style={{ marginTop: "0.5rem", fontSize: "1.4rem", fontWeight: "bold", color: isDanger ? "var(--color-danger, #ef4444)" : "var(--color-success, #22c55e)" }}>
            {data.value} <span style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", fontWeight: "normal" }}>/ {data.limit} {unit}</span>
        </div>
        <div style={{ 
          marginTop: "0.5rem", 
          height: "4px", 
          width: "100%", 
          backgroundColor: "var(--color-border)", 
          borderRadius: "2px",
          overflow: "hidden"
        }}>
          <div style={{ 
             width: `${Math.min(data.percent, 100)}%`, 
             height: "100%", 
             backgroundColor: isDanger ? "var(--color-danger, #ef4444)" : "var(--color-success, #22c55e)",
             transition: "width 0.3s ease" 
          }} />
        </div>
    </div>
  );
}

export function DatabaseControls() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningTarget, setCleaningTarget] = useState<"TRIPS" | "AUDIT_LOGS">("TRIPS");
  const [tripStatus, setTripStatus] = useState<string>("ALL");

  const fetchMetrics = async () => {
     setLoadingMetrics(true);
     try {
       const m = await getNeonMetrics();
       setMetrics(m);
     } catch(e: any) {
       toast.error(e.message);
     } finally {
       setLoadingMetrics(false);
     }
  };

  useEffect(() => {
     fetchMetrics();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCleanup = async () => {
     if(!window.confirm("Êtes-vous sûr de vouloir supprimer ces données (antérieures à 1 mois) ? Cette action est irréversible et supprimera en cascade toutes les données rattachées.")) return;
     
     setIsCleaning(true);
     try {
       const count = await cleanupDatabase(cleaningTarget, tripStatus);
       toast.success(`${count} enregistrement(s) supprimé(s) avec succès.`);
     } catch(e: any) {
       toast.error(e.message);
     } finally {
       setIsCleaning(false);
     }
  }

  return (
    <Card style={{ width: "100%" }}>
        <CardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <Database size={24} style={{ color: "var(--color-primary)" }} />
              Base de données & Stockage
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchMetrics} disabled={loadingMetrics}>
             <RefreshCw size={16} className={loadingMetrics ? "animate-spin" : ""} style={{ marginRight: '8px' }} />
             Actualiser
          </Button>
        </CardHeader>
        <CardBody>
          {loadingMetrics && !metrics && (
             <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>
               Chargement des métriques Neon...
             </div>
          )}
          
          {metrics && (
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <MetricCard title="Compute" data={metrics.compute} unit="CU-hrs" />
                <MetricCard title="Stockage données" data={metrics.storage} unit="GB" />
                <MetricCard title="Réseau sortant" data={metrics.network} unit="GB" />
                <MetricCard title="Branches actives" data={metrics.branches} unit="" />
             </div>
          )}

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
             <h4 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Nettoyage Périodique</h4>
             <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Supprimez les données obsolètes stockées il y a <strong>plus de 1 mois</strong> pour libérer de l'espace.
             </p>
             
             <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Cible à nettoyer</label>
                  <Select
                    value={cleaningTarget}
                    onChange={(e) => setCleaningTarget(e.target.value as "TRIPS" | "AUDIT_LOGS")}
                    options={[
                      { value: "TRIPS", label: "Trajets (et réservations)" },
                      { value: "AUDIT_LOGS", label: "Journaux d'audit" }
                    ]}
                    style={{ width: "100%" }}
                  />
                </div>
                
                {cleaningTarget === "TRIPS" && (
                   <div style={{ flex: 1, minWidth: "150px" }}>
                     <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Statut des trajets</label>
                     <Select
                         value={tripStatus}
                         onChange={(e) => setTripStatus(e.target.value)}
                         options={[
                            { value: "ALL", label: "Tous les statuts" },
                            { value: "CANCELLED", label: "Annulés uniquement" },
                            { value: "SCHEDULED", label: "Planifiés / Terminés" }
                         ]}
                         style={{ width: "100%" }}
                     />
                   </div>
                )}

                <Button variant="danger" disabled={isCleaning} onClick={handleCleanup}>
                   <Trash2 size={16} style={{ marginRight: '8px' }} />
                   {isCleaning ? "Suppression..." : "Nettoyer"}
                </Button>
             </div>
          </div>
        </CardBody>
    </Card>
  );
}
