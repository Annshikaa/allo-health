import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, price: true, imageUrl: true, description: true } },
      },
    });

    if (!reservation) {
      return errorResponse("Reservation not found", 404);
    }

    // Lazy expiry: if PENDING and past expiresAt, release it now
    if (reservation.status === "PENDING" && reservation.expiresAt < new Date()) {
      await prisma.$transaction(async (tx) => {
        await tx.stock.update({
          where: { id: reservation.stockId },
          data: { reservedUnits: { decrement: reservation.quantity } },
        });
        await tx.reservation.update({
          where: { id },
          data: { status: "RELEASED" },
        });
      });

      return NextResponse.json({
        ...reservation,
        status: "RELEASED",
        warehouse: await getWarehouse(reservation.warehouseId),
        expiresAt: reservation.expiresAt.toISOString(),
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const warehouse = await getWarehouse(reservation.warehouseId);

    return NextResponse.json({
      ...reservation,
      warehouse,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/reservations/[id] error:", error);
    return errorResponse("Failed to fetch reservation", 500);
  }
}

async function getWarehouse(warehouseId: string) {
  return prisma.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true, name: true, city: true },
  });
}
