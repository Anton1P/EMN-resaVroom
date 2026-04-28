# Document d'Architecture Logicielle (SAD)
# ResaVroom — Application de Réservation de Véhicules Inter-Campus

> **Version :** 1.0
> **Date :** 2026-04-15
> **Statut :** Validé — prêt pour développement

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Architecture des dossiers](#4-architecture-des-dossiers)
5. [Schéma de données (Prisma)](#5-schéma-de-données-prisma)
6. [Authentification et autorisation](#6-authentification-et-autorisation)
7. [Logique métier — Algorithmes](#7-logique-métier--algorithmes)
8. [Spécification des API Routes](#8-spécification-des-api-routes)
9. [Services externes](#9-services-externes)
10. [Spécification des pages UI](#10-spécification-des-pages-ui)
11. [Stratégie de cache et temps réel](#11-stratégie-de-cache-et-temps-réel)
12. [Phases d'implémentation](#12-phases-dimplémentation)

---

## 1. Vue d'ensemble

### 1.1. Objectif
Application web interne permettant la gestion, la réservation et le covoiturage d'une flotte de 3 véhicules circulant entre 3 campus (Le Havre, Caen, Paris) et des destinations libres.

### 1.2. Acteurs
| Acteur | Description |
|--------|-------------|
| **Utilisateur** | Employé authentifié. Peut créer des trajets (conducteur) ou rejoindre des trajets (passager). |
| **Administrateur** | Utilisateur promu. Gère la flotte, les utilisateurs, les paramètres. Peut créer des réservations au nom d'un autre utilisateur (délégation) et en modifier le conducteur assigné. |
| **Système** | Opérations automatiques : calcul de disponibilité, envoi de mails, validation des règles. |

### 1.3. Contraintes clés
- **Pas de données personnelles en base** : seuls les Entra Object IDs sont stockés comme référence, avec un snapshot du nom/email pour affichage.
- **Cohérence spatio-temporelle** : un véhicule a une position dérivée (calculée à partir des trajets), pas un champ statique.
- **Transactions ACID** : toute création de réservation passe par une transaction PostgreSQL sérialisée.

---

## 2. Stack technique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| Framework | Next.js (App Router) | 14+ | Frontend SSR/SSG + API Routes |
| Langage | TypeScript | 5+ | Typage statique |
| Base de données | Neon | - | PostgreSQL Serverless |
| ORM | Prisma | 5+ | Requêtes typées, migrations |
| Authentification | NextAuth.js | 4.x | SSO via Microsoft Entra ID |
| Hébergement | Vercel | - | Déploiement, Edge Functions |
| Autocomplétion | api-adresse.data.gouv.fr (BAN) | - | Recherche de villes françaises |
| Routing | OpenRouteService | v2 | Calcul durée de trajet |
| Mails | Microsoft Graph API | v1.0 | Envoi d'e-mails |
| Recherche utilisateurs | Microsoft Graph API | v1.0 | Lookup d'utilisateurs Entra ID |
| Icônes | Lucide React | - | Iconographie |
| Date/Time | date-fns | - | Manipulation de dates |
| Fetching client | SWR | - | Polling + cache côté client |
| Notifications UI | react-hot-toast (ou sonner) | - | Toasts de feedback |

---

## 3. Variables d'environnement

Fichier `.env.local` à la racine du projet :

```env
# === Base de données (Neon) ===
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<database>?sslmode=require"

# === Authentification (Microsoft Entra ID) ===
AZURE_AD_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AZURE_AD_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# === NextAuth ===
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="une-chaine-aleatoire-de-32-caracteres-minimum"

# === APIs Cartographiques ===
# BAN : pas de clé nécessaire
BAN_API_URL="https://api-adresse.data.gouv.fr"
# OpenRouteService : clé gratuite à obtenir sur openrouteservice.org
ORS_API_URL="https://api.openrouteservice.org"
ORS_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# === Mail ===
MAIL_SENDER_ADDRESS="flotte@entreprise.fr"
```

> **Note :** Sur Vercel, ces variables sont configurées dans Settings > Environment Variables. La `DATABASE_URL` est automatiquement injectée si Neon est connecté via l'intégration Vercel.

---

## 4. Architecture des dossiers

```
resavroom/
├── .env.local                        # Variables d'environnement (non commité)
├── .env.example                      # Template des variables d'environnement
├── next.config.ts                    # Configuration Next.js
├── package.json
├── tsconfig.json
├── middleware.ts                     # Middleware auth (protège les routes)
│
├── prisma/
│   ├── schema.prisma                 # Schéma de la base de données
│   ├── seed.ts                       # Script de seed (campus, véhicules, admin initial)
│   └── migrations/                   # Migrations auto-générées par Prisma
│
├── public/
│   └── (assets statiques)
│
├── src/
│   ├── app/                          # ═══ APP ROUTER ═══
│   │   ├── layout.tsx                # Layout racine : providers (SessionProvider, Toaster)
│   │   ├── page.tsx                  # "/" → redirige vers /dashboard
│   │   ├── globals.css               # Styles globaux + design tokens
│   │   │
│   │   ├── (auth)/                   # Groupe de routes auth (pas de segment URL)
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Page de connexion
│   │   │   └── unauthorized/
│   │   │       └── page.tsx          # Page "Accès refusé"
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Tableau de bord principal
│   │   │
│   │   ├── trips/
│   │   │   ├── page.tsx              # Liste et recherche de trajets (covoiturage)
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Formulaire création trajet (2 phases)
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Détail d'un trajet
│   │   │
│   │   ├── vehicles/
│   │   │   └── [id]/
│   │   │       └── calendar/
│   │   │           └── page.tsx      # Calendrier d'un véhicule
│   │   │
│   │   ├── admin/                    # ═══ PANEL ADMIN ═══
│   │   │   ├── layout.tsx            # Layout admin (vérifie rôle admin)
│   │   │   ├── page.tsx              # Dashboard admin
│   │   │   ├── vehicles/
│   │   │   │   └── page.tsx          # CRUD véhicules + maintenance
│   │   │   ├── trips/
│   │   │   │   └── page.tsx          # Gestion des trajets (suppression forcée)
│   │   │   ├── users/
│   │   │   │   └── page.tsx          # Liste blanche services + gestion admins
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # Configuration (buffer, etc.)
│   │   │   └── audit/
│   │   │       └── page.tsx          # Journal d'audit
│   │   │
│   │   └── api/                      # ═══ API ROUTES ═══
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts      # Config NextAuth (Entra ID)
│   │       │
│   │       ├── trips/
│   │       │   ├── route.ts          # GET (liste) + POST (créer)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET (détail) + PATCH (modifier) + DELETE
│   │       │       └── passengers/
│   │       │           ├── route.ts  # POST (ajouter passager)
│   │       │           └── [passengerId]/
│   │       │               └── route.ts  # DELETE (retirer passager)
│   │       │
│   │       ├── vehicles/
│   │       │   ├── route.ts          # GET (liste avec position) + POST (créer, admin)
│   │       │   ├── availability/
│   │       │   │   └── route.ts      # GET (véhicules dispo pour un créneau)
│   │       │   └── [id]/
│   │       │       └── route.ts      # GET (détail) + PATCH (modifier, admin)
│   │       │
│   │       ├── geo/
│   │       │   ├── autocomplete/
│   │       │   │   └── route.ts      # GET → proxy BAN
│   │       │   └── directions/
│   │       │       └── route.ts      # GET → proxy ORS
│   │       │
│   │       ├── users/
│   │       │   └── search/
│   │       │       └── route.ts      # GET → proxy Graph API (recherche utilisateurs)
│   │       │
│   │       └── admin/
│   │           ├── admins/
│   │           │   ├── route.ts      # GET (liste) + POST (promouvoir)
│   │           │   └── [id]/
│   │           │       └── route.ts  # DELETE (révoquer)
│   │           ├── services/
│   │           │   ├── route.ts      # GET (liste) + POST (ajouter)
│   │           │   └── [id]/
│   │           │       └── route.ts  # DELETE (supprimer)
│   │           ├── settings/
│   │           │   └── route.ts      # GET + PATCH
│   │           └── audit/
│   │               └── route.ts      # GET (avec pagination + filtres)
│   │
│   ├── lib/                          # ═══ LOGIQUE MÉTIER ═══
│   │   ├── prisma.ts                 # Client Prisma singleton
│   │   ├── auth.ts                   # Config NextAuth + helpers (getSession, isAdmin)
│   │   ├── graph-client.ts           # Client Microsoft Graph API (app credentials)
│   │   │
│   │   ├── validators/
│   │   │   ├── trip-validator.ts     # Validation complète d'une réservation
│   │   │   └── permission-checker.ts # Règles modif/suppression (qui peut faire quoi)
│   │   │
│   │   ├── services/
│   │   │   ├── trip-service.ts       # CRUD trajets + transactions
│   │   │   ├── vehicle-service.ts    # Position véhicule, disponibilité
│   │   │   ├── mail-service.ts       # Envoi mails via Graph API
│   │   │   ├── geo-service.ts        # BAN autocomplétion + ORS routing
│   │   │   ├── user-service.ts       # Recherche utilisateurs via Graph API
│   │   │   └── audit-service.ts      # Écriture dans le journal d'audit
│   │   │
│   │   └── utils/
│   │       ├── dates.ts              # Helpers : ajout buffer, calcul créneaux
│   │       ├── errors.ts             # Classes d'erreurs métier avec tripId conflictuel
│   │       └── constants.ts          # Constantes (ex: MAX_PASSENGERS = 4)
│   │
│   ├── components/                   # ═══ COMPOSANTS REACT ═══
│   │   ├── ui/                       # Composants UI génériques (Button, Card, Modal, Input, Select, Badge)
│   │   ├── layout/                   # Navbar, Sidebar, Footer
│   │   ├── dashboard/                # VehicleCard, FleetOverview
│   │   ├── trips/                    # TripForm, TripCard, TripDetail, PassengerList, SuggestionBanner
│   │   ├── vehicles/                 # VehicleCalendar, VehicleStatusBadge
│   │   └── admin/                    # AdminTable, AuditLogTable, SettingsForm
│   │
│   ├── hooks/                        # ═══ CUSTOM HOOKS ═══
│   │   ├── use-vehicles.ts           # SWR : fetch + poll véhicules
│   │   ├── use-trips.ts              # SWR : fetch + poll trajets
│   │   └── use-available-vehicles.ts # SWR : fetch véhicules dispo pour un créneau
│   │
│   └── types/                        # ═══ TYPES TYPESCRIPT ═══
│       ├── index.ts                  # Types partagés, DTOs
│       └── api.ts                    # Types de requêtes/réponses API
│
└── docs/
    ├── Cahier des charge.md          # Cahier des charges fonctionnel
    └── SAD.md                        # Ce document
```

---

## 5. Schéma de données (Prisma)

### 5.1. Diagramme Entité-Relation

```
┌──────────────┐       ┌──────────────────────────────┐       ┌───────────────┐
│   Campus     │       │           Trip               │       │   Vehicle     │
├──────────────┤       ├──────────────────────────────┤       ├───────────────┤
│ id (PK)      │◄─────┐│ id (PK)                      │┌─────►│ id (PK)       │
│ name         │      ││ vehicle_id (FK) ─────────────┘│      │ name          │
│ latitude     │      ││ driver_entra_id               │      │ license_plate │
│ longitude    │      ││ driver_email                  │      │ seats         │
└──────────────┘      ││ driver_display_name           │      │ status (enum) │
       ▲              ││ type (enum)                   │      │ default_campus│
       │              ├┤ origin_campus_id (FK) ────────┘      └───────────────┘
       │              ││ destination_campus_id (FK)    │
       │              ││ destination_other_label       │
       │              ││ destination_other_lat/lng     │
       │              ││ return_campus_id (FK)         │
       │              ││ departure_time                │       ┌───────────────┐
       │              ││ estimated_arrival_time        │       │  Passenger    │
       │              ││ return_departure_time         │       ├───────────────┤
       └──────────────┘│ estimated_return_arrival_time │◄──────┤ id (PK)       │
                       │ comment                       │       │ trip_id (FK)  │
                       │ status (enum)                 │       │ user_entra_id │
                       │ created_at / updated_at       │       │ user_email    │
                       └──────────────────────────────┘       │ user_display  │
                                                               │ added_by (enum│
                                                               │ created_at    │
                                                               └───────────────┘

┌────────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ AuthorizedSvc  │  │    Admin      │  │  AppSetting  │  │  AuditLog    │
├────────────────┤  ├───────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)        │  │ id (PK)       │  │ key (PK)     │  │ id (PK)      │
│ service_name   │  │ user_entra_id │  │ value        │  │ user_entra_id│
│ created_at     │  │ user_email    │  │ updated_at   │  │ user_email   │
└────────────────┘  │ created_at    │  └──────────────┘  │ action (enum)│
                    └───────────────┘                     │ entity_type  │
                                                          │ entity_id    │
                                                          │ details (JSON│
                                                          │ created_at   │
                                                          └──────────────┘
```

### 5.2. Schéma Prisma complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ══════════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════════

enum VehicleStatus {
  AVAILABLE
  MAINTENANCE
}

enum TripType {
  ONE_WAY          // Aller simple : Campus → Campus
  ROUND_TRIP       // Aller-retour : Campus → Campus → même Campus
  ROUND_TRIP_OTHER // Aller-retour : Campus → Autre destination → Campus
}

enum TripStatus {
  SCHEDULED   // Trajet planifié (futur)
  CANCELLED   // Trajet annulé (soft delete)
}

enum PassengerAddedBy {
  DRIVER // Ajouté manuellement par le conducteur
  SELF   // L'utilisateur s'est inscrit lui-même
}

enum AuditAction {
  TRIP_CREATED
  TRIP_UPDATED
  TRIP_CANCELLED
  TRIP_FORCE_DELETED
  PASSENGER_ADDED
  PASSENGER_REMOVED
  VEHICLE_CREATED
  VEHICLE_UPDATED
  VEHICLE_MAINTENANCE_ON
  VEHICLE_MAINTENANCE_OFF
  ADMIN_PROMOTED
  ADMIN_REVOKED
  SERVICE_ADDED
  SERVICE_REMOVED
  SETTINGS_UPDATED
}

// ══════════════════════════════════════════════
// MODÈLES
// ══════════════════════════════════════════════

/// Les 3 campus de référence (Le Havre, Caen, Paris).
/// Extensible : un admin peut ajouter un campus futur.
model Campus {
  id        String   @id @default(cuid())
  name      String   @unique
  latitude  Float
  longitude Float
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  vehiclesDefault Vehicle[] @relation("DefaultCampus")
  tripsOrigin     Trip[]    @relation("TripOrigin")
  tripsDestination Trip[]   @relation("TripDestination")
  tripsReturn     Trip[]    @relation("TripReturn")

  @@map("campuses")
}

/// Les véhicules de la flotte.
/// `status` : AVAILABLE (normal) ou MAINTENANCE (bloqué par un admin).
/// `defaultCampusId` : campus de rattachement initial du véhicule.
model Vehicle {
  id              String        @id @default(cuid())
  name            String        // Ex: "Renault Zoé Bleue"
  licensePlate    String        @unique @map("license_plate")
  seats           Int           @default(5) // Total places (conducteur inclus)
  status          VehicleStatus @default(AVAILABLE)
  defaultCampusId String        @map("default_campus_id")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  // Relations
  defaultCampus Campus @relation("DefaultCampus", fields: [defaultCampusId], references: [id])
  trips         Trip[]

  @@map("vehicles")
}

/// Un trajet (réservation).
/// Statut dérivé par le temps : 
///   - SCHEDULED + now < departure_time → "Planifié"
///   - SCHEDULED + departure_time ≤ now < end_time → "En cours"
///   - SCHEDULED + now ≥ end_time → "Terminé"
///   - CANCELLED → "Annulé"
/// Où end_time = estimated_return_arrival_time ?? estimated_arrival_time
model Trip {
  id                         String     @id @default(cuid())
  vehicleId                  String     @map("vehicle_id")
  driverEntraId              String     @map("driver_entra_id")
  driverEmail                String     @map("driver_email")
  driverDisplayName          String     @map("driver_display_name")
  type                       TripType
  originCampusId             String     @map("origin_campus_id")
  destinationCampusId        String?    @map("destination_campus_id")      // null si ROUND_TRIP_OTHER
  destinationOtherLabel      String?    @map("destination_other_label")    // "Rouen" si Autre
  destinationOtherLat        Float?     @map("destination_other_lat")
  destinationOtherLng        Float?     @map("destination_other_lng")
  returnCampusId             String?    @map("return_campus_id")          // Campus de retour
  departureTime              DateTime   @map("departure_time")
  estimatedArrivalTime       DateTime   @map("estimated_arrival_time")
  returnDepartureTime        DateTime?  @map("return_departure_time")     // null si ONE_WAY
  estimatedReturnArrivalTime DateTime?  @map("estimated_return_arrival_time")
  comment                    String?
  status                     TripStatus @default(SCHEDULED)
  createdAt                  DateTime   @default(now()) @map("created_at")
  updatedAt                  DateTime   @updatedAt @map("updated_at")

  // Relations
  vehicle          Vehicle  @relation(fields: [vehicleId], references: [id])
  originCampus     Campus   @relation("TripOrigin", fields: [originCampusId], references: [id])
  destinationCampus Campus? @relation("TripDestination", fields: [destinationCampusId], references: [id])
  returnCampus     Campus?  @relation("TripReturn", fields: [returnCampusId], references: [id])
  passengers       Passenger[]

  // Index pour les requêtes de disponibilité (très fréquentes)
  @@index([vehicleId, status, departureTime])
  @@index([driverEntraId, status])
  @@map("trips")
}

/// Un passager inscrit sur un trajet.
/// `addedBy` distingue les passagers ajoutés par le conducteur (DRIVER)
/// de ceux qui se sont inscrits eux-mêmes (SELF).
/// Cette distinction conditionne les règles de suppression/modification du trajet.
model Passenger {
  id              String           @id @default(cuid())
  tripId          String           @map("trip_id")
  userEntraId     String           @map("user_entra_id")
  userEmail       String           @map("user_email")
  userDisplayName String           @map("user_display_name")
  addedBy         PassengerAddedBy @map("added_by")
  createdAt       DateTime         @default(now()) @map("created_at")

  // Relations
  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  // Un utilisateur ne peut être inscrit qu'une seule fois par trajet
  @@unique([tripId, userEntraId])
  // Index pour les requêtes de chevauchement
  @@index([userEntraId])
  @@map("passengers")
}

/// Services/groupes autorisés à accéder à l'application.
model AuthorizedService {
  id          String   @id @default(cuid())
  serviceName String   @unique @map("service_name")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("authorized_services")
}

/// Administrateurs de l'application.
model Admin {
  id          String   @id @default(cuid())
  userEntraId String   @unique @map("user_entra_id")
  userEmail   String   @map("user_email")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("admins")
}

/// Paramètres de configuration de l'application.
/// Clés attendues :
///   - "buffer_minutes" : durée du buffer en minutes (défaut: "30")
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("app_settings")
}

/// Journal d'audit (actions critiques, visible uniquement par les admins).
model AuditLog {
  id          String      @id @default(cuid())
  userEntraId String      @map("user_entra_id")
  userEmail   String      @map("user_email")
  action      AuditAction
  entityType  String      @map("entity_type") // "trip", "vehicle", "admin", "service", "setting"
  entityId    String      @map("entity_id")
  details     Json?       // Snapshot avant/après pour traçabilité
  createdAt   DateTime    @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 5.3. Données de seed

```typescript
// prisma/seed.ts — Données initiales

const campuses = [
  { name: "Le Havre", latitude: 49.4944, longitude: 0.1079 },
  { name: "Caen",     latitude: 49.1829, longitude: -0.3707 },
  { name: "Paris",    latitude: 48.8566, longitude: 2.3522 },
];

const vehicles = [
  { name: "Peugeot 308 Grise",  licensePlate: "AB-123-CD", seats: 5, defaultCampus: "Le Havre" },
  { name: "Renault Zoé Bleue",  licensePlate: "EF-456-GH", seats: 5, defaultCampus: "Caen" },
  { name: "Citroën C3 Blanche", licensePlate: "IJ-789-KL", seats: 5, defaultCampus: "Paris" },
];

const settings = [
  { key: "buffer_minutes", value: "30" },
];

// L'admin initial est ajouté via son adresse e-mail dans le seed.
// Remplacer par l'email réel de l'admin.
const initialAdmin = {
  userEntraId: "TO_BE_CONFIGURED",
  userEmail: "admin@entreprise.fr",
};
```

### 5.4. Notes sur le schéma

| Concept | Décision | Justification |
|---------|----------|---------------|
| **Statut de trajet dérivé** | Seuls `SCHEDULED` et `CANCELLED` sont stockés. Les statuts "En cours" et "Terminé" sont calculés côté application via comparaison temporelle. | Évite un cron job ou un trigger pour mettre à jour les statuts. |
| **Snapshots noms** | `driverDisplayName`, `userDisplayName` sont stockés au moment de la création. | Évite des appels Graph API pour résoudre chaque Entra ID à l'affichage. Si un utilisateur change de nom, l'ancien apparaîtra dans les trajets passés (acceptable). |
| **`added_by` sur Passenger** | Enum `DRIVER` / `SELF` | Clé des règles de modif/suppression : un trajet avec des passagers `SELF` ne peut pas être supprimé par le conducteur. |
| **`returnCampusId`** | Utilisé pour les 3 types de trajets. Pour `ROUND_TRIP`, il vaut `originCampusId`. Pour `ROUND_TRIP_OTHER`, il est choisi par l'utilisateur. Pour `ONE_WAY`, il est `null`. | Uniformise les requêtes de position des véhicules. |
| **Soft delete** | Les trajets supprimés passent en `CANCELLED`, jamais supprimés physiquement.  | Permet l'historique et l'audit. Les requêtes de disponibilité filtrent `WHERE status != 'CANCELLED'`. |
| **Pas de table `users`** | Les utilisateurs ne sont pas stockés en base — leur identité vient de Entra ID à chaque session. | Évite la synchro Entra ID ↔ DB. Les infos user sont des snapshots dans `trips` et `passengers`. |

---

## 6. Authentification et autorisation

### 6.1. Flux d'authentification

```
┌────────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
│ Utilisateur│─────►│ Next.js  │─────►│ Microsoft    │─────►│ Entra ID │
│ (Browser)  │      │ NextAuth │      │ /authorize   │      │ Login    │
└────────────┘      └──────────┘      └──────────────┘      └──────┬───┘
                                                                    │
                    ┌──────────┐      ┌──────────────┐              │
                    │ Session  │◄─────│ /callback    │◄─────────────┘
                    │ (JWT)    │      │ (token)      │   Code d'autorisation
                    └──────────┘      └──────────────┘
```

### 6.2. Configuration NextAuth

```typescript
// src/lib/auth.ts

import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.ReadBasic.All",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.entraId = profile.oid;       // Entra Object ID
        token.email = profile.email;
        token.name = profile.name;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.entraId = token.entraId;
      session.user.accessToken = token.accessToken;
      return session;
    },
  },
};
```

### 6.3. Middleware de protection

```typescript
// middleware.ts (racine du projet)

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protéger toutes les routes sauf login, api/auth, et assets statiques
  matcher: [
    "/((?!login|unauthorized|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### 6.4. Vérification du rôle Admin

```typescript
// src/lib/auth.ts (suite)

import { prisma } from "./prisma";

export async function isAdmin(entraId: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { userEntraId: entraId },
  });
  return admin !== null;
}

// À utiliser dans les API routes admin :
// const session = await getServerSession(authOptions);
// if (!session || !(await isAdmin(session.user.entraId))) {
//   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
// }
```

---

## 7. Logique métier — Algorithmes

### 7.1. Calcul de la position d'un véhicule

> **Principe :** La position d'un véhicule à un instant T n'est pas un champ stocké. Elle est **dérivée** du dernier trajet terminé (ou planifié) avant T.

```typescript
// src/lib/services/vehicle-service.ts

/**
 * Calcule le campus où se trouve le véhicule `vehicleId` à l'instant `atTime`.
 * 
 * Algorithme :
 * 1. Récupérer tous les trajets non-annulés de ce véhicule dont la fin (arrivée) ≤ atTime.
 * 2. Prendre le plus récent.
 * 3. Selon le type :
 *    - ONE_WAY        → véhicule au `destinationCampusId`
 *    - ROUND_TRIP     → véhicule au `originCampusId` (il est revenu)
 *    - ROUND_TRIP_OTHER → véhicule au `returnCampusId`
 * 4. Si aucun trajet trouvé → véhicule au `defaultCampusId`.
 * 
 * IMPORTANT : prend en compte les trajets SCHEDULED (futurs) pour le calcul
 * de disponibilité future. Un trajet planifié qui emmène le véhicule à Paris
 * à 10h signifie que le véhicule sera à Paris à 10h même si le trajet n'est
 * pas encore "terminé" au sens strict.
 */
async function getVehiclePosition(vehicleId: string, atTime: Date): Promise<string> {
  // end_time = COALESCE(estimated_return_arrival_time, estimated_arrival_time)
  const lastTrip = await prisma.trip.findFirst({
    where: {
      vehicleId,
      status: { not: "CANCELLED" },
      OR: [
        // Trajet aller simple terminé avant atTime
        {
          type: "ONE_WAY",
          estimatedArrivalTime: { lte: atTime },
        },
        // Trajet aller-retour terminé avant atTime
        {
          type: { in: ["ROUND_TRIP", "ROUND_TRIP_OTHER"] },
          estimatedReturnArrivalTime: { lte: atTime },
        },
      ],
    },
    orderBy: [
      // Trier par fin effective du trajet, le plus récent d'abord
      { estimatedReturnArrivalTime: "desc" },
      { estimatedArrivalTime: "desc" },
    ],
    select: {
      type: true,
      originCampusId: true,
      destinationCampusId: true,
      returnCampusId: true,
    },
  });

  if (!lastTrip) {
    // Aucun trajet terminé → position par défaut
    const vehicle = await prisma.vehicle.findUniqueOrThrow({
      where: { id: vehicleId },
      select: { defaultCampusId: true },
    });
    return vehicle.defaultCampusId;
  }

  switch (lastTrip.type) {
    case "ONE_WAY":
      return lastTrip.destinationCampusId!;
    case "ROUND_TRIP":
      return lastTrip.originCampusId;
    case "ROUND_TRIP_OTHER":
      return lastTrip.returnCampusId!;
  }
}
```

### 7.2. Recherche de véhicules disponibles

> **Appelé en Phase 1** du flux de réservation. Reçoit les critères de l'utilisateur, retourne les véhicules disponibles.

```typescript
// src/lib/services/vehicle-service.ts

interface AvailabilityQuery {
  originCampusId: string;
  departureTime: Date;
  endTime: Date;           // = estimatedArrivalTime + buffer (aller simple)
                           //   ou estimatedReturnArrivalTime + buffer (aller-retour)
}

/**
 * Retourne la liste des véhicules disponibles pour le créneau demandé.
 * 
 * Un véhicule est disponible si :
 * 1. Il n'est PAS en maintenance
 * 2. Il SERA au campus de départ à l'heure de départ
 * 3. Il n'a PAS de trajet qui chevauche le créneau [departureTime, endTime]
 *    (endTime inclut déjà le buffer)
 */
async function getAvailableVehicles(query: AvailabilityQuery): Promise<Vehicle[]> {
  // 1. Récupérer tous les véhicules non en maintenance
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "AVAILABLE" },
  });

  const available: Vehicle[] = [];

  for (const vehicle of vehicles) {
    // 2. Vérifier la position à l'heure de départ
    const positionCampusId = await getVehiclePosition(vehicle.id, query.departureTime);
    if (positionCampusId !== query.originCampusId) {
      continue; // Le véhicule ne sera pas au bon endroit
    }

    // 3. Vérifier l'absence de chevauchement
    const conflictingTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: { not: "CANCELLED" },
        // Le créneau du trajet existant chevauche le créneau demandé
        // Chevauchement : existingStart < queriedEnd AND existingEnd > queriedStart
        departureTime: { lt: query.endTime },
        OR: [
          // Aller simple : fin = estimated_arrival_time + buffer (déjà dans endTime de l'existant)
          {
            type: "ONE_WAY",
            estimatedArrivalTime: { gt: query.departureTime },
          },
          // Aller-retour : fin = estimated_return_arrival_time
          {
            type: { in: ["ROUND_TRIP", "ROUND_TRIP_OTHER"] },
            estimatedReturnArrivalTime: { gt: query.departureTime },
          },
        ],
      },
    });

    if (!conflictingTrip) {
      available.push(vehicle);
    }
  }

  return available;
}
```

> **Note sur le buffer dans les requêtes de chevauchement :** Le buffer doit être ajouté à l'`endTime` du NOUVEAU trajet ET pris en compte pour les trajets EXISTANTS. Pour simplifier, le buffer est ajouté au moment du calcul des heures (côté appelant). La fonction `addBuffer(estimatedArrivalTime)` retourne `estimatedArrivalTime + bufferMinutes`.

### 7.3. Calcul du buffer

```typescript
// src/lib/utils/dates.ts

import { prisma } from "../prisma";

/**
 * Récupère la durée du buffer depuis les paramètres de l'application.
 * Valeur par défaut : 30 minutes.
 */
async function getBufferMinutes(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "buffer_minutes" },
  });
  return setting ? parseInt(setting.value, 10) : 30;
}

/**
 * Ajoute le buffer à une date.
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Calcule l'endTime effectif d'un trajet (incluant le buffer).
 * C'est la date à partir de laquelle le véhicule redevient disponible.
 */
async function getTripEndTimeWithBuffer(trip: {
  type: TripType;
  estimatedArrivalTime: Date;
  estimatedReturnArrivalTime?: Date | null;
}): Promise<Date> {
  const bufferMinutes = await getBufferMinutes();
  const rawEndTime = trip.type === "ONE_WAY"
    ? trip.estimatedArrivalTime
    : trip.estimatedReturnArrivalTime!;
  return addMinutes(rawEndTime, bufferMinutes);
}
```

### 7.4. Flux complet de création de trajet (transaction)

```typescript
// src/lib/services/trip-service.ts

interface CreateTripInput {
  vehicleId: string;
  driverEntraId: string;
  driverEmail: string;
  driverDisplayName: string;
  type: TripType;
  originCampusId: string;
  destinationCampusId?: string;
  destinationOtherLabel?: string;
  destinationOtherLat?: number;
  destinationOtherLng?: number;
  returnCampusId?: string;
  departureTime: Date;
  estimatedArrivalTime: Date;
  returnDepartureTime?: Date;
  estimatedReturnArrivalTime?: Date;
  comment?: string;
  passengers?: Array<{
    userEntraId: string;
    userEmail: string;
    userDisplayName: string;
  }>;
}

/**
 * Crée un trajet dans une transaction sérialisée.
 * 
 * Étapes :
 * 1. Re-vérifier la disponibilité du véhicule (race condition)
 * 2. Vérifier le chevauchement du conducteur
 * 3. Vérifier le chevauchement de chaque passager
 * 4. Créer le trajet + les passagers
 * 5. Écrire dans le journal d'audit
 * 
 * Si conflit → lance une erreur métier avec l'ID du trajet conflictuel.
 */
async function createTrip(input: CreateTripInput): Promise<Trip> {
  const bufferMinutes = await getBufferMinutes();
  const endTimeWithBuffer = addMinutes(
    input.estimatedReturnArrivalTime ?? input.estimatedArrivalTime,
    bufferMinutes
  );

  return await prisma.$transaction(async (tx) => {
    // ── VÉRIF 1 : Véhicule toujours disponible ──
    const vehicleConflict = await findVehicleConflict(
      tx, input.vehicleId, input.departureTime, endTimeWithBuffer
    );
    if (vehicleConflict) {
      throw new VehicleConflictError(
        "Ce véhicule vient d'être réservé par un autre utilisateur.",
        vehicleConflict.id
      );
    }

    // ── VÉRIF 2 : Conducteur pas de chevauchement ──
    const driverConflict = await findPersonConflict(
      tx, input.driverEntraId, input.departureTime, endTimeWithBuffer
    );
    if (driverConflict) {
      throw new DriverOverlapError(
        "Vous avez déjà un trajet sur ce créneau.",
        driverConflict.id
      );
    }

    // ── VÉRIF 3 : Passagers pas de chevauchement ──
    if (input.passengers) {
      for (const passenger of input.passengers) {
        const passengerConflict = await findPersonConflict(
          tx, passenger.userEntraId, input.departureTime, endTimeWithBuffer
        );
        if (passengerConflict) {
          throw new PassengerOverlapError(
            `Le passager ${passenger.userDisplayName} a déjà un trajet sur ce créneau.`,
            passengerConflict.id,
            passenger.userDisplayName
          );
        }
      }
    }

    // ── CRÉATION ──
    const trip = await tx.trip.create({
      data: {
        vehicleId: input.vehicleId,
        driverEntraId: input.driverEntraId,
        driverEmail: input.driverEmail,
        driverDisplayName: input.driverDisplayName,
        type: input.type,
        originCampusId: input.originCampusId,
        destinationCampusId: input.destinationCampusId,
        destinationOtherLabel: input.destinationOtherLabel,
        destinationOtherLat: input.destinationOtherLat,
        destinationOtherLng: input.destinationOtherLng,
        returnCampusId: input.returnCampusId,
        departureTime: input.departureTime,
        estimatedArrivalTime: input.estimatedArrivalTime,
        returnDepartureTime: input.returnDepartureTime,
        estimatedReturnArrivalTime: input.estimatedReturnArrivalTime,
        comment: input.comment,
        passengers: input.passengers
          ? {
              createMany: {
                data: input.passengers.map((p) => ({
                  userEntraId: p.userEntraId,
                  userEmail: p.userEmail,
                  userDisplayName: p.userDisplayName,
                  addedBy: "DRIVER" as const,
                })),
              },
            }
          : undefined,
      },
      include: { passengers: true },
    });

    return trip;
  }, {
    isolationLevel: "Serializable",
  });

  // ── HORS TRANSACTION : Audit + Mail ──
  // (exécutés après le commit, pas d'impact si erreur)
  // await auditService.log({ ... });
  // await mailService.sendTripConfirmation(trip);
}
```


### 7.5. Détection de conflits (fonctions utilitaires)

```typescript
// src/lib/services/trip-service.ts (suite)

/**
 * Cherche un trajet existant qui chevauche le créneau demandé pour un véhicule.
 * Utilisé pour la re-vérification en transaction.
 * Retourne le trajet conflictuel ou null.
 */
async function findVehicleConflict(
  tx: PrismaTransaction,
  vehicleId: string,
  start: Date,
  end: Date
): Promise<{ id: string } | null> {
  return await tx.trip.findFirst({
    where: {
      vehicleId,
      status: { not: "CANCELLED" },
      departureTime: { lt: end },
      OR: [
        { type: "ONE_WAY", estimatedArrivalTime: { gt: start } },
        {
          type: { in: ["ROUND_TRIP", "ROUND_TRIP_OTHER"] },
          estimatedReturnArrivalTime: { gt: start },
        },
      ],
    },
    select: { id: true },
  });
}

/**
 * Cherche un trajet existant qui chevauche le créneau demandé pour une personne
 * (en tant que conducteur OU passager).
 * Retourne le trajet conflictuel ou null.
 */
async function findPersonConflict(
  tx: PrismaTransaction,
  userEntraId: string,
  start: Date,
  end: Date
): Promise<{ id: string } | null> {
  // Vérifier en tant que conducteur
  const asDriver = await tx.trip.findFirst({
    where: {
      driverEntraId: userEntraId,
      status: { not: "CANCELLED" },
      departureTime: { lt: end },
      OR: [
        { type: "ONE_WAY", estimatedArrivalTime: { gt: start } },
        {
          type: { in: ["ROUND_TRIP", "ROUND_TRIP_OTHER"] },
          estimatedReturnArrivalTime: { gt: start },
        },
      ],
    },
    select: { id: true },
  });
  if (asDriver) return asDriver;

  // Vérifier en tant que passager
  const asPassenger = await tx.trip.findFirst({
    where: {
      status: { not: "CANCELLED" },
      passengers: { some: { userEntraId } },
      departureTime: { lt: end },
      OR: [
        { type: "ONE_WAY", estimatedArrivalTime: { gt: start } },
        {
          type: { in: ["ROUND_TRIP", "ROUND_TRIP_OTHER"] },
          estimatedReturnArrivalTime: { gt: start },
        },
      ],
    },
    select: { id: true },
  });

  return asPassenger;
}
```

### 7.6. Délégation de réservation par les Administrateurs

> **Objectif :** Permettre à un Administrateur de créer ou de modifier un trajet en l'assignant à un autre collaborateur de l'entreprise.

Lors de la création ou de la modification d'un trajet (`updateTripInfo`), l'API accepte les paramètres optionnels `driverEntraId`, `driverEmail`, et `driverDisplayName`. Si l'utilisateur qui effectue la requête est un administrateur, le système utilise ces informations pour substituer le conducteur.

```typescript
// Extrait de src/app/api/trips/route.ts
const userIsAdmin = await isAdmin(auth.session.user.entraId);

// Détermination du conducteur final
const driverEntraId = (userIsAdmin && body.driverEntraId) 
  ? body.driverEntraId 
  : auth.session.user.entraId;

const trip = await createTrip({
  vehicleId: body.vehicleId,
  driverEntraId,
  // ...
});
```

La validation des conflits (voir `findPersonConflict`) s'exécute de manière transparente sur ce nouveau conducteur assigné. Par conséquent, si un administrateur tente de réserver un véhicule au nom de Jean Dupont sur un créneau où Jean a déjà un déplacement de prévu, le système bloquera l'action en retournant une `DriverOverlapError`.

### 7.7. Classes d'erreurs métier

```typescript
// src/lib/utils/errors.ts

export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public conflictingTripId?: string,
    public statusCode: number = 409
  ) {
    super(message);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      conflictingTripId: this.conflictingTripId,
    };
  }
}

export class VehicleConflictError extends BusinessError {
  constructor(message: string, conflictingTripId: string) {
    super(message, "VEHICLE_CONFLICT", conflictingTripId);
  }
}

export class DriverOverlapError extends BusinessError {
  constructor(message: string, conflictingTripId: string) {
    super(message, "DRIVER_OVERLAP", conflictingTripId);
  }
}

export class PassengerOverlapError extends BusinessError {
  public passengerName: string;
  constructor(message: string, conflictingTripId: string, passengerName: string) {
    super(message, "PASSENGER_OVERLAP", conflictingTripId);
    this.passengerName = passengerName;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      passengerName: this.passengerName,
    };
  }
}
```

### 7.7. Règles de permission (modification / suppression)

```typescript
// src/lib/validators/permission-checker.ts

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Vérifie si le conducteur peut SUPPRIMER son trajet.
 * 
 * Règles :
 * - Si aucun passager SELF → autorisé
 * - Si des passagers SELF existent → interdit (doit contacter un admin)
 * - Un admin peut toujours supprimer
 */
function canDeleteTrip(
  trip: TripWithPassengers,
  userEntraId: string,
  isAdmin: boolean
): PermissionResult {
  if (isAdmin) return { allowed: true };

  if (trip.driverEntraId !== userEntraId) {
    return { allowed: false, reason: "Seul le conducteur ou un admin peut supprimer ce trajet." };
  }

  const hasSelfPassengers = trip.passengers.some(p => p.addedBy === "SELF");
  if (hasSelfPassengers) {
    return {
      allowed: false,
      reason: "Ce trajet a des passagers inscrits. Contactez un administrateur pour le supprimer.",
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si une modifcation du trajet est autorisée.
 * 
 * Règles :
 * - Le conducteur ne peut modifier *que* l'heure de départ.
 * - S'il y a des passagers SELF → modification par le conducteur possible uniquement si 48h+ avant le départ.
 * - Un administrateur peut modifier toutes les composantes du trajet (heure, date, véhicule, origine, destination).
 */
function canModifyDepartureTime(
  trip: TripWithPassengers,
  userEntraId: string,
  isAdmin: boolean
): PermissionResult {
  if (isAdmin) return { allowed: true };

  if (trip.driverEntraId !== userEntraId) {
    return { allowed: false, reason: "Seul le conducteur ou un admin peut modifier ce trajet." };
  }

  const hasSelfPassengers = trip.passengers.some(p => p.addedBy === "SELF");
  if (hasSelfPassengers) {
    const hoursUntilDeparture =
      (trip.departureTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilDeparture < 48) {
      return {
        allowed: false,
        reason: "Modification impossible moins de 48h avant le départ quand des passagers se sont inscrits.",
      };
    }
  }

  return { allowed: true };
}
```

### 7.8. Statut d'affichage dérivé d'un trajet

```typescript
// src/lib/utils/dates.ts

type DisplayStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

/**
 * Calcule le statut d'affichage d'un trajet en fonction de l'heure actuelle.
 * Le statut en base ne contient que SCHEDULED et CANCELLED.
 * Les statuts "en cours" et "terminé" sont dérivés du temps.
 */
function getTripDisplayStatus(trip: {
  status: TripStatus;
  departureTime: Date;
  estimatedArrivalTime: Date;
  estimatedReturnArrivalTime?: Date | null;
}): DisplayStatus {
  if (trip.status === "CANCELLED") return "cancelled";

  const now = new Date();
  const endTime = trip.estimatedReturnArrivalTime ?? trip.estimatedArrivalTime;

  if (now < trip.departureTime) return "scheduled";
  if (now >= trip.departureTime && now < endTime) return "in_progress";
  return "completed";
}
```

---

## 8. Spécification des API Routes

### 8.1. Conventions

- **Base URL :** `/api/`
- **Format :** JSON
- **Authentification :** Toutes les routes nécessitent une session NextAuth valide (sauf `/api/auth/*`).
- **Routes admin :** Préfixées par `/api/admin/`, nécessitent le rôle admin.
- **Erreurs :** Format uniforme `{ error: string, message: string, conflictingTripId?: string }`
- **Codes HTTP :**
  - `200` : succès
  - `201` : créé
  - `400` : validation échouée
  - `401` : non authentifié
  - `403` : non autorisé
  - `404` : ressource non trouvée
  - `409` : conflit (race condition, chevauchement)

### 8.2. Routes Véhicules

#### `GET /api/vehicles`
Retourne la liste de tous les véhicules avec leur position actuelle.

**Réponse 200 :**
```json
[
  {
    "id": "clx...",
    "name": "Peugeot 308 Grise",
    "licensePlate": "AB-123-CD",
    "seats": 5,
    "status": "AVAILABLE",
    "currentCampus": { "id": "clx...", "name": "Le Havre" },
    "displayStatus": "available",
    "nextTrip": {
      "id": "clx...",
      "departureTime": "2026-04-16T08:00:00Z",
      "destination": "Paris"
    }
  }
]
```

> **displayStatus** est calculé côté serveur :  
> `"available"` | `"in_trip"` | `"maintenance"` | `"fully_booked"`

#### `GET /api/vehicles/availability`
Retourne les véhicules disponibles pour un créneau donné. **C'est l'endpoint clé de la Phase 1 du flux de réservation.**

**Query params :**
| Param | Type | Requis | Description |
|-------|------|:------:|-------------|
| `originCampusId` | string | ✅ | Campus de départ |
| `departureTime` | ISO 8601 | ✅ | Date/heure de départ |
| `estimatedArrivalTime` | ISO 8601 | ✅ | Heure d'arrivée estimée (calculée côté client via ORS) |
| `returnDepartureTime` | ISO 8601 | ❌ | Heure de départ du retour (si aller-retour) |
| `estimatedReturnArrivalTime` | ISO 8601 | ❌ | Heure de retour estimée |

**Réponse 200 :**
```json
{
  "availableVehicles": [
    {
      "id": "clx...",
      "name": "Peugeot 308 Grise",
      "licensePlate": "AB-123-CD",
      "seats": 5
    }
  ],
  "suggestedTrips": [
    {
      "id": "clx...",
      "driverDisplayName": "Jean Dupont",
      "departureTime": "2026-04-16T08:00:00Z",
      "origin": "Le Havre",
      "destination": "Paris",
      "seatsAvailable": 3
    }
  ]
}
```

> **suggestedTrips** : trajets existants correspondant aux mêmes critères (même date, même origin, même destination ou destination proche). Suggestion de covoiturage non bloquante.

### 8.3. Routes Trajets

#### `POST /api/trips`
Crée un nouveau trajet (en transaction). C'est **l'action de la Phase 2** du flux de réservation.

**Body :**
```json
{
  "vehicleId": "clx...",
  "type": "ROUND_TRIP",
  "originCampusId": "clx...",
  "destinationCampusId": "clx...",
  "returnCampusId": "clx...",
  "departureTime": "2026-04-16T08:00:00Z",
  "estimatedArrivalTime": "2026-04-16T10:00:00Z",
  "returnDepartureTime": "2026-04-16T16:00:00Z",
  "estimatedReturnArrivalTime": "2026-04-16T18:00:00Z",
  "comment": "Réunion client",
  "passengers": [
    {
      "userEntraId": "xxx",
      "userEmail": "marie@entreprise.fr",
      "userDisplayName": "Marie Martin"
    }
  ]
}
```

**Réponse 201 :** Le trajet créé avec ses passagers.

**Réponse 409 (conflit) :**
```json
{
  "error": "VEHICLE_CONFLICT",
  "message": "Ce véhicule vient d'être réservé par un autre utilisateur.",
  "conflictingTripId": "clx..."
}
```

#### `GET /api/trips`
Liste les trajets avec filtres.

**Query params :**
| Param | Type | Requis | Description |
|-------|------|:------:|-------------|
| `status` | string | ❌ | Filtrer par statut (`upcoming`, `past`, `all`) |
| `originCampusId` | string | ❌ | Filtrer par campus de départ |
| `date` | ISO 8601 (date) | ❌ | Filtrer par date |
| `vehicleId` | string | ❌ | Filtrer par véhicule |
| `page` | number | ❌ | Pagination (défaut: 1) |
| `limit` | number | ❌ | Items par page (défaut: 20) |

#### `GET /api/trips/[id]`
Détail d'un trajet avec tous ses passagers.

**Réponse 200 :**
```json
{
  "id": "clx...",
  "vehicle": { "id": "clx...", "name": "Peugeot 308 Grise", "licensePlate": "AB-123-CD" },
  "driver": { "entraId": "xxx", "email": "jean@entreprise.fr", "displayName": "Jean Dupont" },
  "type": "ROUND_TRIP",
  "origin": { "id": "clx...", "name": "Le Havre" },
  "destination": { "id": "clx...", "name": "Paris" },
  "departureTime": "2026-04-16T08:00:00Z",
  "estimatedArrivalTime": "2026-04-16T10:00:00Z",
  "returnDepartureTime": "2026-04-16T16:00:00Z",
  "estimatedReturnArrivalTime": "2026-04-16T18:00:00Z",
  "comment": "Réunion client",
  "displayStatus": "scheduled",
  "passengers": [
    {
      "id": "clx...",
      "userEntraId": "xxx",
      "userEmail": "marie@entreprise.fr",
      "userDisplayName": "Marie Martin",
      "addedBy": "DRIVER"
    }
  ],
  "seatsAvailable": 3,
  "permissions": {
    "canDelete": true,
    "canModifyDeparture": true,
    "canJoinAsPassenger": true
  }
}
```

> **`permissions`** est calculé côté serveur en fonction de l'utilisateur connecté. Le front n'a pas besoin de refaire la logique.

#### `PATCH /api/trips/[id]`
Modifie les informations d'un trajet. 
- *En tant que conducteur* : seule l'heure de départ est modifiable.
- *En tant qu'administrateur* : tous les champs du trajet (véhicule, origine, destination, dates complètes) peuvent être modifiés simultanément. Une re-vérification des conflits (chevauchements) est systématiquement effectuée côté backend.

**Body (exemple modification complète) :**
```json
{
  "vehicleId": "clx...",
  "type": "ROUND_TRIP",
  "originCampusId": "clx...",
  "destinationCampusId": "clx...",
  "departureTime": "2026-04-16T09:00:00Z",
  "estimatedArrivalTime": "2026-04-16T11:00:00Z",
  "returnDepartureTime": "2026-04-16T17:00:00Z",
  "estimatedReturnArrivalTime": "2026-04-16T19:00:00Z"
}
```

> La modification globale repasse par le flux transactionnel (`findVehicleConflict`, `findPersonConflict`) pour assurer la validité du nouveau créneau.

**Réponse 403 :** Si la modification est interdite au conducteur (< 48h avec passagers SELF). 
**Réponse 409 :** En cas de conflit d'horaire ou de véhicule non disponible.

#### `DELETE /api/trips/[id]`
Supprime (annule) un trajet. Passe le statut à `CANCELLED`.

**Réponse 200 :** `{ "message": "Trajet annulé." }`

**Réponse 403 :**
```json
{
  "error": "HAS_SELF_PASSENGERS",
  "message": "Ce trajet a des passagers inscrits. Contactez un administrateur pour le supprimer."
}
```

### 8.4. Routes Passagers

#### `POST /api/trips/[id]/passengers`
Ajouter un passager à un trajet.

**Body (conducteur ajoute un passager) :**
```json
{
  "userEntraId": "xxx",
  "userEmail": "paul@entreprise.fr",
  "userDisplayName": "Paul Lefèvre",
  "addedBy": "DRIVER"
}
```

**Body (utilisateur s'inscrit lui-même) :**
```json
{
  "addedBy": "SELF"
}
```
> L'`userEntraId`, `email`, et `displayName` sont pris depuis la session.

**Vérifications :**
- Le trajet n'est pas CANCELLED
- Le trajet n'est pas déjà parti (departureTime > now)
- Il reste des places (count passengers < 4)
- L'utilisateur n'est pas déjà inscrit
- L'utilisateur n'est pas le conducteur
- L'utilisateur n'a pas de trajet qui chevauche

**Réponse 409 (chevauchement) :**
```json
{
  "error": "PASSENGER_OVERLAP",
  "message": "Vous avez déjà un trajet sur ce créneau.",
  "conflictingTripId": "clx..."
}
```

#### `DELETE /api/trips/[id]/passengers/[passengerId]`
Retirer un passager d'un trajet.

**Vérifications :**
- Le passager doit être l'utilisateur lui-même, OU le conducteur peut retirer un passager qu'il a ajouté (addedBy = DRIVER), OU un admin.

### 8.5. Routes Géo (Proxy)

#### `GET /api/geo/autocomplete?q=rou`
Proxy vers la BAN. Retourne les villes correspondantes.

**Réponse 200 :**
```json
[
  {
    "label": "Rouen",
    "city": "Rouen",
    "postcode": "76000",
    "latitude": 49.4432,
    "longitude": 1.0999
  }
]
```

**Implémentation :**
```typescript
// Appel interne : GET https://api-adresse.data.gouv.fr/search/?q=${q}&type=municipality&limit=5
```

#### `GET /api/geo/directions?originLat=...&originLng=...&destLat=...&destLng=...`
Proxy vers OpenRouteService. Retourne la durée et la distance.

**Réponse 200 :**
```json
{
  "durationSeconds": 7200,
  "durationFormatted": "2h 00min",
  "distanceMeters": 195000
}
```

**Implémentation :**
```typescript
// Appel interne : GET https://api.openrouteservice.org/v2/directions/driving-car
//   ?api_key=${ORS_API_KEY}
//   &start=${originLng},${originLat}
//   &end=${destLng},${destLat}
```

> **Attention :** ORS utilise l'ordre `longitude,latitude` (pas `lat,lng`).

### 8.6. Routes Recherche Utilisateurs

#### `GET /api/users/search?q=jean`
Recherche d'utilisateurs dans l'annuaire Entra ID (pour l'ajout de passagers par le conducteur).

**Réponse 200 :**
```json
[
  {
    "entraId": "xxx-yyy-zzz",
    "displayName": "Jean Dupont",
    "email": "jean.dupont@entreprise.fr"
  }
]
```

**Implémentation :**
```typescript
// Appel Graph API avec le token de l'utilisateur connecté :
// GET https://graph.microsoft.com/v1.0/users
//   ?$filter=startswith(displayName,'jean') or startswith(mail,'jean')
//   &$select=id,displayName,mail
//   &$top=5
```

### 8.7. Routes Admin

Toutes les routes admin vérifient `isAdmin(session.user.entraId)` en entrée.

#### `GET/POST /api/admin/admins` + `DELETE /api/admin/admins/[id]`
CRUD des administrateurs. Recherche par email + promotion/révocation.

#### `GET/POST /api/admin/services` + `DELETE /api/admin/services/[id]`
CRUD de la liste blanche des services autorisés.

#### `GET/PATCH /api/admin/settings`
Lecture/modification des paramètres (ex: `buffer_minutes`).

**PATCH Body :**
```json
{ "key": "buffer_minutes", "value": "30" }
```

#### `GET /api/admin/audit`
Journal d'audit avec pagination et filtres.

**Query params :** `page`, `limit`, `entityType`, `action`, `startDate`, `endDate`.

**Réponse 200 :**
```json
{
  "logs": [
    {
      "id": "clx...",
      "userEmail": "admin@entreprise.fr",
      "action": "TRIP_FORCE_DELETED",
      "entityType": "trip",
      "entityId": "clx...",
      "details": { "reason": "Véhicule mis en maintenance", "affectedPassengers": 3 },
      "createdAt": "2026-04-15T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

## 9. Services externes

### 9.1. BAN — api-adresse.data.gouv.fr

| Propriété | Valeur |
|-----------|--------|
| **URL** | `https://api-adresse.data.gouv.fr/search/` |
| **Authentification** | Aucune (API publique) |
| **Rate limit** | Pas de limite documentée, utilisation raisonnable |
| **Usage** | Autocomplétion des destinations "Autre" |

**Paramètres utiles :**
- `q` : texte recherché
- `type=municipality` : limiter aux communes
- `limit=5` : nombre de résultats

**Exemple de réponse :**
```json
{
  "features": [
    {
      "properties": {
        "label": "Rouen",
        "city": "Rouen",
        "postcode": "76000"
      },
      "geometry": {
        "coordinates": [1.0999, 49.4432]  // [lng, lat]
      }
    }
  ]
}
```

### 9.2. OpenRouteService

| Propriété | Valeur |
|-----------|--------|
| **URL** | `https://api.openrouteservice.org/v2/directions/driving-car` |
| **Authentification** | API Key (header `Authorization: ${ORS_API_KEY}`) |
| **Rate limit** | 2000 req/jour (tier gratuit) |
| **Usage** | Calcul de durée de trajet entre 2 points |

**Paramètres :**
- `start=lng,lat` (point de départ)
- `end=lng,lat` (point d'arrivée)

**Exemple de réponse :**
```json
{
  "features": [
    {
      "properties": {
        "segments": [
          {
            "duration": 7200.5,   // secondes
            "distance": 195432.1  // mètres
          }
        ],
        "summary": {
          "duration": 7200.5,
          "distance": 195432.1
        }
      }
    }
  ]
}
```

**Clé API :** À obtenir gratuitement sur [openrouteservice.org/sign-up](https://openrouteservice.org/dev/#/signup).

### 9.3. Microsoft Graph API — Mail

| Propriété | Valeur |
|-----------|--------|
| **URL** | `https://graph.microsoft.com/v1.0/users/{sender-email}/sendMail` |
| **Authentification** | Token d'application (client credentials flow) |
| **Permission** | `Mail.Send` (application) |
| **Usage** | Envoi de 2 types de mails |

**Obtention du token d'application :**
```typescript
// src/lib/graph-client.ts

import { ConfidentialClientApplication } from "@azure/msal-node";

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },
});

export async function getGraphAppToken(): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });
  return result!.accessToken;
}
```

**Envoi de mail :**
```typescript
// src/lib/services/mail-service.ts

export async function sendMail(to: string[], subject: string, htmlBody: string) {
  const token = await getGraphAppToken();
  
  await fetch(
    `https://graph.microsoft.com/v1.0/users/${process.env.MAIL_SENDER_ADDRESS}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: htmlBody },
          toRecipients: to.map((email) => ({
            emailAddress: { address: email },
          })),
        },
      }),
    }
  );
}
```

**Templates de mails :**

| Scénario | Objet | Contenu |
|----------|-------|---------|
| Trajet créé | `[ResaVroom] Confirmation de trajet` | Récap du trajet : date, horaires, véhicule, destination, lien vers le trajet |
| Suppression admin | `[ResaVroom] Trajet annulé` | Notification d'annulation, détails du trajet annulé |

---

## 10. Spécification des pages UI

### 10.1. Design System

| Token | Valeur | Usage |
|-------|--------|-------|
| **Couleur primaire** | `hsl(220, 70%, 50%)` | Boutons, liens, accents |
| **Couleur succès** | `hsl(145, 65%, 42%)` | Statut "Disponible" |
| **Couleur warning** | `hsl(38, 92%, 50%)` | Statut "En déplacement" |
| **Couleur danger** | `hsl(0, 72%, 51%)` | Statut "Maintenance", erreurs |
| **Couleur info** | `hsl(200, 80%, 50%)` | Statut "Complet" |
| **Background** | `hsl(220, 14%, 96%)` | Fond de page clair |
| **Surface** | `#ffffff` | Cards, modales |
| **Font** | `Inter` (Google Fonts) | Typographie principale |
| **Border radius** | `12px` (cards), `8px` (inputs) | Coins arrondis modernes |

### 10.2. Pages

#### `/dashboard` — Tableau de bord

**Composants :**
- **FleetOverview** : 3 cartes véhicules côte à côte (responsive : empilées sur mobile).
- **VehicleCard** : Pour chaque véhicule :
  - Nom + immatriculation
  - Badge de statut coloré (Disponible vert / En déplacement orange / Maintenance rouge)
  - Campus actuel
  - Prochain trajet (horaire + destination) ou "Aucun trajet prévu"
  - Bouton "Voir le calendrier"
- **QuickActions** : Boutons "Nouveau trajet" + "Rechercher un trajet"
- **UpcomingTrips** : Liste des 5 prochains trajets de l'utilisateur connecté.

**Data fetching :** SWR avec polling toutes les 30 secondes (`refreshInterval: 30000`).

#### `/trips/new` — Création de trajet (2 phases)

**Phase 1 — Formulaire de recherche :**

Composant `TripSearchForm` :
1. **Campus de départ** : `<Select>` avec les 3 campus.
2. **Type de destination** : Toggle "Campus" / "Autre".
3. **Destination campus** : `<Select>` avec les campus restants (exclut le départ). Visible si type = Campus.
4. **Destination autre** : `<Input>` avec autocomplétion (debounce 300ms → appel `/api/geo/autocomplete`). Visible si type = Autre.
5. **Campus de retour** : `<Select>` avec les 3 campus. Visible si destination = Autre.
6. **Type de trajet** : Radio "Aller simple" / "Aller-retour". Visible si destination = Campus. Si destination = Autre → forcé "Aller-retour" (grisé).
7. **Date** : `<input type="date">`.
8. **Heure de départ** : `<input type="time">`.
9. **Heure de départ retour** : `<input type="time">`. Visible si aller-retour.
10. **Bouton "Rechercher les véhicules disponibles"** : Déclenche l'appel `/api/geo/directions` puis `/api/vehicles/availability`.

**Résultats :**
- **SuggestionBanner** (si des trajets existants correspondent) : bandeau non bloquant "Un trajet similaire existe, voulez-vous le rejoindre ?" avec lien vers le trajet.
- **AvailableVehiclesList** : Cartes des véhicules disponibles. Si 0 → message "Aucun véhicule disponible pour ce créneau. Essayez un autre horaire."

**Phase 2 — Confirmation :**

Composant `TripConfirmForm` (après sélection d'un véhicule) :
1. Récapitulatif du trajet (véhicule, horaires, destination).
2. **Ajout de passagers** (optionnel) : `<Input>` avec recherche d'utilisateurs (debounce 300ms → appel `/api/users/search`). Chips des passagers ajoutés avec bouton ×.
3. **Commentaire** (optionnel) : `<textarea>`.
4. **Bouton "Confirmer la réservation"** : Appel `POST /api/trips`.
5. En cas d'erreur 409 → affichage du message avec lien vers le trajet conflictuel.
6. En cas de succès → toast de confirmation + redirection vers `/trips/[id]`.

#### `/trips` — Recherche de trajets (covoiturage)

**Comportement par défaut :**
À l'arrivée sur l'url `/trips`, la page affiche **tous les trajets à venir** de la flotte sur l'ensemble de l'application. Tous les filtres (campus, date, etc.) sont par défaut vides, seul le filtre de Statut est implicitement réglé sur "À venir". L'utilisateur peut ensuite remplir les filtres pour affiner sa recherche s'il le souhaite.

**Composants :**
- **TripFilters** : Filtres (date via `DatePickerInput`, campus de départ, statut).
- **TripList** : Liste de cartes `TripCard` :
  - Date + horaires
  - Départ → Destination
  - Conducteur
  - Places restantes (badge coloré)
  - Bouton "Voir le trajet" → `/trips/[id]`

#### `/trips/[id]` — Détail d'un trajet

**Composants :**
- **TripHeader** : Type de trajet + statut (badge coloré) + véhicule.
- **TripTimeline** : Frise chronologique visuelle (Départ → Arrivée → Retour départ → Retour arrivée).
- **TripInfo** : Campus départ/arrivée, horaires, commentaire.
- **DriverCard** : Nom + email du conducteur.
- **PassengerList** : Liste des passagers avec badge "Ajouté par le conducteur" ou "Inscrit". Bouton × pour se retirer.
- **JoinButton** : Bouton "Rejoindre ce trajet" (visible si places disponibles, pas déjà inscrit, pas le conducteur, pas de chevauchement).
- **ActionButtons** (contextuel selon permissions) :
  - "Modifier l'heure de départ" (si autorisé)
  - "Supprimer le trajet" (si autorisé) ou "Contactez un administrateur" (si passagers SELF)

#### `/vehicles/[id]/calendar` — Calendrier véhicule

Affichage en vue hebdomadaire ou mensuelle des créneaux occupés/libres du véhicule.
- Blocs colorés pour les trajets (vert = disponible, bleu = réservé, gris = buffer, rouge = maintenance).
- Clic sur un trajet → redirection vers `/trips/[id]`.

#### `/admin/*` — Panel administrateur

Toutes les pages admin sont dans le layout `/admin/layout.tsx` qui vérifie le rôle admin.

**`/admin`** : Dashboard admin avec stats (nombre de trajets actifs, véhicules en maintenance, etc.).

**`/admin/vehicles`** : Table des véhicules avec actions (modifier, passer en maintenance). Formulaire d'ajout.

**`/admin/trips`** : Table de tous les trajets avec recherche/filtres. 
- Bouton "Modifier" pour modifier toutes les composantes d'un trajet (véhicule, origine, dates, etc.).
- Bouton "Supprimer" (force delete) avec confirmation modale. 
> Notification automatique par mail si des passagers sont impactés (modification ou suppression).

**`/admin/users`** : 
- Section "Services autorisés" : table + formulaire d'ajout.
- Section "Administrateurs" : table des admins + recherche email pour promouvoir.

**`/admin/settings`** : Formulaire simple pour modifier le buffer (input numérique + bouton sauvegarder).

**`/admin/audit`** : Table paginée du journal d'audit avec filtres par type d'action et plage de dates.

---

## 11. Stratégie de cache et temps réel

| Page/Composant | Stratégie | Détail |
|----------------|-----------|--------|
| **Dashboard** | SWR côté client, polling 30s | `useSWR('/api/vehicles', fetcher, { refreshInterval: 30000 })` |
| **Formulaire de réservation** | Fetch frais à chaque recherche | Pas de cache, données critiques |
| **Liste de trajets** | SWR côté client, revalidation au focus | `useSWR('/api/trips', fetcher, { revalidateOnFocus: true })` |
| **Détail de trajet** | SSR + SWR pour les données dynamiques | Server Component pour le rendu initial, SWR pour les mises à jour |
| **Calendrier véhicule** | SWR côté client | Revalidation au focus |
| **Pages admin** | SWR côté client | Pas de polling, revalidation au focus |
| **Autocomplétion BAN** | Pas de cache (debounce 300ms côté client) | Chaque frappe (débounced) = nouveau fetch |
| **Directions ORS** | Cache serveur en mémoire (Map) | Même trajet Le Havre→Paris = même durée, cache 1h |

---

## 12. Phases d'implémentation

> **⛔ RÈGLE IMPÉRATIVE — VALIDATION OBLIGATOIRE ENTRE CHAQUE PHASE**
>
> **L'agent IA développeur DOIT obligatoirement vérifier et valider TOUS les critères de validation listés dans une phase AVANT de passer à la phase suivante.** C'est une obligation, pas une suggestion.
>
> **Procédure stricte à suivre :**
> 1. Implémenter l'intégralité de la phase courante.
> 2. Exécuter chaque critère de validation (commande, test, vérification visuelle).
> 3. Cocher les critères validés (`[x]`).
> 4. Si un critère échoue → corriger le problème AVANT de continuer.
> 5. **Tous les critères doivent être `[x]` pour débloquer la phase suivante.**
> 6. Ne JAMAIS commencer la phase N+1 si la phase N a des critères non validés.
>
> **En cas de blocage** (critère impossible à valider pour des raisons externes, comme l'absence de credentials Entra ID) : documenter le blocage, proposer un contournement temporaire (mock), et demander confirmation à l'utilisateur avant de continuer.

---

### Phase 0 — Initialisation du projet

**Objectif :** Projet Next.js fonctionnel avec toutes les dépendances installées.

**Étapes :**
1. Créer le projet Next.js avec TypeScript et App Router.
2. Installer les dépendances :
   ```
   npm install prisma @prisma/client next-auth @azure/msal-node
   npm install swr date-fns lucide-react sonner
   npm install -D @types/node tsx
   ```
3. Configurer `tsconfig.json` avec les alias `@/` → `src/`.
4. Créer le fichier `.env.example` avec toutes les variables.
5. Créer la structure de dossiers vide (sans contenu).
6. Créer/mettre à jour le fichier `.gitignore` à la racine du projet avec le contenu suivant :
   ```gitignore
   # === Dépendances ===
   node_modules/
   .pnp
   .pnp.js

   # === Next.js ===
   /.next/
   /out/
   /build
   next-env.d.ts

   # === Environnement (SECRETS — NE JAMAIS COMMITER) ===
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local

   # === Vercel ===
   .vercel

   # === Debug ===
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*

   # === TypeScript ===
   *.tsbuildinfo

   # === OS ===
   .DS_Store
   Thumbs.db

   # === IDE ===
   .idea/
   .vscode/
   *.swp
   *.swo

   # === Tests ===
   /coverage
   ```

   > **IMPORTANT :** Le dossier `prisma/migrations/` ne doit PAS être ignoré. Les fichiers de migration doivent être commités pour assurer la reproductibilité du schéma de données.

**Critères de validation :**
- [ ] `npm run dev` démarre sans erreur.
- [ ] La page par défaut de Next.js s'affiche à `http://localhost:3000`.
- [ ] Tous les packages sont installés (`node_modules` existe).
- [ ] Le fichier `.gitignore` existe et contient au minimum : `node_modules/`, `.next/`, `.env.local`, `.vercel`.
- [ ] Le fichier `.env.local` n'est PAS suivi par git (vérifier avec `git status`).

---

### Phase 1 — Base de données

**Objectif :** Schéma Prisma déployé sur Neon avec données de seed.

**Étapes :**
1. Créer une base de données sur Neon (via le dashboard Neon ou l'intégration Vercel).
2. Ajouter `DATABASE_URL` dans `.env.local`.
3. Créer `prisma/schema.prisma` avec le schéma complet (section 5.2).
4. Exécuter `npx prisma migrate dev --name init` pour créer les tables.
5. Créer `prisma/seed.ts` avec les données initiales (section 5.3).
6. Ajouter le script de seed dans `package.json` : `"prisma": { "seed": "tsx prisma/seed.ts" }`.
7. Exécuter `npx prisma db seed`.
8. Créer `src/lib/prisma.ts` (client singleton).

**Critères de validation :**
- [ ] `npx prisma studio` ouvre et affiche les tables.
- [ ] La table `campuses` contient 3 entrées (Le Havre, Caen, Paris).
- [ ] La table `vehicles` contient 3 entrées.
- [ ] La table `app_settings` contient `buffer_minutes = 30`.
- [ ] La table `admins` contient 1 entrée (admin initial).
- [ ] Les relations FK sont vérifiables dans Prisma Studio.

---

### Phase 2 — Authentification

**Objectif :** Login SSO via Entra ID fonctionnel, middleware de protection, vérification des rôles.

**Étapes :**
1. Configurer les variables Entra ID dans `.env.local`.
2. Créer `src/lib/auth.ts` avec la config NextAuth (section 6.2).
3. Créer `src/app/api/auth/[...nextauth]/route.ts`.
4. Créer le middleware `middleware.ts` (section 6.3).
5. Créer la page `/login` (bouton "Se connecter avec Microsoft").
6. Créer la page `/unauthorized`.
7. Implémenter `isAdmin()` dans `src/lib/auth.ts`.
8. Envelopper le layout racine avec `SessionProvider`.

**Critères de validation :**
- [ ] Accéder à `/dashboard` redirige vers `/login` si non connecté.
- [ ] Le bouton "Se connecter" lance le flux OAuth Entra ID.
- [ ] Après connexion, la session contient `entraId`, `email`, `name`.
- [ ] `isAdmin()` retourne `true` pour l'admin initial.
- [ ] Un accès à `/api/admin/*` sans rôle admin retourne 403.

> **Note pour le développement sans Entra ID :** Si les identifiants Entra ID ne sont pas encore disponibles, créer un provider de développement temporaire (CredentialsProvider) qui simule un utilisateur. Le supprimer avant la mise en production.

---

### Phase 3 — Services métier (Core Logic)

**Objectif :** Tous les algorithmes métier implémentés et testables indépendamment.

**Fichiers à créer :**
1. `src/lib/utils/dates.ts` — Helpers de dates, calcul buffer (section 7.3).
2. `src/lib/utils/errors.ts` — Classes d'erreurs métier (section 7.6).
3. `src/lib/utils/constants.ts` — Constantes (`MAX_PASSENGERS = 4`).
4. `src/lib/services/vehicle-service.ts` — Position + disponibilité (sections 7.1, 7.2).
5. `src/lib/services/trip-service.ts` — CRUD trajets + transactions (sections 7.4, 7.5).
6. `src/lib/validators/permission-checker.ts` — Règles de permissions (section 7.7).
7. `src/lib/services/geo-service.ts` — BAN + ORS (section 9).
8. `src/lib/services/audit-service.ts` — Écriture dans le journal d'audit.

**Critères de validation :**
- [ ] **Position véhicule :** Un véhicule par défaut au Havre. Créer un trajet ONE_WAY Le Havre→Paris (arrivée 10h). Appeler `getVehiclePosition(vehicleId, 11h)` → retourne "Paris".
- [ ] **Position avec round trip :** Créer un trajet ROUND_TRIP Le Havre→Paris→Le Havre (retour 18h). Appeler `getVehiclePosition(vehicleId, 12h)` doit considérer que le véhicule est bloqué. `getVehiclePosition(vehicleId, 19h)` → retourne "Le Havre".
- [ ] **Disponibilité :** Créer un trajet pour le véhicule A de 8h à 10h. Appeler `getAvailableVehicles({ departureTime: 9h, endTime: 12h })` → le véhicule A n'est PAS dans la liste.
- [ ] **Buffer :** Avec un buffer de 30min, un trajet qui arrive à 10h bloque le véhicule jusqu'à 10h30. Une réservation à 10h15 doit échouer, à 10h30 doit réussir.
- [ ] **Race condition :** Deux appels `createTrip()` simultanés pour le même véhicule/créneau → un seul réussit, l'autre reçoit `VehicleConflictError`.
- [ ] **Chevauchement conducteur :** Un conducteur avec un trajet de 8h à 12h ne peut pas créer un trajet de 10h à 14h → `DriverOverlapError`.
- [ ] **Permissions suppression :** Un trajet avec un passager SELF → `canDeleteTrip()` retourne `false` pour le conducteur.
- [ ] **Permissions modification :** Un trajet avec passager SELF, départ dans 24h → `canModifyDepartureTime()` retourne `false`.
- [ ] **Geo BAN :** Appel `searchCity("rouen")` → retourne au moins 1 résultat avec lat/lng.
- [ ] **Geo ORS :** Appel `getRouteTime(leHavre, paris)` → retourne une durée > 0.

---

### Phase 4 — API Routes

**Objectif :** Toutes les API Routes fonctionnelles avec les bons codes HTTP et formats de réponse.

**Fichiers à créer :** Tous les fichiers dans `src/app/api/` décrits dans la section 4 du dossier structure.

**Critères de validation :**
- [ ] `GET /api/vehicles` → retourne 3 véhicules avec leur position actuelle.
- [ ] `GET /api/vehicles/availability?...` → retourne la liste filtrée des véhicules dispo.
- [ ] `POST /api/trips` avec des données valides → 201 + trajet créé.
- [ ] `POST /api/trips` avec un véhicule déjà réservé → 409 + `conflictingTripId`.
- [ ] `GET /api/trips/[id]` → retourne le trajet avec `permissions` calculées.
- [ ] `DELETE /api/trips/[id]` avec passagers SELF → 403.
- [ ] `POST /api/trips/[id]/passengers` → ajoute un passager.
- [ ] `GET /api/geo/autocomplete?q=rouen` → résultats BAN.
- [ ] `GET /api/geo/directions?...` → durée ORS.
- [ ] `GET /api/users/search?q=jean` → résultats Graph API.
- [ ] `GET /api/admin/audit` sans rôle admin → 403.
- [ ] `PATCH /api/admin/settings` → met à jour le buffer.

---

### Phase 5 — UI : Design System + Layout

**Objectif :** Base visuelle de l'application : layout, navigation, composants UI réutilisables.

**Fichiers à créer :**
1. `src/app/globals.css` — Variables CSS, reset, design tokens.
2. `src/app/layout.tsx` — Layout racine avec SessionProvider, Toaster, import Google Font (Inter).
3. `src/components/layout/Navbar.tsx` — Barre de navigation responsive.
4. `src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`, `Modal.tsx`.

**Critères de validation :**
- [ ] La navbar affiche le nom de l'utilisateur, les liens (Dashboard, Trajets, Admin si admin).
- [ ] La navbar est responsive (menu hamburger sur mobile).
- [ ] Les composants UI sont stylisés avec les design tokens (couleurs, border-radius, shadows).
- [ ] Le Toaster fonctionne (`toast.success("Test")`).
- [ ] La police Inter est chargée.

---

### Phase 6 — UI : Dashboard

**Objectif :** Tableau de bord complet avec état de la flotte en temps réel.

**Fichiers à créer :**
1. `src/app/dashboard/page.tsx`
2. `src/components/dashboard/FleetOverview.tsx`
3. `src/components/dashboard/VehicleCard.tsx`
4. `src/components/dashboard/UpcomingTrips.tsx`
5. `src/hooks/use-vehicles.ts`

**Critères de validation :**
- [ ] Les 3 véhicules sont affichés avec leur statut et position.
- [ ] Le statut utilise les bons codes couleurs.
- [ ] Les données se rafraîchissent automatiquement (vérifier avec un changement de statut en DB).
- [ ] Le lien "Voir le calendrier" fonctionne.
- [ ] Le bouton "Nouveau trajet" mène à `/trips/new`.
- [ ] La section "Mes prochains trajets" affiche les trajets de l'utilisateur connecté.

---

### Phase 7 — UI : Création de trajet (2 phases)

**Objectif :** Flux complet de réservation fonctionnel.

**Fichiers à créer :**
1. `src/app/trips/new/page.tsx`
2. `src/components/trips/TripSearchForm.tsx` (Phase 1)
3. `src/components/trips/AvailableVehiclesList.tsx`
4. `src/components/trips/SuggestionBanner.tsx`
5. `src/components/trips/TripConfirmForm.tsx` (Phase 2)
6. `src/hooks/use-available-vehicles.ts`

**Critères de validation :**
- [ ] La sélection de destination "Autre" affiche l'autocomplétion BAN.
- [ ] La destination "Autre" force le type "Aller-retour".
- [ ] Le clic sur "Rechercher" calcule les durées (ORS) et affiche les véhicules dispo.
- [ ] Si aucun véhicule → message clair.
- [ ] La suggestion de covoiturage s'affiche si un trajet similaire existe.
- [ ] La sélection d'un véhicule affiche le formulaire Phase 2.
- [ ] L'ajout de passagers fonctionne avec autocomplétion (recherche Graph API).
- [ ] La confirmation crée le trajet et redirige vers `/trips/[id]`.
- [ ] En cas de conflit 409 → message d'erreur avec lien vers le trajet conflictuel.

---

### Phase 8 — UI : Détail de trajet + Liste + Calendrier

**Objectif :** Pages de consultation et interaction avec les trajets.

**Fichiers à créer :**
1. `src/app/trips/page.tsx` (liste + filtres)
2. `src/app/trips/[id]/page.tsx` (détail)
3. `src/app/vehicles/[id]/calendar/page.tsx`
4. `src/components/trips/TripCard.tsx`
5. `src/components/trips/TripDetail.tsx`
6. `src/components/trips/PassengerList.tsx`
7. `src/components/vehicles/VehicleCalendar.tsx`

**Critères de validation :**
- [ ] La page détail affiche toutes les infos du trajet.
- [ ] Le bouton "Rejoindre" est visible si l'utilisateur peut rejoindre.
- [ ] Le bouton "Rejoindre" est masqué si le trajet est passé, complet, ou l'utilisateur est déjà inscrit.
- [ ] Le bouton "Se retirer" fonctionne pour les passagers.
- [ ] Le bouton "Supprimer" affiche un pop-up "Contactez un admin" si des passagers SELF existent.
- [ ] La modification de l'heure de départ fonctionne (recalcul via ORS).
- [ ] Le calendrier véhicule affiche les créneaux occupés et libres.
- [ ] Les filtres de la liste de trajets fonctionnent.

---

### Phase 9 — Panel Administrateur

**Objectif :** Interface d'administration complète.

**Fichiers à créer :**
1. `src/app/admin/layout.tsx` (protection rôle admin)
2. `src/app/admin/page.tsx`
3. `src/app/admin/vehicles/page.tsx`
4. `src/app/admin/trips/page.tsx`
5. `src/app/admin/users/page.tsx`
6. `src/app/admin/settings/page.tsx`
7. `src/app/admin/audit/page.tsx`

**Critères de validation :**
- [ ] Accès refusé pour les non-admins (redirection ou 403).
- [ ] Ajout/modification/suppression de véhicules fonctionne.
- [ ] Passage en maintenance d'un véhicule le retire des résultats de disponibilité.
- [ ] Suppression forcée d'un trajet possible.
- [ ] Gestion de la liste blanche (ajout/suppression de services).
- [ ] Promotion/révocation d'un admin fonctionne.
- [ ] La modification du buffer est effective immédiatement.
- [ ] Le journal d'audit affiche les actions avec pagination et filtres.

---

### Phase 10 — Notifications mail

**Objectif :** Envoi automatique des 2 types de mails via Graph API.

**Fichiers à créer :**
1. `src/lib/services/mail-service.ts`
2. `src/lib/graph-client.ts` (section 9.3)

**Intégration :**
- Appeler `mailService.sendTripConfirmation()` après `createTrip()` (Phase 4, POST /api/trips).
- Appeler `mailService.sendTripCancellation()` après une suppression admin (Phase 4, DELETE /api/trips/[id]).

**Critères de validation :**
- [ ] La création d'un trajet envoie un mail de confirmation au conducteur.
- [ ] La suppression admin d'un trajet avec passagers envoie un mail au conducteur + tous les passagers.
- [ ] Les mails sont envoyés depuis l'adresse partagée configurée.
- [ ] Si l'envoi de mail échoue, le trajet est quand même créé/supprimé (pas de rollback).

---

### Phase 11 — Polish, Responsive et Edge Cases

**Objectif :** Application production-ready.

**Tâches :**
1. **Responsive :** Tester et ajuster toutes les pages sur mobile (375px), tablette (768px), desktop (1280px).
2. **Loading states :** Ajouter des skeletons/spinners sur toutes les pages qui fetch des données.
3. **Empty states :** Messages clairs quand il n'y a pas de données ("Aucun trajet prévu", "Aucun véhicule en maintenance").
4. **Error boundaries :** Gérer les erreurs réseau/serveur avec des messages utilisateur.
5. **Fallback ORS :** Si l'API ORS est down, permettre la saisie manuelle de la durée.
6. **SEO :** Titres de page, meta descriptions.
7. **Accessibilité :** Labels sur les inputs, navigation clavier, contraste suffisant.

**Critères de validation :**
- [ ] L'application est utilisable sur mobile (navigation, formulaire de réservation).
- [ ] Les pages affichent un état de chargement.
- [ ] Les erreurs réseau sont gérées gracieusement.
- [ ] Le fallback de saisie manuelle fonctionne si ORS est injoignable.
- [ ] `npm run build` ne produit aucune erreur.

---

## Annexes

### A. Coordonnées des campus de référence

| Campus | Latitude | Longitude |
|--------|----------|-----------|
| Le Havre | 49.4944 | 0.1079 |
| Caen | 49.1829 | -0.3707 |
| Paris | 48.8566 | 2.3522 |

### B. Durées de trajet estimées (référence)

| Trajet | Durée approx. | Distance approx. |
|--------|:-------------:|:-----------------:|
| Le Havre → Caen | 1h 00min | 85 km |
| Le Havre → Paris | 2h 15min | 200 km |
| Caen → Paris | 2h 30min | 240 km |

### C. Mémo — Demandes à l'équipe IT

**À demander à l'administrateur Microsoft 365 / Azure :**

1. **Créer une App Registration dans Azure Entra ID** pour l'application "ResaVroom".
   - **Type :** Web application
   - **Redirect URIs :**
     - `http://localhost:3000/api/auth/callback/azure-ad` (développement)
     - `https://<domaine-vercel>.vercel.app/api/auth/callback/azure-ad` (production)
2. **Permissions Graph API à accorder :**
   - `User.Read` (déléguée, pas de consentement admin requis)
   - `User.ReadBasic.All` (déléguée, pas de consentement admin requis)
   - `Mail.Send` (application, **consentement admin requis**)
3. **Consentement admin** pour la permission `Mail.Send`.
4. **Informations à récupérer :**
   - Client ID (Application ID)
   - Tenant ID (Directory ID)
   - Client Secret (à créer dans "Certificates & secrets")
5. **Boîte partagée :** Confirmer que la boîte partagée existante (ex: `flotte@entreprise.fr`) peut être utilisée comme expéditeur.

> **Temps estimé pour l'admin :** ~15 minutes.
> **Texte à transmettre :**
> "Bonjour, j'ai besoin d'une App Registration Azure AD pour une application web interne de réservation de véhicules. L'application sera hébergée sur Vercel. Les permissions Graph nécessaires sont : User.Read (déléguée), User.ReadBasic.All (déléguée), et Mail.Send (application — nécessite consentement admin). J'aurais besoin du Client ID, du Tenant ID, et d'un Client Secret. Les Redirect URIs sont : [URLs ci-dessus]. Merci !"
