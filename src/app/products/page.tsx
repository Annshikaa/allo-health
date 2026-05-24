import { prisma } from "@/lib/db";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      stocks: {
        include: { warehouse: true },
        orderBy: { warehouse: { city: "asc" } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return products.map((p) => ({
    ...p,
    stocks: p.stocks.map((s) => ({
      ...s,
      availableUnits: s.totalUnits - s.reservedUnits,
    })),
  }));
}

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return <ProductsClient initialProducts={products} error={error} />;
}
