import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8">
        <p className="text-sm font-semibold text-zinc-600">Introuvable</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Produit introuvable
        </h1>
        <p className="mt-3 text-zinc-600">
          Le lien est peut-être incorrect ou le produit n’est plus disponible.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}

