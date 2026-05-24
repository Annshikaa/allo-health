import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const enriched = products.map((product) => ({
      ...product,
      stocks: product.stocks.map((stock) => ({
        ...stock,
        availableUnits: stock.totalUnits - stock.reservedUnits,
      })),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
