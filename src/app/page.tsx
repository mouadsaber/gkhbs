import { Catalog } from "@/components/catalog/Catalog";
import { Suspense } from "react";
import { getHomepageCover, getProducts } from "@/lib/shopProducts";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Suspense
        fallback={<div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" />}
      >
        <CatalogLoader />
      </Suspense>
    </>
  );
}

async function CatalogLoader() {
  const products = await getProducts();
  const cover = await getHomepageCover();
  return <Catalog products={products} cover={cover} />;
}
