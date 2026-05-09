"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginClient({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<string | null>(
    configured
      ? null
      : "Ajoutez ADMIN_PASSWORD dans .env.local puis redémarrez le serveur."
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) return;
    setSetup(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        if (json.error === "admin_password_not_configured") {
          setSetup("Ajoutez ADMIN_PASSWORD dans .env.local puis redémarrez le serveur.");
          return;
        }
        setError("Mot de passe incorrect.");
        return;
      }
      router.replace(next);
    } catch {
      setError("Erreur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">
            Admin
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            Connexion par mot de passe
          </div>
        </div>

        {setup ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {setup}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-semibold text-zinc-900">
              Mot de passe
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15"
              autoFocus
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !configured}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-xs text-zinc-500">
          Exemple: <code>ADMIN_PASSWORD=GK2026secure</code> dans{" "}
          <code>.env.local</code>.
        </div>
      </div>
    </div>
  );
}
