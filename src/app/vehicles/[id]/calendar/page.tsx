"use client";

import React, { use } from 'react';
import useSWR from 'swr';
import { VehicleCalendar } from '@/components/vehicles/VehicleCalendar';
import { ArrowLeft, Car } from 'lucide-react';
import Link from 'next/link';
import { DashboardTrip } from '@/hooks/use-trips';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function VehicleCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  // We fetch vehicle details and trips associated with the vehicle
  // For simplicity, we use the trips API filtered by vehicleId
  // (Assuming the backend supports ?vehicleId=... as specified in SAD section 8.3)
  const { data: vehicleData, error: vehicleError, isLoading: vehicleLoading } = useSWR(
    `/api/vehicles/${resolvedParams.id}`,
    fetcher
  );

  const { data: tripsData, error: tripsError, isLoading: tripsLoading } = useSWR(
    `/api/trips?vehicleId=${resolvedParams.id}&status=upcoming`, // Ideally we fetch all or a date range
    fetcher
  );

  if (vehicleLoading || tripsLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ height: '600px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (vehicleError || tripsError || (vehicleData && vehicleData.error)) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center', color: 'var(--color-danger)' }}>
        <h1>Erreur</h1>
        <p>Impossible de charger le calendrier de ce véhicule.</p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const trips: DashboardTrip[] = tripsData?.trips || [];

  // Format trips for the calendar component
  const calendarTrips = trips.map((t) => ({
    id: t.id,
    departureTime: t.departureTime,
    endTime: t.estimatedReturnArrivalTime || t.estimatedArrivalTime, // Needs to account for buffers ideally
    type: t.type,
    driverName: t.driverDisplayName,
    destination: t.type === 'ROUND_TRIP_OTHER' ? t.destinationOtherLabel || "" : t.destinationCampus?.name || ""
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft size={18} /> Retour au tableau de bord
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Car size={32} /> Calendrier - {vehicleData.name}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
            Immatriculation : {vehicleData.licensePlate}
          </p>
        </div>
      </div>

      <VehicleCalendar vehicleId={resolvedParams.id} trips={calendarTrips} />
    </div>
  );
}
