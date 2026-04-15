// src/types/next-auth.d.ts — Extension des types NextAuth
// Ajoute les champs personnalisés à la session et au token JWT.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    entraId: string;
  }

  interface Session {
    user: {
      entraId: string;
      email: string;
      name: string;
      image?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    entraId?: string;
  }
}
