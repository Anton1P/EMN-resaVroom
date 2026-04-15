# Journal des Erreurs — ResaVroom

> **Objectif :** Documenter les erreurs rencontrées pendant le développement pour éviter de les reproduire lors des sessions futures.
> **Règle :** Garder ce fichier **court et synthétique**. Pas de roman, juste l'essentiel.

---

## Format à respecter

Pour chaque erreur, utiliser ce template :

```
### [PHASE X] Titre court de l'erreur
- **Catégorie :** `CODE` (bug résolvable) ou `ARCHITECTURE` (changement de choix technique)
- **Fichier(s) :** `chemin/du/fichier.ts`
- **Erreur :** Description en 1-2 lignes.
- **Tentatives :** Ce qui a été essayé (1-2 lignes max).
- **Solution :** Ce qui a fonctionné (1-2 lignes max).
```

---

## Erreurs résolues

*(Aucune erreur enregistrée pour le moment. Ce fichier sera complété au fur et à mesure du développement.)*

<!-- 
Exemple :

### [PHASE 1] Prisma migrate échoue avec Neon en serverless
- **Catégorie :** `CODE`
- **Fichier(s) :** `prisma/schema.prisma`
- **Erreur :** `Error: prepared statement already exists` lors de `prisma migrate dev`.
- **Tentatives :** Ajout de `?pgbouncer=true` dans l'URL → même erreur.
- **Solution :** Utiliser une connexion directe (non-pooled) pour les migrations : `directUrl` dans le schema Prisma.

### [PHASE 2] NextAuth provider Azure AD déprécié
- **Catégorie :** `ARCHITECTURE`
- **Fichier(s) :** `src/lib/auth.ts`
- **Erreur :** Le provider `azure-ad` n'existe plus dans next-auth v5.
- **Tentatives :** Import depuis `next-auth/providers/azure-ad` → module introuvable.
- **Solution :** Passage à Auth.js v5 avec le provider `microsoft-entra-id`. SAD mis à jour en conséquence.
-->
