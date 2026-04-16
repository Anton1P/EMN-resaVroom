// src/app/trips/new/page.tsx
"use client";

import React, { Suspense } from "react";
import { TripWizard } from "@/components/trips/TripWizard";
import { useSearchParams } from "next/navigation";
import { Car } from "lucide-react";

function TripWizardWrapper() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const originCampusId = searchParams.get("originCampusId") || undefined;

  return <TripWizard initialVehicleId={vehicleId} initialOriginCampusId={originCampusId} />;
}

export default function NewTripPage() {
  return (
    <div className="dashboard-page animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Réserver un véhicule</h1>
          <p>Trouvez un véhicule disponible ou rejoignez un covoiturage en cours.</p>
        </div>
      </div>

      <section className="dashboard-section">
        {/* Next.js utilise useSearchParams, il faut l'envelopper dans Suspense sinon 
           le composant force le rendu dynamique sur toute la route au moment du build */}
        <Suspense fallback={<div className="ds-loading"><span className="spinner text-primary text-xl">⏳ Chargement du formulaire...</span></div>}>
          <TripWizardWrapper />
        </Suspense>
      </section>
    </div>
  );
}
