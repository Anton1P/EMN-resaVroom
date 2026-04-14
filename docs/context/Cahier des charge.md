# Cahier des Charges Global : Application de Réservation de Véhicules Inter-Campus (MVP)

## 1. Objectif Principal
Développer une application web permettant la gestion, la réservation et le covoiturage d'une flotte interne de véhicules circulant entre différents campus.

## 2. Périmètre et Entités Principales
- **La Flotte :** Gestion de 3 véhicules distincts.
- **Les Lieux :** 3 campus de référence (Le Havre, Caen, Paris) + une destination libre ("Autre").
- **Les Acteurs :** Utilisateurs internes pouvant être soit conducteurs, soit passagers.

## 3. Fonctionnalités Requises (Features)

### 3.1. Tableau de Bord (Dashboard)
Une vue synthétique permettant de comprendre immédiatement la situation de la flotte.
- Affichage de l'état en temps réel de chaque véhicule (Disponible, Indisponible, Complet, En déplacement "Autre").
- Visualisation de la position courante de chaque véhicule.
- Indication de la disponibilité immédiate et des prochaines réservations.

### 3.2. Moteur de Réservation de Trajets
Interface permettant à un utilisateur de réserver un véhicule en tant que conducteur.
- Création de trajets selon trois modèles :
  - Aller simple (Campus à Campus).
  - Aller-retour.
  - Aller vers une destination "Autre" (avec saisie libre de l'adresse).
- Filtrage dynamique lors de la saisie pour ne proposer que les véhicules réellement disponibles (croisement du temps et de l'espace).
- Validation des contraintes métier en temps réel lors de la réservation.

### 3.3. Module de Covoiturage (Passagers)
Fonctionnalités permettant d'optimiser le taux d'occupation des véhicules.
- **Recherche de trajets :** Moteur de recherche avec filtres (date, campus de départ) pour trouver les trajets futurs.
- **Ajout de passagers :** Possibilité pour un utilisateur de rejoindre un trajet existant en tant que passager (jusqu'à 4 passagers maximum, en plus du conducteur).
- **Suggestion intelligente :** Lors de la création d'un nouveau trajet, le système doit suggérer à l'utilisateur de rejoindre un trajet déjà existant s'il correspond à ses critères (date, lieu, destination proche), de manière non bloquante.

### 3.4. Agendas et Suivi
- **Calendrier par véhicule :** Consultation de l'agenda spécifique d'une voiture avec vue sur les créneaux occupés et libres.
- **Détails d'un trajet :** Fiche récapitulative affichant le conducteur, les passagers actuels, les horaires, les lieux, le véhicule, le nombre de places restantes et un bouton pour rejoindre le trajet.

## 4. Règles Métier Incontournables (Logique Core)
L'intelligence de l'application repose sur la stricte application de ces règles spatio-temporelles :
- **Règle de non-chevauchement :** Un véhicule ne peut avoir qu'une seule réservation active sur un créneau horaire donné.
- **Règle de cohérence géographique :** Un véhicule ne peut être réservé que s'il est physiquement présent au lieu de départ souhaité à l'heure prévue.
- **Gestion des trajets "Aller Simple" :** Le véhicule devient disponible au campus d'arrivée dès la fin du trajet.
- **Gestion des trajets "Aller-Retour" :** Le véhicule est entièrement bloqué (indisponible pour d'autres) entre le départ de l'aller et l'arrivée du retour.
- **Gestion du statut "Autre" :** Si un véhicule part vers une destination "Autre", il y reste bloqué et devient indisponible pour un nouveau départ depuis un campus, jusqu'à ce qu'un trajet de retour le ramène.
- **Règles de participation :** Un utilisateur ne peut être inscrit qu'une seule fois sur un même trajet (le conducteur ne peut pas être passager).

## 5. Exigences Non Fonctionnelles et UX
- **Simplicité et Lisibilité :** L'interface doit privilégier une compréhension immédiate (utilisation de codes couleurs clairs pour les statuts).
- **Accessibilité :** L'application doit être "responsive" (utilisable sur ordinateur et mobile).
- **Messages d'erreurs clairs :** L'utilisateur doit comprendre pourquoi une action est refusée (ex: "Le véhicule ne sera pas à Paris à cette heure-ci").
- **Fonctionnement "Stand-alone" (Contrainte MVP) :** L'application doit pouvoir fonctionner, stocker et persister ses données localement, sans nécessiter la connexion à un serveur de base de données externe lourd pour cette première version.