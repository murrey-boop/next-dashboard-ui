import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const terms = await prisma.academicTerm.findMany({
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    return NextResponse.json(terms);
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json(
      { error: "Failed to fetch terms" },
      { status: 500 }
    );
  }
}
