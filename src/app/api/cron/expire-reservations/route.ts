import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
    });

    if (expiredReservations.length === 0) {
      return NextResponse.json({ released: 0, message: "No expired reservations" });
    }

    // Batch release with Promise.allSettled so one failure doesn't block others
    const results = await Promise.allSettled(
      expiredReservations.map((reservation) =>
        prisma.$transaction(async (tx) => {
          await tx.stock.update({
            where: { id: reservation.stockId },
            data: { reservedUnits: { decrement: reservation.quantity } },
          });
          return tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "RELEASED" },
          });
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Cron: released ${succeeded} expired reservations, ${failed} failed`);

    return NextResponse.json({
      released: succeeded,
      failed,
      total: expiredReservations.length,
    });
  } catch (error) {
    console.error("Cron expire-reservations error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
