/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth.ts — Configuration NextAuth + helpers d'authentification
// ⚠️ PROVIDER DE DÉVELOPPEMENT TEMPORAIRE : CredentialsProvider
// À remplacer par AzureADProvider quand les credentials Entra ID seront disponibles.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { prisma } from "./prisma";

// ══════════════════════════════════════════════
// UTILISATEURS DE DÉVELOPPEMENT (simulés)
// ══════════════════════════════════════════════

const DEV_USERS = [
  {
    id: "dev-admin-001",
    entraId: "TO_BE_CONFIGURED", // Correspond à l'admin initial en base
    email: "admin@entreprise.fr",
    name: "Admin Dev",
  },
  {
    id: "dev-user-001",
    entraId: "dev-user-entra-001",
    email: "jean.dupont@entreprise.fr",
    name: "Jean Dupont",
  },
  {
    id: "dev-user-002",
    entraId: "dev-user-entra-002",
    email: "marie.martin@entreprise.fr",
    name: "Marie Martin",
  },
];

// ══════════════════════════════════════════════
// CONFIGURATION NEXTAUTH
// ══════════════════════════════════════════════

export const authOptions: NextAuthOptions = {
  providers: [
    // ── PROVIDER TEMPORAIRE POUR LE DÉVELOPPEMENT ──
    // Permet de se connecter avec un email parmi les utilisateurs simulés.
    // Mot de passe : "dev" pour tous les comptes.
    // ⚠️ À SUPPRIMER avant la mise en production.
    CredentialsProvider({
      id: "dev-credentials",
      name: "Compte de développement",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@entreprise.fr" },
        password: { label: "Mot de passe", type: "password", placeholder: "dev" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password !== "dev") return null;

        const user = DEV_USERS.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!user) return null;

        return {
          id: user.id,
          entraId: user.entraId,
          email: user.email,
          name: user.name,
        };
      },
    }),

    // ── PROVIDER ENTRA ID (À ACTIVER QUAND LES CREDENTIALS SERONT DISPONIBLES) ──
    // AzureADProvider({
    //   clientId: process.env.AZURE_AD_CLIENT_ID!,
    //   clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    //   tenantId: process.env.AZURE_AD_TENANT_ID!,
    //   authorization: {
    //     params: {
    //       scope: "openid profile email User.ReadBasic.All",
    //     },
    //   },
    // }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Lors de la première connexion, ajouter les infos utilisateur au token
      if (user) {
        const entraId = (user as { entraId: string }).entraId;
        token.entraId = entraId;
        token.email = user.email;
        token.name = user.name;
        
        // Vérifier le statut administrateur à la connexion
        // La fonction isAdmin est définie plus bas dans ce fichier
        const admin = await prisma.admin.findUnique({
          where: { userEntraId: entraId },
        });
        token.isAdmin = admin !== null;
      }
      return token;
    },
    async session({ session, token }) {
      // Exposer l'entraId et le statut admin dans la session côté client
      if (session.user) {
        (session.user as any).entraId = token.entraId as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

/**
 * Récupère la session côté serveur (App Router).
 * À utiliser dans les Server Components et les API Routes.
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Vérifie si un utilisateur est admin.
 * Recherche dans la table `admins` par userEntraId.
 */
export async function isAdmin(entraId: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { userEntraId: entraId },
  });
  return admin !== null;
}

/**
 * Récupère la session et vérifie que l'utilisateur est authentifié.
 * Retourne la session ou null.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return null;
  return session;
}

/**
 * Récupère la session et vérifie que l'utilisateur est admin.
 * Retourne la session ou null.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return null;

  const userEntraId = (session.user as { entraId: string }).entraId;
  if (!(await isAdmin(userEntraId))) return null;

  return session;
}
