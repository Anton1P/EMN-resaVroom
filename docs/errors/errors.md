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

### [PHASE 1] Prisma 7 — schema.prisma ne supporte plus `url` / `directUrl`
- **Catégorie :** `ARCHITECTURE`
- **Fichier(s) :** `prisma/schema.prisma`, `prisma.config.ts`
- **Erreur :** Prisma 7.7.0 installé automatiquement. Les propriétés `url` et `directUrl` dans le bloc `datasource` sont supprimées → `P1012`.
- **Tentatives :** Utiliser l'ancien format `url = env("DATABASE_URL")` dans schema.prisma → erreur de validation.
- **Solution :** Créer `prisma.config.ts` à la racine avec `defineConfig({ datasource: { url: env("DATABASE_URL") } })`. Changer le provider en `"prisma-client"` avec `output` obligatoire. Utiliser `PrismaNeon` adapter (PoolConfig, pas Pool) dans le client. Ajouter `"type": "module"` dans package.json.

### [PHASE 1] Port 5432 bloqué par le firewall entreprise
- **Catégorie :** `ARCHITECTURE`
- **Fichier(s) :** `src/lib/prisma.ts`, `prisma/seed.ts`
- **Erreur :** `P1001: Can't reach database server` — le port 5432 (TCP PostgreSQL) est bloqué par le réseau d'entreprise.
- **Tentatives :** URL pooler et directe → les deux échouent sur le port 5432.
- **Solution :** Utiliser le **Neon Serverless Driver** (`@prisma/adapter-neon` + `@neondatabase/serverless` + `ws`) qui passe par **WebSocket port 443**. Migrations via hotspot mobile (1 seule fois), runtime via WebSocket.

### [PHASE 1] PrismaNeon v7 — API changée (PoolConfig au lieu de Pool)
- **Catégorie :** `CODE`
- **Fichier(s) :** `prisma/seed.ts`, `src/lib/prisma.ts`
- **Erreur :** `No database host or connection string was set` — le constructeur `PrismaNeon(pool)` ne fonctionne plus.
- **Tentatives :** Passer une instance `new Pool({ connectionString })` → même erreur.
- **Solution :** En Prisma 7, `PrismaNeon` accepte un `PoolConfig` objet : `new PrismaNeon({ connectionString })` au lieu d'une instance Pool.

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
