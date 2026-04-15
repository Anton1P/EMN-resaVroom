-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP', 'ROUND_TRIP_OTHER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PassengerAddedBy" AS ENUM ('DRIVER', 'SELF');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('TRIP_CREATED', 'TRIP_UPDATED', 'TRIP_CANCELLED', 'TRIP_FORCE_DELETED', 'PASSENGER_ADDED', 'PASSENGER_REMOVED', 'VEHICLE_CREATED', 'VEHICLE_UPDATED', 'VEHICLE_MAINTENANCE_ON', 'VEHICLE_MAINTENANCE_OFF', 'ADMIN_PROMOTED', 'ADMIN_REVOKED', 'SERVICE_ADDED', 'SERVICE_REMOVED', 'SETTINGS_UPDATED');

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 5,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "default_campus_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "driver_entra_id" TEXT NOT NULL,
    "driver_email" TEXT NOT NULL,
    "driver_display_name" TEXT NOT NULL,
    "type" "TripType" NOT NULL,
    "origin_campus_id" TEXT NOT NULL,
    "destination_campus_id" TEXT,
    "destination_other_label" TEXT,
    "destination_other_lat" DOUBLE PRECISION,
    "destination_other_lng" DOUBLE PRECISION,
    "return_campus_id" TEXT,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "estimated_arrival_time" TIMESTAMP(3) NOT NULL,
    "return_departure_time" TIMESTAMP(3),
    "estimated_return_arrival_time" TIMESTAMP(3),
    "comment" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "user_entra_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_display_name" TEXT NOT NULL,
    "added_by" "PassengerAddedBy" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorized_services" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorized_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "user_entra_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_entra_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campuses_name_key" ON "campuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "vehicles"("license_plate");

-- CreateIndex
CREATE INDEX "trips_vehicle_id_status_departure_time_idx" ON "trips"("vehicle_id", "status", "departure_time");

-- CreateIndex
CREATE INDEX "trips_driver_entra_id_status_idx" ON "trips"("driver_entra_id", "status");

-- CreateIndex
CREATE INDEX "passengers_user_entra_id_idx" ON "passengers"("user_entra_id");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_trip_id_user_entra_id_key" ON "passengers"("trip_id", "user_entra_id");

-- CreateIndex
CREATE UNIQUE INDEX "authorized_services_service_name_key" ON "authorized_services"("service_name");

-- CreateIndex
CREATE UNIQUE INDEX "admins_user_entra_id_key" ON "admins"("user_entra_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_default_campus_id_fkey" FOREIGN KEY ("default_campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_origin_campus_id_fkey" FOREIGN KEY ("origin_campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_campus_id_fkey" FOREIGN KEY ("destination_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_return_campus_id_fkey" FOREIGN KEY ("return_campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
