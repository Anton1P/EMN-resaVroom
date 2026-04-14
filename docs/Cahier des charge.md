# Cahier des Charges Global : Application de Réservation de Véhicules Inter-Campus

## 1. Objectif Principal
Développer une application web permettant la gestion, la réservation et le covoiturage d'une flotte interne de véhicules circulant entre différents campus.

## 2. Périmètre et Entités Principales
- **La Flotte :** Gestion de 3 véhicules distincts.
- **Les Lieux :** 3 campus de référence (Le Havre, Caen, Paris) + une destination libre ("Autre").
- **Les Acteurs :** Utilisateurs internes pouvant être soit conducteurs, soit passagers. Administrateurs pour la gestion de la flotte.

## 3. Fonctionnalités Requises (Features)

### 3.1. Tableau de Bord (Dashboard)
Une vue synthétique permettant de comprendre immédiatement la situation de la flotte.
- Affichage de l'état en temps réel de chaque véhicule (Disponible, Indisponible, Complet, En déplacement "Autre", En Maintenance/Garage).
- Visualisation de la position courante de chaque véhicule.
- Indication de la disponibilité immédiate et des prochaines réservations.

### 3.2. Moteur de Réservation de Trajets
Interface permettant à un utilisateur de réserver un véhicule en tant que conducteur.
- Création de trajets selon trois modèles :
  - Aller simple (Campus à Campus).
  - Aller-retour.
  - Aller vers une destination "Autre" (avec saisie libre de l'adresse).
- **Calcul de la durée du trajet :** Estimation automatique de la durée via une API externe, avec possibilité de saisie manuelle en cas d'indisponibilité du service.
- Filtrage dynamique lors de la saisie pour ne proposer que les véhicules réellement disponibles (croisement du temps et de l'espace).
- **Zone de commentaire :** Champ texte libre réservé au conducteur lors de la réservation pour y ajouter des détails sur le trajet.
- Validation des contraintes métier en temps réel lors de la réservation.

### 3.3. Module de Covoiturage (Passagers)
Fonctionnalités permettant d'optimiser le taux d'occupation des véhicules.
- **Recherche de trajets :** Moteur de recherche avec filtres (date, campus de départ) pour trouver les trajets futurs.
- **Ajout de passagers :** Possibilité pour un utilisateur de rejoindre un trajet existant en tant que passager (jusqu'à 4 passagers maximum, en plus du conducteur).
- **Suggestion intelligente :** Lors de la création d'un nouveau trajet, le système doit suggérer à l'utilisateur de rejoindre un trajet déjà existant s'il correspond à ses critères (date, lieu, destination proche), de manière non bloquante.

### 3.4. Agendas et Suivi
- **Calendrier par véhicule :** Consultation de l'agenda spécifique d'une voiture avec vue sur les créneaux occupés et libres.
- **Détails d'un trajet :** Fiche récapitulative affichant le conducteur, les passagers actuels, les horaires, les lieux, le véhicule, le nombre de places restantes, les commentaires, et un bouton pour rejoindre le trajet.

### 3.5. Notifications (Mails)
Système de communication automatisé.
- Envoi d'un e-mail de confirmation lors de la validation d'une réservation (au conducteur).
- Envoi d'e-mails d'information lorsqu'un utilisateur rejoint un trajet (au conducteur et au passager).

### 3.6. Panneau Administrateur (Panel Admin)
Interface avec accès restreint pour la gestion systémique.
- Modification des données de la base : ajout, édition et suppression de trajets et de fiches véhicules.
- **Gestion des problèmes :** Possibilité de forcer l'indisponibilité d'un véhicule (ex: amené au garage), bloquant ainsi les réservations pour ce véhicule.

## 4. Règles Métier Incontournables (Logique Core)
L'intelligence de l'application repose sur la stricte application de ces règles spatio-temporelles :
- **Règle de non-chevauchement :** Un véhicule ne peut avoir qu'une seule réservation active sur un créneau horaire donné.
- **Règle de cohérence géographique :** Un véhicule ne peut être réservé que s'il est physiquement présent au lieu de départ souhaité à l'heure prévue.
- **Gestion des trajets "Aller Simple" :** Le véhicule devient disponible au campus d'arrivée dès la fin du trajet.
- **Gestion des trajets "Aller-Retour" :** Le véhicule est entièrement bloqué (indisponible pour d'autres) entre le départ de l'aller et l'arrivée du retour.
- **Gestion du statut "Autre" :** Si un véhicule part vers une destination "Autre", il y reste bloqué et devient indisponible pour un nouveau départ depuis un campus, jusqu'à ce qu'un trajet de retour le ramène.
- **Règle d'Indisponibilité :** Un véhicule déclaré en statut "Maintenance/Garage" est exclu des véhicules disponibles à la réservation.
- **Règles de participation :** Un utilisateur ne peut être inscrit qu'une seule fois sur un même trajet (le conducteur ne peut pas être passager).

## 5. Exigences Non Fonctionnelles, UX et Stack Technique
- **Simplicité et Lisibilité :** L'interface doit privilégier une compréhension immédiate (utilisation de codes couleurs clairs pour les statuts).
- **Accessibilité :** L'application doit être "responsive" (utilisable sur ordinateur et mobile).
- **Messages d'erreurs clairs :** L'utilisateur doit comprendre pourquoi une action est refusée (ex: "Le véhicule ne sera pas à Paris à cette heure-ci").
- **Stack Technique et Déploiement :** 
  - Développement de l'application web avec le framework **Next.js** en **TypeScript**.
  - Hébergement du projet sur la plateforme **Vercel**.
  - Stockage des données (Back-end/Base de données) sur **SharePoint Entreprise** (ex: Listes SharePoint via Microsoft Graph API) pour une intégration globale de l'écosystème entreprise.