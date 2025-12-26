import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch announcements for PARENT role
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetRoles: { has: "PARENT" } },
          { targetRoles: { isEmpty: true } }, // If no roles specified, show to everyone
        ],
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 50, // Limit to 50 most recent announcements
    });

    return NextResponse.json({
      announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
