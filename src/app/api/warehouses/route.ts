import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { city: "asc" },
      include: {
        stocks: {
          include: { product: true },
          orderBy: { product: { category: "asc" } },
        },
      },
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("GET /api/warehouses error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}
