# Suivi d'avancement — ResaVroom

> **Dernière mise à jour :** 2026-04-15 — Phase 2 terminée  
> **Phase courante :** En attente de la Phase 3 (Services métier)

---

## Résumé

| Phase | Objectif | Statut |
|:-----:|----------|:------:|
| **0** | Initialisation projet | ✅ Terminée |
| **1** | Base de données | ✅ Terminée |
| **2** | Authentification | ✅ Terminée |
| **3** | Services métier (Core Logic) | ⏳ À faire |
| **4** | API Routes | ⏳ À faire |
| **5** | UI : Design System + Layout | ⏳ À faire |
| **6** | UI : Dashboard | ⏳ À faire |
| **7** | UI : Création de trajet | ⏳ À faire |
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

## Phase 3 — Services métier ⏳

**Tâches à faire :**
- [ ] `src/lib/utils/dates.ts` — Helpers de dates, calcul buffer
- [ ] `src/lib/utils/errors.ts` — Classes d'erreurs métier
- [ ] `src/lib/utils/constants.ts` — Constantes (`MAX_PASSENGERS = 4`)
- [ ] `src/lib/services/vehicle-service.ts` — Position + disponibilité
- [ ] `src/lib/services/trip-service.ts` — CRUD trajets + transactions
- [ ] `src/lib/validators/permission-checker.ts` — Règles de permissions
- [ ] `src/lib/services/geo-service.ts` — BAN + ORS
- [ ] `src/lib/services/audit-service.ts` — Journal d'audit

---

## Phase 4 — API Routes ⏳

**Tâches à faire :**
- [ ] Routes véhicules (`/api/vehicles`, `/api/vehicles/availability`, `/api/vehicles/[id]`)
- [ ] Routes trajets (`/api/trips`, `/api/trips/[id]`)
- [ ] Routes passagers (`/api/trips/[id]/passengers`)
- [ ] Routes géo (`/api/geo/autocomplete`, `/api/geo/directions`)
- [ ] Routes utilisateurs (`/api/users/search`)
- [ ] Routes admin (`/api/admin/admins`, `/api/admin/services`, `/api/admin/settings`, `/api/admin/audit`)

---

## Phase 5 — UI : Design System + Layout ⏳

**Tâches à faire :**
- [ ] `src/app/globals.css` — Variables CSS, design tokens
- [ ] `src/app/layout.tsx` — Layout racine avec providers
- [ ] `src/components/layout/Navbar.tsx` — Navigation responsive
- [ ] Composants UI : Button, Card, Badge, Input, Select, Modal

---

## Phase 6 — UI : Dashboard ⏳

**Tâches à faire :**
- [ ] `src/app/dashboard/page.tsx`
- [ ] Composants : FleetOverview, VehicleCard, UpcomingTrips
- [ ] Hook `use-vehicles.ts` (SWR polling 30s)

---

## Phase 7 — UI : Création de trajet ⏳

**Tâches à faire :**
- [ ] Formulaire Phase 1 (recherche véhicules)
- [ ] Formulaire Phase 2 (confirmation réservation)
- [ ] Autocomplétion BAN, suggestion covoiturage
- [ ] Gestion des erreurs 409 (conflits)

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
