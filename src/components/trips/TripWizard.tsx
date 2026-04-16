// src/components/trips/TripWizard.tsx
"use client";

import React, { useState } from "react";
import { StepSearch, TripSearchParams } from "./StepSearch";
import { StepConfirm } from "./StepConfirm";
import { VehicleWithPosition } from "@/hooks/use-vehicles";
import { DashboardTrip } from "@/hooks/use-trips";
import { Card, CardBody } from "@/components/ui/Card";
import { Users, Info, Settings, Car } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Step = 1 | 2 | 3;

interface AvailableVehicle {
  id: string;
  name: string;
  licensePlate: string;
  seats: number;
}

interface TripWizardProps {
  initialVehicleId?: string;
  initialOriginCampusId?: string;
}

export function TripWizard({ initialVehicleId, initialOriginCampusId }: TripWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [searchParams, setSearchParams] = useState<TripSearchParams | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);
  const [suggestedTrips, setSuggestedTrips] = useState<DashboardTrip[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<AvailableVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchResults = (
    params: TripSearchParams,
    vehicles: AvailableVehicle[],
    trips: DashboardTrip[]
  ) => {
    setSearchParams(params);
    setAvailableVehicles(vehicles);
    setSuggestedTrips(trips);
    // On reste à l'étape 1 pour que l'utilisateur choisisse son véhicule
  };

  const handleBookVehicle = (vehicle: AvailableVehicle) => {
    setSelectedVehicle(vehicle);
    setStep(2);
  };

  const handleConfirm = async (payload: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "VEHICLE_CONFLICT") {
          toast.error("Conflit de réservation !", { 
            description: "Ce véhicule vient d'être réservé par quelqu'un d'autre pour ce créneau." 
          });
          setStep(1);
          return;
        }
        throw new Error(data.message || "Erreur lors de la réservation.");
      }

      toast.success("Réservation confirmée !");
      router.push(`/trips/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-content">
      <div className="wizard-steps">
        <div className={`wizard-step ${step >= 1 ? (step > 1 ? "completed" : "active") : ""}`}>
          <div className="wizard-step-circle">1</div>
          Recherche
        </div>
        <div className={`wizard-step ${step >= 2 ? (step > 2 ? "completed" : "active") : ""}`}>
          <div className="wizard-step-circle">2</div>
          Confirmation
        </div>
        <div className={`wizard-step ${step === 3 ? "active" : ""}`}>
          <div className="wizard-step-circle">3</div>
          Terminé
        </div>
      </div>

      {step === 1 && (
        <div className="animate-fade-in">
          <Card className="mb-8">
            <CardBody>
              <StepSearch 
                onResults={handleSearchResults} 
                initialParams={{
                  originCampusId: initialOriginCampusId
                }}
              />
            </CardBody>
          </Card>

          {searchParams && (
            <div className="animate-slide-up">
              {suggestedTrips.length > 0 && (
                <div className="carpool-suggestion">
                  <h4><Users size={20} /> Covoiturage suggéré</h4>
                  <p className="mb-2 text-sm text-[var(--color-success)]">
                    Des trajets correspondent déjà à vos critères. Pourquoi ne pas vous joindre à eux ?
                  </p>
                  <div className="flex flex-col gap-2">
                    {suggestedTrips.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded flex justify-between items-center text-[var(--color-text)]">
                        <div>
                          <strong>{t.originCampus.name} → {t.destinationCampus?.name || t.destinationOtherLabel}</strong>
                          <div className="text-sm text-[var(--color-text-secondary)]">Conduit par {t.driverDisplayName} • {t.seatsAvailable} place(s) restante(s)</div>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => router.push(`/trips/${t.id}`)}
                        >
                          Voir le trajet
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="vehicle-results-title">
                Véhicules disponibles ({availableVehicles.length})
              </h3>
              
              {availableVehicles.length === 0 ? (
                <div className="ds-empty-state">
                  <Info size={40} className="ds-empty-icon" />
                  <p className="ds-empty-title">Aucun véhicule trouvé</p>
                  <p className="ds-empty-desc">Il n'y a malheureusement aucun véhicule disponible pour ce créneau sur ce campus.</p>
                </div>
              ) : (
                <div className="vehicle-results-grid">
                  {availableVehicles.map(veh => (
                    <div key={veh.id} className="vehicle-result-card">
                      <div className="vehicle-result-body">
                        <div className="vehicle-result-header">
                          <h3 className="vehicle-result-title">
                            {veh.name}
                          </h3>
                          <span className="vehicle-result-badge">
                            Disponible
                          </span>
                        </div>
                        <div className="vehicle-result-info">
                          <div className="vehicle-result-info-row">
                            <Settings size={16} className="vehicle-result-info-icon" />
                            <span>Immat. : <strong className="vehicle-result-info-val">{veh.licensePlate}</strong></span>
                          </div>
                          <div className="vehicle-result-info-row">
                            <Users size={16} className="vehicle-result-info-icon" />
                            <span>Capacité : <strong className="vehicle-result-info-val">{veh.seats} places</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="vehicle-result-footer">
                        <Button 
                          variant="primary" 
                          className="vehicle-result-select-btn" 
                          onClick={() => handleBookVehicle(veh)}
                        >
                          Choisir ce véhicule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 2 && searchParams && selectedVehicle && (
        <div className="animate-fade-in">
          <StepConfirm 
            params={searchParams}
            vehicle={selectedVehicle}
            onBack={() => setStep(1)}
            onConfirm={handleConfirm}
            isLoading={isSubmitting}
          />
        </div>
      )}

    </div>
  );
}
