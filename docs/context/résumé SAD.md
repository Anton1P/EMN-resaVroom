# Résumé du Document d'Architecture Logicielle (SAD)
# ResaVroom — Application de Réservation de Véhicules Inter-Campus

> **Document complet :** [SAD.md](../SAD.md)
> **Cahier des charges :** [Cahier des charge.md](../Cahier%20des%20charge.md)

---

## Objectif de l'application

Application web interne permettant de **gérer, réserver et covoiturer** une flotte de 3 véhicules entre 3 campus (Le Havre, Caen, Paris) + destinations libres.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Framework** | Next.js 14+ (App Router, TypeScript) |
| **Hébergement** | Vercel |
| **Base de données** | Neon (PostgreSQL Serverless) |
| **ORM** | Prisma |
| **Authentification** | Microsoft Entra ID via NextAuth.js |
| **Autocomplétion adresses** | api-adresse.data.gouv.fr (BAN) — gratuit, illimité |
| **Calcul temps de trajet** | OpenRouteService (OSM) — gratuit, 2000 req/jour |
| **Envoi de mails** | Microsoft Graph API (`Mail.Send`) |
| **Recherche utilisateurs** | Microsoft Graph API (`User.ReadBasic.All`) |

---

## Schéma de données (9 tables)

| Table | Rôle | Champs clés |
|-------|------|-------------|
| **campuses** | 3 campus de référence | name, latitude, longitude |
| **vehicles** | Flotte de 3 véhicules | name, licensePlate, seats, status (AVAILABLE/MAINTENANCE), defaultCampusId |
| **trips** | Réservations / trajets | vehicleId, driverEntraId, type (ONE_WAY/ROUND_TRIP/ROUND_TRIP_OTHER), origin/destination, horaires, status (SCHEDULED/CANCELLED) |
| **passengers** | Passagers par trajet | tripId, userEntraId, addedBy (DRIVER/SELF) — clé des règles de permission |
| **admins** | Administrateurs | userEntraId, userEmail |
| **authorized_services** | Liste blanche | serviceName |
| **app_settings** | Paramètres configurables | key/value (ex: buffer_minutes=30) |
| **audit_logs** | Journal d'audit (admin) | action, entityType, entityId, details (JSON) |

### Décisions de design clés

- **Pas de table `users`** : les identités viennent de Entra ID, les noms sont stockés en snapshot dans trips/passengers.
- **Statut trajet dérivé** : seuls SCHEDULED et CANCELLED en base. "En cours" et "Terminé" sont calculés à partir des dates.
- **Soft delete** : les trajets supprimés passent en CANCELLED, jamais supprimés physiquement.
- **`addedBy` sur passengers** : distingue les passagers ajoutés par le conducteur (DRIVER) de ceux inscrits eux-mêmes (SELF). Conditionne les règles de suppression/modification.
- **Buffer configurable** : temps de battement entre réservations, configurable depuis le panel admin (défaut: 30 min).

---

## Algorithmes métier critiques

### 1. Position des véhicules (dérivée)

La position d'un véhicule à un instant T se calcule à partir du dernier trajet terminé :
- **ONE_WAY** terminé → véhicule au campus de destination
- **ROUND_TRIP** terminé → véhicule au campus d'origine (il est revenu)
- **ROUND_TRIP_OTHER** terminé → véhicule au campus de retour
- **Aucun trajet** → véhicule à son campus par défaut

### 2. Disponibilité véhicule

Un véhicule est disponible si : pas en maintenance + sera au bon campus à l'heure de départ + pas de chevauchement temporel (buffer inclus).

### 3. Flux de réservation en 2 phases

**Phase 1 — Recherche :**
1. L'utilisateur saisit : campus départ, destination, type, date/heure
2. Le système calcule les durées (ORS) et filtre les véhicules disponibles
3. Affiche uniquement les véhicules dispo + suggestion de trajets existants (covoiturage)

**Phase 2 — Confirmation (en transaction) :**
1. Re-vérification de la disponibilité (protection race condition)
2. Vérification chevauchement conducteur
3. Vérification chevauchement passagers
4. Création du trajet en transaction atomique
5. Envoi mail de confirmation (hors transaction)

### 4. Messages d'erreur actionnables

Chaque erreur fournit un lien vers le trajet conflictuel :
- Véhicule pris → lien vers le trajet concurrent (possibilité de rejoindre)
- Chevauchement conducteur → lien vers le trajet existant
- Chevauchement passager → lien vers le trajet du passager

---

## Règles métier principales

### Véhicules
- 1 véhicule = 1 réservation à la fois (non-chevauchement)
- Cohérence géographique (véhicule au bon endroit au bon moment)
- Buffer de sécurité après chaque trajet (configurable, défaut 30 min)
- Destination "Autre" → aller-retour obligatoire, véhicule bloqué pour la durée

### Personnes
- Conducteur ET passagers : pas de chevauchement temporel
- Max 4 passagers + 1 conducteur = 5 personnes par véhicule
- Inscription covoiturage : trajet complet (tout ou rien)
- Retrait passager : libre à tout moment avant le départ, sans notification

### Modification / Suppression
- **Suppression par le conducteur** : autorisée uniquement si aucun passager SELF. Sinon → contacter un admin.
- **Modification** : seule l'heure de départ est modifiable. Si passagers SELF → 48h minimum avant le départ.
- **Admin** : peut tout supprimer/modifier. Notification mail automatique aux impactés.

---

## Notifications mail (2 scénarios seulement)

| Événement | Destinataires |
|-----------|---------------|
| Trajet créé | Conducteur (confirmation) |
| Trajet supprimé par admin (avec passagers) | Conducteur + tous les passagers |

---

## Pages de l'application

| Route | Description |
|-------|-------------|
| `/dashboard` | Tableau de bord : état des 3 véhicules, position, prochains trajets |
| `/trips/new` | Formulaire de création en 2 phases |
| `/trips` | Recherche de trajets (covoiturage) |
| `/trips/[id]` | Détail d'un trajet + actions (rejoindre, se retirer, modifier, supprimer) |
| `/vehicles/[id]/calendar` | Calendrier d'un véhicule (créneaux occupés/libres) |
| `/admin` | Dashboard admin |
| `/admin/vehicles` | CRUD véhicules + maintenance |
| `/admin/trips` | Gestion des trajets (suppression forcée) |
| `/admin/users` | Liste blanche services + gestion admins |
| `/admin/settings` | Configuration du buffer |
| `/admin/audit` | Journal d'audit |

---

## 12 Phases d'implémentation

> **⛔ RÈGLE IMPÉRATIVE :** L'agent IA développeur DOIT valider TOUS les critères de chaque phase AVANT de passer à la suivante. Pas d'exception.

| Phase | Objectif | Critères clés |
|:-----:|----------|---------------|
| **0** | Initialisation projet | `npm run dev` démarre, packages installés |
| **1** | Base de données | Prisma migré sur Neon, seed OK (3 campus, 3 véhicules, paramètres) |
| **2** | Authentification | SSO Entra ID fonctionnel, middleware protège les routes, rôle admin vérifié |
| **3** | Services métier | Position véhicule, disponibilité, transactions, permissions, APIs geo — tous testés unitairement |
| **4** | API Routes | 15+ endpoints fonctionnels avec bons codes HTTP et formats |
| **5** | UI : Design System | Layout, navbar responsive, composants UI stylisés |
| **6** | UI : Dashboard | 3 cartes véhicules, statuts temps réel (SWR polling 30s) |
| **7** | UI : Création trajet | Formulaire 2 phases complet, autocomplétion, suggestion covoiturage |
| **8** | UI : Détail + Liste + Calendrier | Pages de consultation, actions passagers, calendrier véhicule |
| **9** | Panel Admin | Gestion véhicules/trajets/users/settings/audit, accès protégé |
| **10** | Notifications mail | Graph API Mail.Send, 2 templates |
| **11** | Polish | Responsive, loading states, error boundaries, fallback ORS, `npm run build` OK |

---

## Permissions Microsoft Graph à demander à l'IT

| Permission | Type | Consentement admin | Usage |
|------------|------|:------------------:|-------|
| `User.Read` | Déléguée | Non | Profil de l'utilisateur connecté |
| `User.ReadBasic.All` | Déléguée | Non | Recherche d'utilisateurs (ajout passagers) |
| `Mail.Send` | Application | **Oui** | Envoi de mails depuis la boîte partagée |

**À fournir à l'admin IT :** Client ID, Tenant ID, Client Secret + Redirect URIs (`localhost:3000` + domaine Vercel).
