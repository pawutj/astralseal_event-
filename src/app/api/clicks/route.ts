import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const counter = await db.counter.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", clicks: 0 },
  });
  return NextResponse.json({ clicks: counter.clicks });
}

export async function POST(req: Request) {
  const { amount = 1 } = await req.json();
  const counter = await db.counter.update({
    where: { id: "global" },
    data: { clicks: { increment: amount } },
  });
  return NextResponse.json({ clicks: counter.clicks });
}
