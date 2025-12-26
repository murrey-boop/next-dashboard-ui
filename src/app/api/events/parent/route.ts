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

    // Fetch events for PARENT role
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { targetRoles: { has: "PARENT" } },
          { targetRoles: { isEmpty: true } },
        ],
      },
      orderBy: {
        eventDate: "asc",
      },
    });

    // Separate upcoming and past events
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.eventDate) >= now);
    const pastEvents = events.filter(e => new Date(e.eventDate) < now);

    return NextResponse.json({
      upcoming: upcomingEvents,
      past: pastEvents,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
