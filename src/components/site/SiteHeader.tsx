import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-[120px] sm:h-10 sm:w-[135px]">
            <Image
              src="/brand/gkh-logo.png"
              alt="GKH"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="sr-only">Accueil</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Catalogue
          </Link>
        </div>
      </div>
    </header>
  );
}
