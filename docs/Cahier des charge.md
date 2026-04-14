# Cahier des Charges Global : Application de Réservation de Véhicules Inter-Campus

## 1. Objectif Principal
Développer une application web permettant la gestion, la réservation et le covoiturage d'une flotte interne de véhicules circulant entre différents campus.

## 2. Périmètre et Entités Principales
- **La Flotte :** Gestion de 3 véhicules distincts.
- **Les Lieux :** 3 campus de référence (Le Havre, Caen, Paris) + une destination libre ("Autre").
- **Les Acteurs :** Utilisateurs internes pouvant être soit conducteurs, soit passagers. Administrateurs pour la gestion de la flotte et de l'application.

## 3. Authentification et Gestion des Rôles

### 3.1. Authentification
- Connexion via **Microsoft Entra ID** (ex-Azure AD) en Single Sign-On (SSO).
- Récupération automatique du **nom, prénom et adresse e-mail** de l'utilisateur connecté via le profil Microsoft.

### 3.2. Contrôle d'accès — Liste blanche
- L'accès à l'application est restreint par une **liste blanche** de services ou groupes autorisés.
- Cette liste blanche est **administrable depuis le panneau Admin** (ajout/suppression de services autorisés).
- Un utilisateur non présent dans un service autorisé ne peut ni accéder à l'application ni effectuer de réservation.

### 3.3. Rôles
- **Utilisateur standard :** Peut créer des trajets (en tant que conducteur), rejoindre des trajets (en tant que passager), consulter le tableau de bord et les agendas.
- **Administrateur :** Toutes les permissions d'un utilisateur standard + gestion de la flotte, suppression/modification forcée de trajets, gestion de la liste blanche, gestion des rôles admin, consultation de l'historique d'audit.
- La promotion au rôle administrateur se fait depuis le **panneau Admin** en sélectionnant l'adresse e-mail de l'utilisateur à promouvoir.

## 4. Fonctionnalités Requises (Features)

### 4.1. Tableau de Bord (Dashboard)
Une vue synthétique permettant de comprendre immédiatement la situation de la flotte.
- Affichage de l'état en temps réel de chaque véhicule (Disponible, Indisponible, Complet, En déplacement "Autre", En Maintenance/Garage).
- Visualisation de la position courante de chaque véhicule (campus où il se trouve).
- Indication de la disponibilité immédiate et des prochaines réservations.

### 4.2. Moteur de Réservation de Trajets
Interface permettant à un utilisateur de réserver un véhicule en tant que conducteur.

#### 4.2.1. Types de trajets
- **Aller simple (Campus → Campus) :** Le véhicule devient disponible au campus d'arrivée à la fin du trajet (+ buffer).
- **Aller-retour (Campus → Campus → Campus d'origine) :** Le conducteur déclare une heure de départ pour le retour. Le véhicule est entièrement bloqué entre le départ de l'aller et l'arrivée du retour (+ buffer).
- **Aller-retour vers "Autre" (Campus → Destination libre → Campus de retour) :** Obligatoirement un aller-retour. Pas d'aller simple vers "Autre". Le véhicule est bloqué pour toute la durée. Le campus de retour doit être un des 3 campus de référence.

#### 4.2.2. Destination "Autre"
- La saisie de la destination utilise une **API cartographique avec autocomplétion** (recherche de ville/adresse).
- Le système calcule automatiquement le temps de trajet via cette même API.
- **Un trajet "Autre" est obligatoirement un aller-retour** avec retour vers un campus de référence. Le véhicule est inutilisable pendant toute la durée du trajet.

#### 4.2.3. Calcul automatique du temps de trajet
- **Estimation automatique** de la durée du trajet via une API cartographique externe.
- L'heure d'arrivée est calculée automatiquement en fonction de l'heure de départ et de la durée estimée.
- Pour les aller-retour : le conducteur déclare l'heure de départ du retour. L'heure d'arrivée du retour est calculée automatiquement.
- **Fallback :** En cas d'indisponibilité de l'API, saisie manuelle de la durée de trajet par l'utilisateur.

#### 4.2.4. Filtrage et validation
- Filtrage dynamique lors de la saisie pour ne proposer que les véhicules **réellement disponibles** (croisement du temps, de l'espace et du buffer).
- Validation des contraintes métier en temps réel lors de la réservation.
- Messages d'erreurs explicites (ex : "Le véhicule ne sera pas à Paris à cette heure-ci").

#### 4.2.5. Zone de commentaire
- Champ texte libre réservé au conducteur lors de la réservation pour y ajouter des détails sur le trajet.

### 4.3. Règles de Modification et d'Annulation des Trajets

#### 4.3.1. Ajout de passagers par le conducteur
- Le conducteur (créateur du trajet) peut **ajouter manuellement des passagers** à son trajet lors de la création ou après.

#### 4.3.2. Suppression d'un trajet
- **Sans passagers externes :** Le conducteur peut supprimer librement son trajet (même s'il a des passagers qu'il a ajoutés lui-même).
- **Avec des passagers externes** (utilisateurs qui se sont inscrits eux-mêmes) : Le conducteur **ne peut pas supprimer** le trajet. Un message pop-up l'informe qu'il doit **contacter un administrateur** pour procéder à la suppression.
- **Suppression par un Admin :** L'administrateur peut forcer la suppression de n'importe quel trajet. Tous les passagers et le conducteur sont alors **notifiés par e-mail**.

#### 4.3.3. Modification d'un trajet
- Le conducteur **ne peut pas modifier** la destination, le véhicule ou le type de trajet une fois créé.
- **Seule l'heure de départ est modifiable**, sous les conditions suivantes :
  - La modification doit être faite **au moins 48 heures avant le départ**.
  - La restriction des 48h ne s'applique **que si le trajet contient des passagers externes** (inscrits par eux-mêmes, pas ajoutés par le conducteur).
  - Si le trajet n'a que des passagers ajoutés par le conducteur (ou aucun passager), l'heure de départ est modifiable sans contrainte de délai.

### 4.4. Module de Covoiturage (Passagers)
Fonctionnalités permettant d'optimiser le taux d'occupation des véhicules.

#### 4.4.1. Recherche de trajets
- Moteur de recherche avec filtres (date, campus de départ) pour trouver les trajets futurs.

#### 4.4.2. Inscription comme passager
- Possibilité pour un utilisateur de rejoindre un trajet existant en tant que passager (**jusqu'à 4 passagers maximum**, en plus du conducteur).
- L'inscription sur un trajet aller-retour est **par trajet complet** : le passager est inscrit sur l'aller ET le retour. Pas d'inscription partielle (aller seul ou retour seul).

#### 4.4.3. Retrait d'un passager
- Un passager peut se retirer d'un trajet **à tout moment avant le départ**, sans restriction de délai.
- Le retrait est **total** : le passager quitte l'aller et le retour (tout ou rien).
- **Aucune notification par e-mail** n'est envoyée au conducteur lors du retrait d'un passager.

#### 4.4.4. Suggestion intelligente
- Lors de la création d'un nouveau trajet, le système doit **suggérer à l'utilisateur de rejoindre un trajet déjà existant** s'il correspond à ses critères (date, lieu, destination proche), de manière non bloquante.

### 4.5. Agendas et Suivi
- **Calendrier par véhicule :** Consultation de l'agenda spécifique d'une voiture avec vue sur les créneaux occupés et libres.
- **Détails d'un trajet :** Fiche récapitulative affichant le conducteur, les passagers actuels, les horaires, les lieux, le véhicule, le nombre de places restantes, les commentaires, et un bouton pour rejoindre le trajet.

### 4.6. Notifications (E-mails)
Système de communication automatisé, limité aux scénarios suivants :

| # | Événement déclencheur | Destinataire(s) |
|---|----------------------|-----------------|
| 1 | Trajet créé avec succès | Conducteur (confirmation) |
| 2 | Trajet supprimé par un administrateur (trajet ayant des passagers) | Conducteur + Tous les passagers |

### 4.7. Historique et Audit

#### 4.7.1. Historique des trajets
- Tous les trajets passés sont **conservés** (pas de suppression des données historiques).
- L'historique est consultable pour des besoins de statistiques et de suivi d'utilisation de la flotte.

#### 4.7.2. Journal d'audit (Admin uniquement)
- Traçabilité des actions critiques : modifications de trajets, suppressions, suppressions forcées par admin.
- Le journal d'audit est **visible uniquement par les administrateurs** depuis le panneau Admin.

### 4.8. Panneau Administrateur (Panel Admin)
Interface avec accès restreint pour la gestion systémique.
- Modification des données : ajout, édition et suppression de trajets et de fiches véhicules.
- **Gestion de la maintenance :** Possibilité de forcer l'indisponibilité d'un véhicule (ex : amené au garage), bloquant toutes les réservations pour ce véhicule.
- **Gestion de la liste blanche :** Ajout/suppression de services autorisés à accéder à l'application.
- **Gestion des administrateurs :** Promotion/révocation du rôle admin via sélection d'adresses e-mail.
- **Consultation de l'historique d'audit.**
- **Configuration du buffer :** Paramétrage de la durée du temps de battement entre deux réservations (valeur par défaut : 30 minutes).

## 5. Règles Métier Incontournables (Logique Core)

L'intelligence de l'application repose sur la stricte application de ces règles spatio-temporelles :

### 5.1. Règles sur les véhicules
- **Règle de non-chevauchement :** Un véhicule ne peut avoir qu'une seule réservation active sur un créneau horaire donné.
- **Règle de cohérence géographique :** Un véhicule ne peut être réservé que s'il est physiquement présent au lieu de départ souhaité à l'heure prévue.
- **Buffer de sécurité :** Un temps de battement configurable (par défaut 30 minutes) est automatiquement ajouté après chaque trajet. Le véhicule est considéré comme indisponible pendant ce buffer.
- **Gestion des trajets "Aller Simple" :** Le véhicule devient disponible au campus d'arrivée à la fin du trajet + buffer.
- **Gestion des trajets "Aller-Retour" :** Le véhicule est entièrement bloqué (indisponible pour d'autres) entre le départ de l'aller et l'arrivée du retour + buffer.
- **Gestion du statut "Autre" :** Un trajet vers "Autre" est obligatoirement un aller-retour. Le véhicule est bloqué pour toute la durée.
- **Règle d'Indisponibilité :** Un véhicule déclaré en statut "Maintenance/Garage" est exclu des véhicules disponibles à la réservation.

### 5.2. Règles sur les personnes
- **Unicité par trajet :** Un utilisateur ne peut être inscrit qu'une seule fois sur un même trajet (le conducteur ne peut pas être passager de son propre trajet).
- **Non-chevauchement conducteur :** Un conducteur ne peut pas avoir deux trajets qui se chevauchent dans le temps.
- **Non-chevauchement passager :** Un passager ne peut pas être inscrit sur deux trajets qui se chevauchent dans le temps.

### 5.3. Règles de capacité
- **Places passagers :** Maximum 4 passagers par trajet, en plus du conducteur (5 personnes max par véhicule).

## 6. Fenêtre de Réservation
- **Pas de profondeur maximale :** Un utilisateur peut réserver un véhicule aussi loin que nécessaire dans le futur (aucune limite temporelle).
- **Pas de délai minimum :** Réservation "à la volée" autorisée si le véhicule est disponible.
- **Pas de récurrence :** Chaque trajet est créé individuellement. Pas de mécanisme de réservation récurrente automatique.

## 7. Exigences Non Fonctionnelles et UX
- **Simplicité et Lisibilité :** L'interface doit privilégier une compréhension immédiate (utilisation de codes couleurs clairs pour les statuts).
- **Accessibilité :** L'application doit être "responsive" (utilisable sur ordinateur et mobile).
- **Messages d'erreurs clairs :** L'utilisateur doit comprendre pourquoi une action est refusée (ex : "Le véhicule ne sera pas à Paris à cette heure-ci").

## 8. Stack Technique et Déploiement
- **Framework :** Next.js en TypeScript (App Router).
- **Hébergement :** Vercel.
- **Base de données :** SharePoint Entreprise (Listes SharePoint via Microsoft Graph API) — intégration dans l'écosystème Microsoft de l'entreprise.
- **Authentification :** Microsoft Entra ID (Azure AD) via MSAL.
- **API Cartographique :** Solution gratuite et qualitative pour l'autocomplétion d'adresses et le calcul de temps de trajet. Si aucune solution gratuite ne répond au niveau de qualité requis, la fonctionnalité est dégradée en saisie manuelle.