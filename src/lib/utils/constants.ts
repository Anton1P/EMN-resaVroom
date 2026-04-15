// src/lib/utils/constants.ts — Constantes métier de l'application

/** Nombre maximum de passagers par véhicule (hors conducteur). */
export const MAX_PASSENGERS = 4;

/** Nombre total de places par véhicule (conducteur inclus). */
export const TOTAL_SEATS = 5;

/** Durée minimale (en heures) avant le départ pour modifier un trajet avec passagers SELF. */
export const MIN_HOURS_BEFORE_MODIFICATION = 48;

/** Durée du buffer par défaut (en minutes) si non configuré en base. */
export const DEFAULT_BUFFER_MINUTES = 30;

/** Intervalle de polling SWR pour le dashboard (en millisecondes). */
export const DASHBOARD_POLLING_INTERVAL = 30_000; // 30 secondes
