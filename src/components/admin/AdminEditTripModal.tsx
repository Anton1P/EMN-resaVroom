import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { UserSearchAutocomplete, UserSuggestion } from "@/components/ui/UserSearchAutocomplete";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AdminEditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any; // The trip object to edit
  onSuccess: () => void;
}

export function AdminEditTripModal({ isOpen, onClose, trip, onSuccess }: AdminEditTripModalProps) {
  const { data: campuses } = useSWR<any[]>("/api/campuses", fetcher);
  const { data: vehicles } = useSWR<any[]>("/api/vehicles", fetcher);

  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState("");
  const [originCampusId, setOriginCampusId] = useState("");
  const [destinationCampusId, setDestinationCampusId] = useState("");
  const [destinationOtherLabel, setDestinationOtherLabel] = useState("");
  
  const [departureTime, setDepartureTime] = useState("");
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState("");
  const [returnDepartureTime, setReturnDepartureTime] = useState("");
  const [estimatedReturnArrivalTime, setEstimatedReturnArrivalTime] = useState("");

  const [driver, setDriver] = useState<UserSuggestion | null>(null);

  useEffect(() => {
    if (trip && isOpen) {
      setVehicleId(trip.vehicleId || "");
      setType(trip.type || "ONE_WAY");
      setOriginCampusId(trip.originCampusId || "");
      setDestinationCampusId(trip.destinationCampusId || "");
      setDestinationOtherLabel(trip.destinationOtherLabel || "");

      const toLocalDatetime = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
        return localISOTime;
      };

      setDepartureTime(toLocalDatetime(trip.departureTime));
      setEstimatedArrivalTime(toLocalDatetime(trip.estimatedArrivalTime));
      setReturnDepartureTime(toLocalDatetime(trip.returnDepartureTime));
      setEstimatedReturnArrivalTime(toLocalDatetime(trip.estimatedReturnArrivalTime));

      if (trip.driverEntraId) {
        setDriver({
          entraId: trip.driverEntraId,
          displayName: trip.driverDisplayName || "",
          email: trip.driverEmail || ""
        });
      } else {
        setDriver(null);
      }
    }
  }, [trip, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload: any = {
      vehicleId,
      type,
      originCampusId,
      departureTime: new Date(departureTime).toISOString(),
      estimatedArrivalTime: new Date(estimatedArrivalTime).toISOString(),
    };

    if (driver) {
      payload.driverEntraId = driver.entraId;
      payload.driverEmail = driver.email;
      payload.driverDisplayName = driver.displayName;
    }

    if (destinationCampusId) {
      payload.destinationCampusId = destinationCampusId;
      payload.destinationOtherLabel = null;
    } else {
      payload.destinationCampusId = null;
      payload.destinationOtherLabel = destinationOtherLabel;
    }

    if (type !== "ONE_WAY") {
      if (!returnDepartureTime || !estimatedReturnArrivalTime) {
        toast.error("Veuillez spécifier les dates de retour.");
        setIsLoading(false);
        return;
      }
      payload.returnDepartureTime = new Date(returnDepartureTime).toISOString();
      payload.estimatedReturnArrivalTime = new Date(estimatedReturnArrivalTime).toISOString();
    } else {
      payload.returnDepartureTime = null;
      payload.estimatedReturnArrivalTime = null;
    }

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur lors de la modification.");
      }

      toast.success("Trajet modifié avec succès.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le trajet (Admin)">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Conducteur</label>
          <UserSearchAutocomplete 
            placeholder="Rechercher un conducteur..."
            defaultValue={trip?.driverDisplayName ? `${trip.driverDisplayName} (${trip.driverEmail})` : ""}
            onSelect={(user) => setDriver(user)}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Véhicule</label>
          <Select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            options={[
              { value: "", label: "Sélectionner un véhicule" },
              ...(vehicles || []).map((v: any) => ({ value: v.id, label: `${v.name} (${v.licensePlate})` }))
            ]}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Type de trajet</label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: "ONE_WAY", label: "Aller simple" },
              { value: "ROUND_TRIP", label: "Aller-retour" },
              { value: "ROUND_TRIP_OTHER", label: "Aller-retour prolongé" }
            ]}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Origine</label>
            <Select
              value={originCampusId}
              onChange={(e) => setOriginCampusId(e.target.value)}
              options={[
                { value: "", label: "Sélectionner un campus" },
                ...(campuses || []).map((c: any) => ({ value: c.id, label: c.name }))
              ]}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Destination Campus</label>
            <Select
              value={destinationCampusId}
              onChange={(e) => {
                setDestinationCampusId(e.target.value);
                if (e.target.value) setDestinationOtherLabel("");
              }}
              options={[
                { value: "", label: "Autre destination..." },
                ...(campuses || []).map((c: any) => ({ value: c.id, label: c.name }))
              ]}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {!destinationCampusId && (
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Destination (Autre)</label>
            <Input
              type="text"
              value={destinationOtherLabel}
              onChange={(e) => setDestinationOtherLabel(e.target.value)}
              placeholder="Adresse ou nom du lieu"
              required={!destinationCampusId}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Départ</label>
            <Input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Arrivée estimée</label>
            <Input
              type="datetime-local"
              value={estimatedArrivalTime}
              onChange={(e) => setEstimatedArrivalTime(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {type !== "ONE_WAY" && (
          <div style={{ display: "flex", gap: "1rem", backgroundColor: "var(--color-bg-secondary)", borderRadius: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Retour</label>
              <Input
                type="datetime-local"
                value={returnDepartureTime}
                onChange={(e) => setReturnDepartureTime(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Arrivée retour estimée</label>
              <Input
                type="datetime-local"
                value={estimatedReturnArrivalTime}
                onChange={(e) => setEstimatedReturnArrivalTime(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>Annuler</Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
