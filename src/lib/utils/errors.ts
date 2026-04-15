// src/lib/utils/errors.ts — Classes d'erreurs métier

/**
 * Classe de base pour les erreurs métier.
 * Fournit un code d'erreur, un message actionnable, et optionnellement
 * l'ID du trajet conflictuel (pour redirection côté UI).
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public conflictingTripId?: string,
    public statusCode: number = 409
  ) {
    super(message);
    this.name = "BusinessError";
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      conflictingTripId: this.conflictingTripId,
    };
  }
}

/**
 * Le véhicule est déjà réservé sur ce créneau.
 * → L'utilisateur peut rejoindre le trajet concurrent.
 */
export class VehicleConflictError extends BusinessError {
  constructor(message: string, conflictingTripId: string) {
    super(message, "VEHICLE_CONFLICT", conflictingTripId);
    this.name = "VehicleConflictError";
  }
}

/**
 * Le conducteur a déjà un trajet qui chevauche ce créneau.
 * → Lien vers le trajet existant du conducteur.
 */
export class DriverOverlapError extends BusinessError {
  constructor(message: string, conflictingTripId: string) {
    super(message, "DRIVER_OVERLAP", conflictingTripId);
    this.name = "DriverOverlapError";
  }
}

/**
 * Un passager a déjà un trajet qui chevauche ce créneau.
 * → Lien vers le trajet existant du passager.
 */
export class PassengerOverlapError extends BusinessError {
  public passengerName: string;

  constructor(message: string, conflictingTripId: string, passengerName: string) {
    super(message, "PASSENGER_OVERLAP", conflictingTripId);
    this.name = "PassengerOverlapError";
    this.passengerName = passengerName;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      passengerName: this.passengerName,
    };
  }
}

/**
 * L'utilisateur n'a pas la permission d'effectuer cette action.
 */
export class PermissionError extends BusinessError {
  constructor(message: string) {
    super(message, "PERMISSION_DENIED", undefined, 403);
    this.name = "PermissionError";
  }
}

/**
 * Erreur de validation des données d'entrée.
 */
export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", undefined, 400);
    this.name = "ValidationError";
  }
}
