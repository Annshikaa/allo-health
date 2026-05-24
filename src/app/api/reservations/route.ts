import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis, keys, IDEMPOTENCY_TTL } from "@/lib/redis";
import { CreateReservationSchema } from "@/lib/schemas";
import { getExpiresAt, errorResponse } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateReservationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { productId, warehouseId, quantity } = parsed.data;

    // Idempotency: check if this exact request was already processed
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (idempotencyKey) {
      const cached = await redis.get(keys.idempotency(idempotencyKey));
      if (cached) {
        return NextResponse.json(cached, { status: 200 });
      }
    }

    // SELECT FOR UPDATE inside a transaction guarantees exactly one winner
    // when two concurrent requests race for the last available unit.
    // Postgres acquires a row-level exclusive lock on the Stock row;
    // the second transaction blocks until the first commits, then re-reads
    // the updated reservedUnits — so it can never double-book the same unit.
    const reservation = await prisma.$transaction(async (tx) => {
      const stocks = await tx.$queryRaw<
        { id: string; totalUnits: number; reservedUnits: number }[]
      >`
        SELECT id, "totalUnits", "reservedUnits"
        FROM "Stock"
        WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        FOR UPDATE
      `;

      if (!stocks.length) {
        throw new Error("STOCK_NOT_FOUND");
      }

      const stock = stocks[0];
      const available = stock.totalUnits - stock.reservedUnits;

      if (available < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // Atomically increment reservedUnits
      await tx.stock.update({
        where: { id: stock.id },
        data: { reservedUnits: { increment: quantity } },
      });

      const newReservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          stockId: stock.id,
          quantity,
          expiresAt: getExpiresAt(),
          idempotencyKey: idempotencyKey ?? `auto-${Date.now()}-${Math.random()}`,
        },
        include: {
          product: { select: { id: true, name: true, price: true, imageUrl: true } },
        },
      });

      return newReservation;
    });

    // Fetch warehouse info for response
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true, city: true },
    });

    const response = {
      ...reservation,
      warehouse,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

    // Cache for idempotency
    if (idempotencyKey) {
      await redis.set(keys.idempotency(idempotencyKey), response, { ex: IDEMPOTENCY_TTL });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_STOCK") {
        return errorResponse("Insufficient stock available", 409);
      }
      if (error.message === "STOCK_NOT_FOUND") {
        return errorResponse("Stock not found for this product/warehouse combination", 404);
      }
    }
    console.error("POST /api/reservations error:", error);
    return errorResponse("Failed to create reservation", 500);
  }
}
