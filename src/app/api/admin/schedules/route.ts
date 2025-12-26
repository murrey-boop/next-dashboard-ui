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

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { teacherId },
      include: {
        subject: true,
        class: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const schedules = lessons.map((lesson) => ({
      id: lesson.id,
      teacherId: lesson.teacherId,
      subjectId: lesson.subjectId,
      classId: lesson.classId,
      day: days[lesson.dayOfWeek],
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      room: lesson.room,
    }));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
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
    const { teacherId, subjectId, classId, day, startTime, endTime, room } = body;

    if (!teacherId || !subjectId || !classId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = days.indexOf(day);

    if (dayOfWeek === -1) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        teacherId,
        subjectId,
        classId,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
