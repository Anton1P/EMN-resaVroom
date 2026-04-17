/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Trash2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: admins, error: adminsError, mutate: mutateAdmins } = useSWR<  any[]>("/api/admin/admins", fetcher);
  const { data: services, error: servicesError, mutate: mutateServices } = useSWR<  any[]>("/api/admin/services", fetcher);

  // States pour ajouter un Admin
  const [newAdminEmail, setNewAdminEmail] = useState("");
  // NOTE: Dans une vraie intégration avec Entra ID, on utiliserait le composant de recherche /api/users/search
  // pour trouver l&#39;utilisateur et récupérer son entraId. Pour le mode de développement, on saisit les deux manuellement.
  const [newAdminEntraId, setNewAdminEntraId] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // States pour ajouter un Service
  const [newServiceName, setNewServiceName] = useState("");
  const [isAddingService, setIsAddingService] = useState(false);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEntraId) {
        toast.error("Veuillez remplir tous les champs.");
        return;
    }

    setIsAddingAdmin(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: newAdminEmail, userEntraId: newAdminEntraId }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de l&#39;ajout de l&#39;administrateur.");
      }

      toast.success("Administrateur ajouté avec succès.");
      setNewAdminEmail("");
      setNewAdminEntraId("");
      mutateAdmins();
    } catch (err:   any) {
      toast.error(err.message);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer les droits d&#39;administration de cet utilisateur ?")) return;

    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de la révocation.");
      }

      toast.success("Droits d&#39;administration révoqués.");
      mutateAdmins();
    } catch (err:   any) {
      toast.error(err.message);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;

    setIsAddingService(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName: newServiceName }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de l&#39;ajout du service.");
      }

      toast.success("Service ajouté avec succès.");
      setNewServiceName("");
      mutateServices();
    } catch (err:   any) {
      toast.error(err.message);
    } finally {
      setIsAddingService(false);
    }
  };

  const handleRemoveService = async (id: string) => {
     if (!confirm("Êtes-vous sûr de vouloir supprimer ce service de la liste blanche ?")) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de la suppression.");
      }

      toast.success("Service supprimé avec succès.");
      mutateServices();
    } catch (err:   any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Utilisateurs & Services</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>

        {/* Section Administrateurs */}
        <section>
          <Card>
            <CardBody>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ShieldCheck size={24} style={{ color: "var(--color-primary)" }} />
                  <h2 className="text-xl font-bold">Administrateurs</h2>
              </div>
              <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                  Les administrateurs ont accès à l&#39;ensemble du panel d&#39;administration.
                  <br/><em>Note: En mode développement, l&#39;Entra ID doit être saisi manuellement.</em>
              </p>

              <form onSubmit={handleAddAdmin} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", alignItems: "center" }}>
                 <div style={{ flex: 1, marginBottom: "-1rem" }}>
                   <Input type="email" placeholder="Email (ex: jean@entreprise.fr)" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required />
                 </div>
                 <div style={{ flex: 1, marginBottom: "-1rem" }}>
                   <Input type="text" placeholder="Entra ID" value={newAdminEntraId} onChange={e => setNewAdminEntraId(e.target.value)} required />
                 </div>
                 <Button type="submit" variant="primary" disabled={isAddingAdmin}>
                    <UserPlus size={18} /> Ajouter
                 </Button>
              </form>

              {adminsError ? (
                <div className="text-danger">Erreur de chargement des admins.</div>
            ) : !admins ? (
                <div>Chargement...</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ paddingBottom: "0.5rem" }}>Email</th>
                      <th style={{ paddingBottom: "0.5rem" }}>Ajouté le</th>
                      <th style={{ paddingBottom: "0.5rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "0.75rem 0", fontWeight: 500 }}>{admin.userEmail}</td>
                        <td style={{ padding: "0.75rem 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                            {format(new Date(admin.createdAt), "dd MMM yyyy", { locale: fr })}
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                           <Button variant="ghost" size="sm" style={{ color: "var(--color-danger)" }} onClick={() => handleRevokeAdmin(admin.id)} title="Révoquer">
                              <Trash2 size={16} />
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
            </CardBody>
          </Card>
        </section>

        {/* Section Services autorisés */}
        <section>
          <Card>
            <CardBody>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ShieldAlert size={24} style={{ color: "var(--color-primary)" }} />
                  <h2 className="text-xl font-bold">Services Autorisés (Liste blanche)</h2>
              </div>
              <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                  Ces services peuvent être sélectionnés lors de la configuration de certains paramètres ou accès spécifiques de l&#39;entreprise.
              </p>

              <form onSubmit={handleAddService} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", alignItems: "center" }}>
                 <div style={{ flex: 1, marginBottom: "-1rem" }}>
                   <Input type="text" placeholder="Nom du service (ex: IT, RH, Compta)" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} required />
                 </div>
                 <Button type="submit" variant="primary" disabled={isAddingService}>
                    <Plus size={18} /> Ajouter
                 </Button>
              </form>

              {servicesError ? (
                  <div className="text-danger">Erreur de chargement des services.</div>
              ) : !services ? (
                <div>Chargement...</div>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ paddingBottom: "0.5rem" }}>Service</th>
                      <th style={{ paddingBottom: "0.5rem" }}>Ajouté le</th>
                      <th style={{ paddingBottom: "0.5rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "0.75rem 0", fontWeight: 500 }}>{service.serviceName}</td>
                        <td style={{ padding: "0.75rem 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                            {format(new Date(service.createdAt), "dd MMM yyyy", { locale: fr })}
                        </td>
                        <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                           <Button variant="ghost" size="sm" style={{ color: "var(--color-danger)" }} onClick={() => handleRemoveService(service.id)} title="Supprimer">
                              <Trash2 size={16} />
                           </Button>
                        </td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ padding: "1rem 0", textAlign: "center", color: "var(--color-text-muted)" }}>
                                Aucun service configuré.
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </section>

      </div>
    </div>
  );
}

function Plus({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
