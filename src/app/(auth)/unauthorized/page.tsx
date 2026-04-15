// src/app/(auth)/unauthorized/page.tsx — Page "Accès refusé"

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔒</div>
          <h1>Accès refusé</h1>
          <p>Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>

        <div className="unauthorized-actions">
          <Link href="/dashboard" className="login-button">
            Retour au tableau de bord
          </Link>
          <Link href="/login" className="login-link">
            Se connecter avec un autre compte
          </Link>
        </div>
      </div>
    </div>
  );
}
