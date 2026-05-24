import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return errorResponse("Reservation not found", 404);
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot confirm a reservation with status: ${reservation.status}` },
        { status: 409 }
      );
    }

    if (reservation.expiresAt < new Date()) {
      // Release the stock and mark expired before returning 410
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
      return errorResponse("Reservation has expired", 410);
    }

    // Confirm: decrement both totalUnits and reservedUnits (stock is permanently consumed)
    const confirmed = await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { id: reservation.stockId },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: {
          product: { select: { id: true, name: true, price: true, imageUrl: true } },
        },
      });
    });

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: confirmed.warehouseId },
      select: { id: true, name: true, city: true },
    });

    return NextResponse.json({
      ...confirmed,
      warehouse,
      expiresAt: confirmed.expiresAt.toISOString(),
      createdAt: confirmed.createdAt.toISOString(),
      updatedAt: confirmed.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/reservations/[id]/confirm error:", error);
    return errorResponse("Failed to confirm reservation", 500);
  }
}
