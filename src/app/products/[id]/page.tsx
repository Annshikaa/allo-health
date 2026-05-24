import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductDetail from "./ProductDetail";

export const dynamic = "force-dynamic";

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stocks: {
        include: { warehouse: true },
        orderBy: { warehouse: { city: "asc" } },
      },
    },
  });
  if (!product) return null;
  return {
    ...product,
    stocks: product.stocks.map((s) => ({
      ...s,
      availableUnits: s.totalUnits - s.reservedUnits,
    })),
  };
}

async function getRelated(category: string, excludeId: string) {
  const products = await prisma.product.findMany({
    where: { category, id: { not: excludeId } },
    include: {
      stocks: {
        include: { warehouse: true },
        orderBy: { warehouse: { city: "asc" } },
      },
    },
    take: 3,
  });
  return products.map((p) => ({
    ...p,
    stocks: p.stocks.map((s) => ({
      ...s,
      availableUnits: s.totalUnits - s.reservedUnits,
    })),
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const related = await getRelated(product.category, id);
  return <ProductDetail product={product} related={related} />;
}
