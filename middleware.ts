// middleware.ts — Protection des routes par authentification
// Redirige vers /login les utilisateurs non connectés.

export { default } from "next-auth/middleware";

export const config = {
  // Protéger toutes les routes sauf login, unauthorized, api/auth, et assets statiques
  matcher: [
    "/((?!login|unauthorized|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
