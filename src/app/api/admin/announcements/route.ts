import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      include: {
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAnnouncements = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      targetRole: a.targetRole,
      className: a.class?.name || null,
      priority: a.priority,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, targetRole, classId, priority } = body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetRole: targetRole || null,
        classId: classId || null,
        priority: priority || "NORMAL",
        publishedBy: session.user.id,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
