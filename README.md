# Resavroom - Application de Réservation de Véhicules Inter-Campus ??

Resavroom est une application web complète développée avec Next.js permettant la gestion, la réservation et le covoiturage d'une flotte interne de véhicules circulant entre différents campus d'entreprise.

## ? Fonctionnalités Principales

### ?? Authentification & Sécurité
- **Connexion SSO** via Microsoft Entra ID (ex-Azure AD).
- **Contrôle d'accès par liste blanche** (Seuls les services autorisés peuvent se connecter).
- **Gestion des rôles** (Utilisateurs standards et Administrateurs).

### ?? Tableau de Bord (Dashboard)
- Vue synthétique de l'état de la flotte en temps réel (Disponible, En Trajet, Maintenance).
- Suivi de la position actuelle de chaque véhicule sur les différents campus.
- Affichage de vos prochains trajets et des covoiturages suggérés.

### ?? Réservation & Covoiturage
- **Recherche intelligente** : Trouvez un véhicule disponible ou rejoignez un trajet existant en tant que passager.
- **Types de trajets supportés** :
  - *Aller simple* (Inter-campus).
  - *Aller-retour* (Inter-campus ou prolongé).
  - *Destination Externe ("Autre")* : Obligatoirement en aller-retour avec retour sur un des campus.
- **Calculs automatiques** : Saisie d'adresses via l'API BAN (api-adresse.data.gouv.fr) et estimation automatique des temps de trajet via OpenRouteService.
- **Vérification des conflits** : Le système empêche la sur-réservation des véhicules et prévient les chevauchements pour les conducteurs.

### ?? Panneau d'Administration
- **Gestion de la flotte** : Ajout, modification, et mise en maintenance des véhicules.
- **Gestion des trajets** : Modification complète des trajets (dates, véhicules, destinations) et annulations forcées.
- **Gestion des utilisateurs & rôles** : Promotion d'utilisateurs au rang d'administrateur et gestion de la liste blanche d'accès.
- **Journal d'Audit** : Traçabilité complète des actions sensibles (connexions, annulations, promotions admin, etc.).
- **Paramètres globaux** : Configuration du temps de battement entre chaque réservation (pour le nettoyage/vérification du véhicule).

---

## ??? Stack Technique

- **Framework** : [Next.js 16.2](https://nextjs.org/) (App Router)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Base de données** : PostgreSQL (hébergée via [Neon](https://neon.tech/))
- **ORM** : [Prisma 7.7](https://www.prisma.io/)
- **Authentification** : [NextAuth.js](https://next-auth.js.org/) avec @azure/msal-node
- **UI / Composants** : CSS Modules / Variables, Lucide React (Icônes), Sonner (Toasts)

---

## ?? Installation & Lancement en local

### 1. Prérequis
- [Node.js](https://nodejs.org/en/) (v20+ recommandé)
- Un compte [Neon](https://neon.tech/) pour la base de données PostgreSQL (ou toute autre base de données PostgreSQL).
- Un compte Azure / Entra ID configuré pour le SSO.
- Une clé API [OpenRouteService](https://openrouteservice.org/).

### 2. Cloner le dépôt et installer les dépendances
`ash
git clone <votre-url-de-repo> resavroom
cd resavroom
npm install
`

### 3. Configuration des variables d'environnement
Copiez le fichier d'exemple et remplissez vos informations :
`ash
cp .env.example .env.local
`
Ouvrez .env.local et renseignez :
- DATABASE_URL (Votre chaîne de connexion Neon / PostgreSQL).
- Les identifiants Azure AD (AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID).
- NEXTAUTH_SECRET (Une chaîne longue et aléatoire).
- ORS_API_KEY (Votre clé OpenRouteService).

### 4. Initialiser la Base de données
Générez les clients Prisma, appliquez les migrations et uploadez les données de départ (les campus et données initiales) :
`ash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
`

### 5. Lancer le serveur de développement
`ash
npm run dev
`
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## ??? Scripts Utiles

- 
pm run dev : Lance le serveur en mode développement avec Hot Reload.
- 
pm run build : Compile l'application pour la production.
- 
pm run start : Lance le serveur de production (après le build).
- 
px tsc --noEmit : Vérifie les erreurs TypeScript.
- 
px prisma studio : Ouvre une interface web pour gérer le contenu de votre base de données locale.
