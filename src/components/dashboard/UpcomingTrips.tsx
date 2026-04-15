// src/components/dashboard/UpcomingTrips.tsx
import React from "react";
import { DashboardTrip } from "@/hooks/use-trips";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Calendar, Users, Car } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import "./dashboard.css";

interface UpcomingTripsProps {
  trips: DashboardTrip[];
}

export function UpcomingTrips({ trips }: UpcomingTripsProps) {
  if (trips.length === 0) {
    return (
      <Card>
        <CardBody className="ds-empty-state">
          <Calendar size={48} className="ds-empty-icon" />
          <p className="ds-empty-title">Aucun trajet à venir</p>
          <p className="ds-empty-desc">Vous n'avez pas de réservations prévues.</p>
          <Link href="/trips/new">
            <Button variant="primary">Réserver un véhicule</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid-3 break-words">
      {trips.map((trip) => (
        <Card key={trip.id} hover className="vehicle-card">
          <CardHeader className="trip-card-header">
            <Badge variant={trip.displayStatus === "in_progress" ? "info" : "default"}>
              {trip.displayStatus === "in_progress" ? "En cours" : "Planifié"}
            </Badge>
            <div className="trip-time">
              {format(new Date(trip.departureTime), "dd MMM HH:mm", { locale: fr })}
            </div>
          </CardHeader>
          
          <CardBody className="trip-details">
            <div className="trip-route">
              {trip.originCampus.name} → {trip.destinationCampus?.name || trip.destinationOtherLabel}
            </div>
            <div className="vc-info-row">
              <Car size={16} />
              <span>{trip.vehicle.name} ({trip.vehicle.licensePlate})</span>
            </div>
            <div className="vc-info-row">
              <Users size={16} />
              <span>
                {trip.passengers.length} passager{trip.passengers.length > 1 ? "s" : ""} / {trip.vehicle.seats - 1} places
              </span>
            </div>
            <div className="trip-actions">
              <Link href={`/trips/${trip.id}`} className="w-full">
                <Button variant="secondary" className="w-full">
                  Détails du trajet
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
