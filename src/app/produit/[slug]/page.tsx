import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/shopProducts";
import { ProductPage } from "@/components/product/ProductPage";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const all = await getProducts();
  const similarProducts = all.filter((p) => p.id !== product.id).slice(0, 4);
  const autoOpenOrder = query.order === "1" || query.order === "true";
  return (
    <ProductPage
      product={product}
      similarProducts={similarProducts}
      autoOpenOrder={autoOpenOrder}
    />
  );
}
