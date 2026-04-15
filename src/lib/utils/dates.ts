// src/lib/utils/dates.ts — Helpers de dates et calcul de buffer

import { prisma } from "@/lib/prisma";
import { DEFAULT_BUFFER_MINUTES } from "./constants";
import type { TripStatus } from "@/generated/prisma/client";

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

export type DisplayStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface TripForStatus {
  status: TripStatus;
  departureTime: Date;
  estimatedArrivalTime: Date;
  estimatedReturnArrivalTime?: Date | null;
}

export interface TripForEndTime {
  type: string;
  estimatedArrivalTime: Date;
  estimatedReturnArrivalTime?: Date | null;
}

// ══════════════════════════════════════════════
// FONCTIONS DE BASE
// ══════════════════════════════════════════════

/**
 * Ajoute un nombre de minutes à une date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Soustrait un nombre de minutes à une date.
 */
export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

// ══════════════════════════════════════════════
// BUFFER
// ══════════════════════════════════════════════

/**
 * Récupère la durée du buffer depuis les paramètres de l'application.
 * Valeur par défaut : 30 minutes (constante DEFAULT_BUFFER_MINUTES).
 */
export async function getBufferMinutes(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "buffer_minutes" },
  });
  return setting ? parseInt(setting.value, 10) : DEFAULT_BUFFER_MINUTES;
}

/**
 * Calcule le end_time effectif d'un trajet (incluant le buffer).
 * C'est la date à partir de laquelle le véhicule redevient disponible.
 *
 * - ONE_WAY : estimatedArrivalTime + buffer
 * - ROUND_TRIP / ROUND_TRIP_OTHER : estimatedReturnArrivalTime + buffer
 */
export async function getTripEndTimeWithBuffer(trip: TripForEndTime): Promise<Date> {
  const bufferMinutes = await getBufferMinutes();
  const rawEndTime = trip.type === "ONE_WAY"
    ? trip.estimatedArrivalTime
    : trip.estimatedReturnArrivalTime!;
  return addMinutes(rawEndTime, bufferMinutes);
}

/**
 * Retourne le end_time brut d'un trajet (sans buffer).
 */
export function getTripRawEndTime(trip: TripForEndTime): Date {
  return trip.type === "ONE_WAY"
    ? trip.estimatedArrivalTime
    : trip.estimatedReturnArrivalTime!;
}

// ══════════════════════════════════════════════
// STATUT D'AFFICHAGE
// ══════════════════════════════════════════════

/**
 * Calcule le statut d'affichage d'un trajet en fonction de l'heure actuelle.
 *
 * Le statut en base ne contient que SCHEDULED et CANCELLED.
 * Les statuts "en cours" et "terminé" sont dérivés du temps.
 *
 * - CANCELLED → "cancelled"
 * - now < departureTime → "scheduled"
 * - departureTime ≤ now < endTime → "in_progress"
 * - now ≥ endTime → "completed"
 */
export function getTripDisplayStatus(trip: TripForStatus): DisplayStatus {
  if (trip.status === "CANCELLED") return "cancelled";

  const now = new Date();
  const endTime = trip.estimatedReturnArrivalTime ?? trip.estimatedArrivalTime;

  if (now < trip.departureTime) return "scheduled";
  if (now >= trip.departureTime && now < endTime) return "in_progress";
  return "completed";
}
