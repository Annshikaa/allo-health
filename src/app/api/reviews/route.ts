import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { productId, reservationId, authorName, rating, reviewBody } = body;

  if (!productId || !reservationId || !authorName?.trim() || !rating || !reviewBody?.trim())
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });

  if (rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });

  if (reviewBody.trim().length < 10)
    return NextResponse.json({ error: "Review must be at least 10 characters" }, { status: 400 });

  // Verify reservation exists, is CONFIRMED, and matches the product
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation)
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  if (reservation.productId !== productId)
    return NextResponse.json({ error: "Reservation does not match this product" }, { status: 403 });
  if (reservation.status !== "CONFIRMED")
    return NextResponse.json({ error: "You can only review after confirming a reservation" }, { status: 403 });

  // One review per reservation
  const existing = await prisma.review.findUnique({ where: { reservationId } });
  if (existing)
    return NextResponse.json({ error: "You have already reviewed this reservation" }, { status: 409 });

  const review = await prisma.review.create({
    data: { productId, reservationId, authorName: authorName.trim(), rating, body: reviewBody.trim() },
  });
  return NextResponse.json(review, { status: 201 });
}
