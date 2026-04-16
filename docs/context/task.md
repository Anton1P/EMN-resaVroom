# Suivi d'avancement — ResaVroom

> **Dernière mise à jour :** 2026-04-15 — Phase 7 terminée  
> **Phase courante :** En attente de la Phase 8 (UI : Détail + Liste + Calendrier)

---

## Résumé

| Phase | Objectif | Statut |
|:-----:|----------|:------:|
| **0** | Initialisation projet | ✅ Terminée |
| **1** | Base de données | ✅ Terminée |
| **2** | Authentification | ✅ Terminée |
| **3** | Services métier (Core Logic) | ✅ Terminée |
| **4** | API Routes | ✅ Terminée |
| **5** | UI : Design System + Layout | ✅ Terminée |
| **6** | UI : Dashboard | ✅ Terminée |
| **7** | UI : Création de trajet | ✅ Terminée |
| **8** | UI : Détail + Liste + Calendrier | ⏳ À faire |
| **9** | Panel Admin | ⏳ À faire |
| **10** | Notifications mail | ⏳ À faire |
| **11** | Polish + Responsive | ⏳ À faire |

---

## Phase 0 — Initialisation du projet ✅

**Tâches réalisées :**
- [x] Création du projet Next.js 16.2.3 (TypeScript, App Router, Turbopack)
- [x] Installation des dépendances : `prisma`, `@prisma/client`, `next-auth`, `@azure/msal-node`, `swr`, `date-fns`, `lucide-react`, `sonner`, `tsx`
- [x] Configuration `tsconfig.json` avec alias `@/*` → `src/`
- [x] Création du fichier `.env.example` (template des variables)
- [x] Création de la structure de dossiers complète (section 4 du SAD)
- [x] Mise en place du `.gitignore` conforme au SAD

**Critères validés :** `npm run dev` OK, page Next.js affichée, packages installés, `.gitignore` complet, `.env.local` non suivi par git.

---

## Phase 1 — Base de données ✅

**Tâches réalisées :**
- [x] Création de `prisma/schema.prisma` — 9 tables, 5 enums, index de performance
- [x] Adaptation à **Prisma 7** (breaking changes vs SAD) :
  - Provider `"prisma-client"` + `output` obligatoire → `src/generated/prisma/`
  - Création de `prisma.config.ts` (remplace `url`/`directUrl` dans le schema)
  - Ajout `"type": "module"` dans `package.json`
- [x] Résolution du **blocage port 5432** (firewall entreprise) :
  - Installation du Neon Serverless Driver (`@prisma/adapter-neon`, `@neondatabase/serverless`, `ws`)
  - Migration exécutée via hotspot mobile (une seule fois)
  - Runtime via WebSocket port 443 (fonctionne sur réseau entreprise)
- [x] Exécution de `npx prisma migrate dev --name init` → migration `20260415124547_init`
- [x] Exécution de `npx prisma generate` → client généré dans `src/generated/prisma/`
- [x] Création et exécution du seed (`prisma/seed.ts`) :
  - 3 campus (Le Havre, Caen, Paris) avec coordonnées GPS
  - 3 véhicules (Peugeot 308, Renault Zoé, Citroën C3) liés aux campus
  - 1 paramètre (`buffer_minutes = 30`)
  - 1 admin initial (`admin@entreprise.fr`)
- [x] Création de `src/lib/prisma.ts` — client singleton avec PrismaNeon adapter

**Critères validés :** Toutes les tables peuplées et vérifiées, relations FK fonctionnelles, connexion WebSocket opérationnelle.

**Erreurs documentées :** 3 erreurs dans `docs/errors/errors.md` (Prisma 7 breaking changes, port 5432 bloqué, API PrismaNeon changée).

---

## Phase 2 — Authentification ✅

**Tâches réalisées :**
- [x] Création de `src/lib/auth.ts` — NextAuth v4 avec **CredentialsProvider temporaire** (3 utilisateurs dev)
- [x] Création de `src/types/next-auth.d.ts` — Types augmentés (entraId dans Session/JWT)
- [x] Création de `src/app/api/auth/[...nextauth]/route.ts` — Route handler NextAuth
- [x] Création de `middleware.ts` — Protection de toutes les routes (sauf login, auth, assets)
- [x] Création de `src/app/(auth)/login/page.tsx` — Page de login avec sélecteur d'utilisateur dev
- [x] Création de `src/app/(auth)/unauthorized/page.tsx` — Page "Accès refusé"
- [x] Implémentation de `isAdmin()`, `requireAuth()`, `requireAdmin()` dans auth.ts
- [x] Création de `src/app/providers.tsx` — SessionProvider + Sonner Toaster
- [x] Mise à jour de `src/app/layout.tsx` — Layout racine avec Inter font + Providers
- [x] Création de `src/app/globals.css` — Design tokens + styles login
- [x] Création de `src/app/page.tsx` — Redirection `/` → `/dashboard`
- [x] Création de `src/app/dashboard/page.tsx` — Placeholder avec infos session
- [x] Création de `src/app/api/auth/check-admin/route.ts` — Route de debug admin

**Provider de développement temporaire :**
- 3 comptes : Admin Dev (admin), Jean Dupont (user), Marie Martin (user)
- Mot de passe universel : `dev`
- ⚠️ À remplacer par AzureADProvider quand les credentials Entra ID seront disponibles

**Critères validés :**
- [x] `/dashboard` redirige vers `/login` si non connecté
- [x] Bouton "Se connecter" authentifie avec le provider de dev
- [x] Session contient `entraId`, `email`, `name`
- [x] `isAdmin()` retourne `true` pour l'admin initial, `false` pour les autres
- [x] API check-admin vérifié par curl (JSON response correcte)

---

## Phase 3 — Services métier ✅

**Tâches réalisées :**
- [x] `src/lib/utils/constants.ts` — Constantes métier (MAX_PASSENGERS, TOTAL_SEATS, buffers)
- [x] `src/lib/utils/errors.ts` — 5 classes d'erreurs (BusinessError, VehicleConflict, DriverOverlap, PassengerOverlap, Permission, Validation)
- [x] `src/lib/utils/dates.ts` — Helpers dates, buffer configurable, statut d'affichage dérivé (SAD 7.3 + 7.8)
- [x] `src/lib/services/vehicle-service.ts` — Position dérivée (SAD 7.1), disponibilité (SAD 7.2), suggestions covoiturage, dashboard data
- [x] `src/lib/services/trip-service.ts` — Création transactionnelle (SAD 7.4), détection conflits (SAD 7.5), annulation, modification horaire, gestion passagers
- [x] `src/lib/validators/permission-checker.ts` — Règles suppression/modification/inscription/retrait (SAD 7.7)
- [x] `src/lib/services/geo-service.ts` — BAN autocomplétion + ORS directions + fallback Haversine
- [x] `src/lib/services/audit-service.ts` — Journalisation avec pagination (hors transaction)

**Critères validés :**
- [x] `npx tsc --noEmit` → 0 erreurs
- [x] Dev server démarre sans erreur
- [x] Auth + Prisma + Neon WebSocket fonctionnels ensemble

**Algorithmes SAD implémentés :**
- 7.1 Position véhicule (dérivée du dernier trajet)
- 7.2 Recherche véhicules disponibles (position + chevauchement + maintenance)
- 7.3 Calcul buffer (configurable via app_settings)
- 7.4 Création trajet (transaction sérialisée, 3 vérifications)
- 7.5 Détection conflits (véhicule + conducteur + passagers)
- 7.6 Classes d'erreurs métier (avec conflictingTripId)
- 7.7 Règles de permissions (suppression, modification, inscription)
- 7.8 Statut d'affichage dérivé (scheduled/in_progress/completed/cancelled)

---

## Phase 4 — API Routes ✅

**Tâches réalisées :**
- [x] `src/lib/api-helpers.ts` — Helpers partagés (auth session, admin check, error handling)
- [x] `GET /api/vehicles` — Liste véhicules avec position actuelle et displayStatus
- [x] `GET /api/vehicles/availability` — Véhicules disponibles + suggestions covoiturage
- [x] `GET /api/trips` — Liste trajets avec filtres et pagination
- [x] `POST /api/trips` — Création trajet (transaction sérialisée)
- [x] `GET /api/trips/[id]` — Détail trajet avec permissions calculées
- [x] `PATCH /api/trips/[id]` — Modification heure de départ
- [x] `DELETE /api/trips/[id]` — Annulation (soft delete)
- [x] `POST /api/trips/[id]/passengers` — Ajout passager (SELF ou DRIVER)
- [x] `DELETE /api/trips/[id]/passengers/[passengerId]` — Retrait passager
- [x] `GET /api/geo/autocomplete` — Proxy BAN (villes françaises)
- [x] `GET /api/geo/directions` — Proxy ORS + fallback Haversine
- [x] `GET /api/users/search` — Recherche utilisateurs (mode dev : mock)
- [x] `GET/POST /api/admin/admins` + `DELETE /api/admin/admins/[id]`
- [x] `GET/POST /api/admin/services` + `DELETE /api/admin/services/[id]`
- [x] `GET/PATCH /api/admin/settings`
- [x] `GET /api/admin/audit` — Journal d'audit paginé

**Critères validés :**
- [x] `npx tsc --noEmit` → 0 erreurs
- [x] `GET /api/vehicles` → 3 véhicules avec currentCampus + displayStatus
- [x] `GET /api/admin/settings` (admin) → 200, buffer_minutes=30
- [x] `GET /api/admin/settings` (non-admin) → 403
- [x] `GET /api/geo/autocomplete?q=Rouen` → résultats BAN
- [x] `GET /api/geo/directions` Le Havre→Paris → ~197km, ~2h22
- [x] `GET /api/users/search?q=jean` → Jean Dupont
- [x] `GET /api/trips?status=all` → liste vide (pas encore de trajets)

**16 endpoints créés**, tous testés par curl.

---

## Phase 5 — UI : Design System + Layout ✅

**Tâches réalisées :**
- [x] `src/app/globals.css` — Variables CSS augmentées, design tokens (Glassmorphism, animations)
- [x] Composants UI (`Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`) avec styles riches
- [x] CSS dédié aux composants (`ui.css`)
- [x] `src/components/layout/Navbar.tsx` — Navigation responsive connectée à la session et à `isAdmin`
- [x] `src/app/layout.tsx` — Layout racine mis à jour avec les nouveaux styles et la navbar
- [x] Extension des types NextAuth (`entraId`, `isAdmin`) pour synchronisation front/back

**Critères validés :**
- [x] Modèles UI indépendants (0 erreur TypeScript)
- [x] Le dev server renvoie 200 avec la nouvelle Navbar intégrée.

---

## Phase 6 — UI : Dashboard ✅

**Tâches réalisées :**
- [x] `src/hooks/use-vehicles.ts` — Hook SWR avec polling 30s.
- [x] `src/hooks/use-trips.ts` — Hook SWR pour afficher les trajets à venir.
- [x] Composants spécifiques au dashboard :
  - `FleetOverview.tsx` : Métriques clés de la flotte en temps réel (Totale, Disponibles, En Trajet, Maintenance).
  - `VehicleCard.tsx` : Fiche d'information détaillée d'un véhicule (position, statut, capacité, bouton réserver).
  - `UpcomingTrips.tsx` : Liste ou état vide ("Aucun trajet à venir") des réservations.
- [x] `src/app/dashboard/page.tsx` — Page assemblant les composants avec rafraîchissement manuel et automatique SWR.

**Critères validés :**
- [x] Compilation sans erreur (`npx tsc --noEmit`).
- [x] Dashboard accessible via `/dashboard` et qui interroge les API correctement.

---

## Phase 7 — UI : Création de trajet ✅

**Tâches réalisées :**
- [x] Hook `use-geo.ts` et proxy ORS / BAN intégrés
- [x] Formulaire `StepSearch.tsx` (calcul d'ETA et recherche des véhicules disponibles et trajets de covoiturage existants)
- [x] Composant `AddressAutocomplete.tsx`
- [x] Formulaire `StepConfirm.tsx` (récapitulatif, formulaire passagers multiples, vérification de capacité)
- [x] Orchestrateur stateful `TripWizard.tsx` gérant la soumission
- [x] Gestion des conflits (409) et alertes via react-hot-toast/sonner
- [x] Update du `VehicleCard` pour être réutilisable dans le wizard sans dupliquer les boutons d'action.

**Critères validés :**
- [x] Compilation TypeScript sans erreur
- [x] Wizard entièrement fonctionnel encapsulé dans `/trips/new`

---

## Phase 8 — UI : Détail + Liste + Calendrier ⏳

**Tâches à faire :**
- [ ] Page détail trajet (`/trips/[id]`)
- [ ] Page liste trajets (`/trips`) avec filtres
- [ ] Page calendrier véhicule (`/vehicles/[id]/calendar`)
- [ ] Actions : rejoindre, se retirer, modifier, supprimer

---

## Phase 9 — Panel Admin ⏳

**Tâches à faire :**
- [ ] Layout admin (protection rôle)
- [ ] Pages : véhicules, trajets, utilisateurs, settings, audit
- [ ] CRUD complet + suppression forcée

---

## Phase 10 — Notifications mail ⏳

**Tâches à faire :**
- [ ] `src/lib/graph-client.ts` — Token Graph API
- [ ] `src/lib/services/mail-service.ts` — Envoi mails
- [ ] 2 templates : confirmation trajet, annulation admin

---

## Phase 11 — Polish ⏳

**Tâches à faire :**
- [ ] Responsive (mobile 375px, tablette 768px, desktop 1280px)
- [ ] Loading states (skeletons/spinners)
- [ ] Empty states, Error boundaries
- [ ] Fallback ORS (saisie manuelle si API down)
- [ ] SEO (titres, meta descriptions)
- [ ] `npm run build` sans erreur
