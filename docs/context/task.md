# Suivi d'avancement — ResaVroom

> **Dernière mise à jour :** 2026-04-16 — Phase 8 terminée
> **Phase courante :** En attente de la Phase 9 (Panel Admin)

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
| **8** | UI : Détail + Liste + Calendrier | ✅ Terminée |
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
- [x] Implémentation du composant exclusif `CustomCalendarPicker` (`DatePickerInput`) pour le choix des dates (remplace les inputs natifs pour correspondre au Design System).
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

## Phase 8 — UI : Détail + Liste + Calendrier ✅

**Tâches réalisées :**
- [x] Page liste trajets (`/trips`) avec filtres
- [x] Page détail trajet (`/trips/[id]`) avec frise chronologique
- [x] Page calendrier véhicule (`/vehicles/[id]/calendar`) avec vue hebdo et mois
- [x] Actions : rejoindre, se retirer, supprimer (modifier dummy ajouté)

**Critères validés :**
- [x] Compilation TypeScript sans erreur
- [x] Application des composants UI standards (ex. DatePickerInput)

---

## Phase 9 — Panel Admin ✅

**Tâches réalisées :**
- [x] Layout admin (`src/app/admin/layout.tsx` + `page.tsx`) protégeant les routes
- [x] Gestion des véhicules (`/admin/vehicles`) : ajout, modification, maintenance
- [x] Gestion des trajets (`/admin/trips`) : liste globale avec pagination, filtres, suppression forcée
- [x] Gestion des utilisateurs (`/admin/users`) : ajout d'admins, gestion des services (liste blanche)
- [x] Gestion des paramètres (`/admin/settings`) : modification de `buffer_minutes`
- [x] Journal d'audit (`/admin/audit`) : affichage avec filtres et pagination

**Critères validés :**
- [x] `npx tsc --noEmit` et `npm run build` passent sans erreurs
- [x] Intégrations respectant le design system (cartes, boutons, modales)
- [x] Notes laissées pour l'évolution vers Entra ID pour la gestion des rôles

---

## Phase 9.5 — Modification des conducteurs par les Admins ✅

**Tâches à faire :**
- [x] Créer `src/components/ui/UserSearchAutocomplete.tsx` permettant de rechercher et sélectionner un utilisateur via `/api/users/search`.
- [x] Mettre à jour `src/components/trips/StepConfirm.tsx` : option "Trajet pour vous" (pré-cochée) décochable si admin, affichant le `UserSearchAutocomplete`.
- [x] Mettre à jour `src/components/admin/AdminEditTripModal.tsx` pour inclure la modification du conducteur avec `UserSearchAutocomplete`.
- [x] Mettre à jour `src/lib/services/trip-service.ts` (`updateTripInfo` et gestion des conflits) pour accepter le changement de `driverEntraId`, `driverEmail`, `driverDisplayName` et valider les chevauchements temporels sur le *nouveau* conducteur.
- [x] Mettre à jour `PATCH /api/trips/[id]/route.ts` et `POST /api/trips/route.ts` pour exploiter ces paramètres si et seulement si l'utilisateur est un Admin.

**Critères de validation (à tester séquentiellement) :**
- [x] **Test 1 :** L'Admin crée un trajet pour lui-même (la case "Trajet pour vous" est cochée, le comportement normal n'est pas perturbé).
- [x] **Test 2 :** L'Admin crée un trajet pour "Marie Martin" (Marie Martin devient le conducteur validé du trajet).
- [x] **Test 3 :** L'Admin crée un trajet pour "Jean Dupont", mais Jean a déjà un trajet sur le même créneau (le système refuse l'action avec l'erreur métier `DriverOverlapError`).
- [x] **Test 4 :** Depuis le Panel Admin, l'Admin modifie un trajet existant et change son conducteur actuel vers "Jean Dupont". La modification réussit et le trajet s'affiche au nom de Jean.

---

## Phase 9.6 — Améliorations Panel Admin 

**Tâches à faire :**
- [ ] Mettre à jour `src/components/admin/AdminEditTripModal.tsx` pour intégrer le calcul automatique des temps de trajet via l'API (ex: `use-geo.ts` ou `/api/geo/directions`). Les champs d'arrivée estimée (`estimatedArrivalTime`, `estimatedReturnArrivalTime`) doivent être calculés dynamiquement et affichés en lecture seule.
- [ ] Remplacer les champs `<Input type="datetime-local" />` par le composant calendrier du projet (ex: `DatePickerInput`) dans `AdminEditTripModal.tsx` et empêcher la sélection de dates antérieures à maintenant.
- [ ] Ajouter un champ permettant de modifier le statut du trajet (`status` : `SCHEDULED`, `CANCELLED`) dans `AdminEditTripModal.tsx`.
- [ ] Mettre à jour `updateTripInfo` dans `src/lib/services/trip-service.ts` pour accepter et traiter le changement de `status`.
- [ ] Revoir et corriger les règles de validation (conflits) dans `updateTripInfo` : s'assurer qu'un admin ne puisse pas créer un chevauchement temporel pour un véhicule ou pour un conducteur (y compris avec la gestion correcte du buffer de sécurité).

**Critères de validation (Tests obligatoires) :**
- [ ] **Test 1 (ETA automatique) :** Modifier l'heure de départ ou la destination d'un trajet et vérifier que l'heure d'arrivée est recalculée automatiquement (lecture seule).
- [ ] **Test 2 (Calendrier) :** Ouvrir le sélecteur de date/heure et vérifier qu'aucune date passée ne peut être sélectionnée.
- [ ] **Test 3 (Statut) :** Changer le statut d'un trajet de `SCHEDULED` à `CANCELLED` via la modale et valider que l'interface et la base de données reflètent ce changement.
- [ ] **Test 4 (Conflit Véhicule) :** Tenter d'assigner un véhicule qui possède déjà un trajet sur le nouveau créneau choisi. L'action doit être rejetée avec une erreur claire de conflit de véhicule.
- [ ] **Test 5 (Conflit Conducteur) :** Tenter de déplacer un trajet sur un créneau où le conducteur est déjà assigné à un autre trajet. L'action doit être rejetée avec une erreur claire de chevauchement.

---

## Phase 10 — Notifications mail ⏳

**Tâches à faire :**
- [ ] `src/lib/graph-client.ts` — Token Graph API
- [ ] `src/lib/services/mail-service.ts` — Envoi mails
- [ ] 2 templates : confirmation trajet, annulation admin

**Critères de validation :**
- [ ] La création d'un trajet envoie un mail de confirmation au conducteur.
- [ ] La suppression admin d'un trajet avec passagers envoie un mail au conducteur + tous les passagers.
- [ ] Les mails sont envoyés depuis l'adresse partagée configurée.
- [ ] Si l'envoi de mail échoue, le trajet est quand même créé/supprimé (pas de rollback).
---

## Phase 11 — Polish ⏳

**Tâches à faire :**
- [ ] Responsive (mobile 375px, tablette 768px, desktop 1280px)
- [ ] Loading states (skeletons/spinners)
- [ ] Empty states, Error boundaries
- [ ] Fallback ORS (saisie manuelle si API down)
- [ ] SEO (titres, meta descriptions)
- [ ] `npm run build` sans erreur

**Critères de validation :**
- [ ] L'application est utilisable sur mobile (navigation, formulaire de réservation).
- [ ] Les pages affichent un état de chargement.
- [ ] Les erreurs réseau sont gérées gracieusement.
- [ ] Le fallback de saisie manuelle fonctionne si ORS est injoignable.
- [ ] `npm run build` ne produit aucune erreur.