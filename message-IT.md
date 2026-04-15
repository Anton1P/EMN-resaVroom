# Demande Service IT — App Registration Azure AD

**Objet : Demande de création d'une App Registration Azure AD — Application interne ResaVroom**

---

Bonjour,

Je développe une application web interne de réservation de véhicules pour les déplacements inter-campus (Le Havre, Caen, Paris). L'application sera hébergée sur **Vercel** et nécessite une intégration avec notre écosystème Microsoft pour l'authentification et l'envoi de mails.

J'aurais besoin de votre aide pour configurer les éléments suivants :

---

## 1. Création d'une App Registration dans Azure Entra ID

- **Nom de l'application :** ResaVroom (ou le nom de votre choix)
- **Type :** Application web
- **Redirect URIs à configurer :**
  - `http://localhost:3000/api/auth/callback/azure-ad` *(environnement de développement)*
  - `https://<nom-du-projet>.vercel.app/api/auth/callback/azure-ad` *(environnement de production — je vous communiquerai l'URL exacte dès qu'elle sera connue)*

## 2. Permissions Microsoft Graph API à accorder

| Permission | Type | Consentement admin requis | Usage |
|------------|------|:-------------------------:|-------|
| `User.Read` | Déléguée | Non | Lecture du profil de l'utilisateur connecté (nom, prénom, email) |
| `User.ReadBasic.All` | Déléguée | Non | Recherche d'utilisateurs dans l'annuaire (pour l'ajout de passagers sur un trajet) |
| `Mail.Send` | Application | **Oui** | Envoi d'e-mails de notification depuis une boîte partagée |

La permission `Mail.Send` nécessite un **consentement administrateur** sur l'App Registration.

## 3. Boîte mail expéditrice

L'application enverra des e-mails de notification (confirmation de réservation, annulation de trajet) depuis une boîte partagée existante. Pourriez-vous confirmer que la boîte **[INSÉRER L'ADRESSE DE LA BOÎTE PARTAGÉE]** peut être utilisée comme expéditeur via l'API Graph ?

## 4. Informations à me fournir

Une fois l'App Registration créée, j'aurai besoin des éléments suivants :
- **Application (client) ID**
- **Directory (tenant) ID**
- **Client Secret** (à générer dans la section "Certificates & secrets")

---

## Contexte sur les données

L'application ne stocke **aucune donnée personnelle sensible** dans sa base de données externe. Seuls des identifiants techniques (Object IDs Azure AD) et des données métier (trajets, horaires, véhicules) y sont enregistrés. Les noms et adresses e-mail sont récupérés dynamiquement depuis Azure AD au moment de la connexion.

---

Je reste disponible pour en discuter ou pour un échange rapide si vous avez des questions.

Merci par avance pour votre aide,
**[VOTRE NOM]**
