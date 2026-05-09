import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-zinc-600 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center">
            <div className="relative h-10 w-[135px]">
              <Image
                src="/brand/gkh-logo.png"
                alt="GKH"
                fill
                className="object-contain object-left"
                sizes="135px"
              />
            </div>
          </Link>
          <div>Commandes par email • contact@gkhbs.com</div>
        </div>
      </div>
    </footer>
  );
}
