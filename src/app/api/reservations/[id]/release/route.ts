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
        { error: `Cannot release a reservation with status: ${reservation.status}` },
        { status: 409 }
      );
    }

    // Release: decrement reservedUnits only (stock is returned to available pool)
    const released = await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { id: reservation.stockId },
        data: { reservedUnits: { decrement: reservation.quantity } },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
        include: {
          product: { select: { id: true, name: true, price: true, imageUrl: true } },
        },
      });
    });

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: released.warehouseId },
      select: { id: true, name: true, city: true },
    });

    return NextResponse.json({
      ...released,
      warehouse,
      expiresAt: released.expiresAt.toISOString(),
      createdAt: released.createdAt.toISOString(),
      updatedAt: released.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/reservations/[id]/release error:", error);
    return errorResponse("Failed to release reservation", 500);
  }
}
