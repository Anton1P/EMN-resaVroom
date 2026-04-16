// src/app/(auth)/login/page.tsx — Page de connexion
"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("admin@entreprise.fr");
  const [password, setPassword] = useState("dev");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("dev-credentials", {
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
  };

  return (
    <>
      {/* Message d'erreur */}
      {error && (
        <div className="login-error">
          {error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : "Une erreur est survenue lors de la connexion."}
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <select
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
            <option value="admin@entreprise.fr">
              👑 Admin Dev (admin@entreprise.fr)
            </option>
            <option value="jean.dupont@entreprise.fr">
              👤 Jean Dupont (jean.dupont@entreprise.fr)
            </option>
            <option value="marie.martin@entreprise.fr">
              👤 Marie Martin (marie.martin@entreprise.fr)
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="dev"
          />
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo / Titre */}
        <div className="login-header">
          <div className="login-logo">🚗</div>
          <h1>ResaVroom</h1>
          <p>Réservation de véhicules inter-campus</p>
        </div>

        {/* Bandeau dev */}
        <div className="login-dev-banner">
          <span>🛠️</span>
          <div>
            <strong>Mode développement</strong>
            <p>Connexion simulée — mot de passe : <code>dev</code></p>
          </div>
        </div>

        <Suspense fallback={<div>Chargement...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
