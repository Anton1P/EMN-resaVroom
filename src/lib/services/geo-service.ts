// src/lib/services/geo-service.ts — Services géographiques (BAN + ORS)
// BAN : Autocomplétion d'adresses françaises (api-adresse.data.gouv.fr)
// ORS : Calcul de durée de trajet (OpenRouteService)

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════

export interface AddressSuggestion {
  label: string;
  city: string;
  latitude: number;
  longitude: number;
  postcode: string;
}

export interface DirectionsResult {
  durationMinutes: number;
  distanceKm: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ══════════════════════════════════════════════
// BAN — AUTOCOMPLÉTION D'ADRESSES
// ══════════════════════════════════════════════

const BAN_API_URL = process.env.BAN_API_URL || "https://api-adresse.data.gouv.fr";

/**
 * Recherche des adresses/villes françaises via l'API BAN.
 * Endpoint : /search/?q=...&type=municipality&limit=5
 *
 * Utilisé pour le champ "destination autre" du formulaire de création.
 */
export async function searchAddress(query: string, limit = 5): Promise<AddressSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = new URL("/search/", BAN_API_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("type", "municipality");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`[GEO] BAN API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.features ?? []).map(
      (feature: {
        properties: {
          label: string;
          city: string;
          postcode: string;
        };
        geometry: { coordinates: [number, number] };
      }) => ({
        label: feature.properties.label,
        city: feature.properties.city,
        latitude: feature.geometry.coordinates[1], // GeoJSON: [lng, lat]
        longitude: feature.geometry.coordinates[0],
        postcode: feature.properties.postcode,
      })
    );
  } catch (error) {
    console.error("[GEO] Erreur BAN:", error);
    return [];
  }
}

// ══════════════════════════════════════════════
// ORS — CALCUL DE DURÉE DE TRAJET
// ══════════════════════════════════════════════

const ORS_API_URL = process.env.ORS_API_URL || "https://api.openrouteservice.org";
const ORS_API_KEY = process.env.ORS_API_KEY;

/**
 * Calcule la durée et la distance entre deux points via OpenRouteService.
 * Endpoint : /v2/directions/driving-car
 *
 * Retourne null en cas d'erreur (fallback : saisie manuelle par l'utilisateur).
 */
export async function getDirections(
  origin: Coordinates,
  destination: Coordinates
): Promise<DirectionsResult | null> {
  if (!ORS_API_KEY || ORS_API_KEY === "TO_BE_CONFIGURED") {
    console.warn("[GEO] ORS API key not configured. Using fallback.");
    return getFallbackDirections(origin, destination);
  }

  try {
    const url = new URL("/v2/directions/driving-car", ORS_API_URL);
    url.searchParams.set("api_key", ORS_API_KEY);
    url.searchParams.set(
      "start",
      `${origin.longitude},${origin.latitude}`
    );
    url.searchParams.set(
      "end",
      `${destination.longitude},${destination.latitude}`
    );

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[GEO] ORS API error: ${response.status}`);
      return getFallbackDirections(origin, destination);
    }

    const data = await response.json();
    const segment = data.features?.[0]?.properties?.segments?.[0];

    if (!segment) {
      return getFallbackDirections(origin, destination);
    }

    return {
      durationMinutes: Math.ceil(segment.duration / 60),
      distanceKm: Math.round(segment.distance / 100) / 10, // 1 décimale
    };
  } catch (error) {
    console.error("[GEO] Erreur ORS:", error);
    return getFallbackDirections(origin, destination);
  }
}

// ══════════════════════════════════════════════
// FALLBACK — ESTIMATION À VOL D'OISEAU
// ══════════════════════════════════════════════

/**
 * Estimation de secours si l'API ORS est indisponible.
 * Calcule la distance à vol d'oiseau * 1.3 (facteur route)
 * et estime 70 km/h de moyenne.
 */
function getFallbackDirections(
  origin: Coordinates,
  destination: Coordinates
): DirectionsResult {
  const distanceKm = haversineDistance(origin, destination) * 1.3; // facteur route
  const durationMinutes = Math.ceil((distanceKm / 70) * 60); // 70 km/h moyene

  return {
    durationMinutes: Math.max(durationMinutes, 10), // minimum 10 min
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}

/**
 * Distance de Haversine entre deux points GPS (en km).
 */
function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
