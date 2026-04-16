// src/hooks/use-vehicles.ts
import useSWR from "swr";
import { VehicleStatus } from "@/generated/prisma/enums";

export type VehicleDisplayStatus = "available" | "in_trip" | "maintenance" | "fully_booked";

export interface Campus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface VehicleWithPosition {
  id: string;
  name: string;
  licensePlate: string;
  seats: number;
  status: VehicleStatus;
  defaultCampusId: string;
  defaultCampus: Campus;
  currentCampus: Campus;
  displayStatus: VehicleDisplayStatus;
  nextTrip: {
    id: string;
    departureTime: string;
    destination: string;
  } | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur serveur");
  return res.json();
};

export function useVehicles(options?: { refreshInterval?: number }) {
  const { data, error, isLoading, mutate } = useSWR<VehicleWithPosition[]>(
    "/api/vehicles",
    fetcher,
    {
      refreshInterval: options?.refreshInterval ?? 30000, // 30s polling by default
    }
  );

  return {
    vehicles: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    mutate,
  };
}
