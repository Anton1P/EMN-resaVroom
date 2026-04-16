"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { TripCard } from '@/components/trips/TripCard';
import { DatePickerInput } from '@/components/ui/CustomCalendarPicker';
import { Select } from '@/components/ui/Select';
import { DashboardTrip } from '@/hooks/use-trips';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TripsPage() {
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [campusFilter, setCampusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [campuses, setCampuses] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/campuses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCampuses(data);
        } else {
          console.error("Campuses response is not an array:", data);
        }
      })
      .catch(err => console.error("Failed to fetch campuses", err));
  }, []);

  // Build query string
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.append('status', statusFilter);
  if (campusFilter) queryParams.append('originCampusId', campusFilter);
  if (dateFilter) queryParams.append('date', dateFilter);

  const { data, error, isLoading } = useSWR(
    `/api/trips?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const trips: DashboardTrip[] = data?.trips || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
          Rechercher un trajet
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Trouvez un trajet existant pour faire du covoiturage.
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
        backgroundColor: 'var(--color-surface)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Select
          label="Statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "upcoming", label: "À venir" },
            { value: "past", label: "Passés" },
            { value: "all", label: "Tous" }
          ]}
        />

        <Select
          label="Campus de départ"
          value={campusFilter}
          onChange={(e) => setCampusFilter(e.target.value)}
          options={[
            { value: "", label: "Tous les campus" },
            ...campuses.map(c => ({ value: c.id, label: c.name }))
          ]}
        />

        <DatePickerInput
          label="Date du trajet"
          value={dateFilter}
          onChange={(val) => setDateFilter(val)}
        />
      </div>

      {/* Liste des trajets */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '300px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-danger)' }}>
          Une erreur est survenue lors du chargement des trajets.
        </div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Aucun trajet ne correspond à vos critères.
          </p>
          <button
            onClick={() => { setStatusFilter('upcoming'); setCampusFilter(''); setDateFilter(''); }}
            className="btn btn-outline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
