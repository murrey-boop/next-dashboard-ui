import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessons = await prisma.lesson.findMany({
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" },
      ],
    });

    const lessonsFormatted = lessons.map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      day: lesson.day,
      startTime: lesson.startTime.substring(0, 5), // HH:MM
      endTime: lesson.endTime.substring(0, 5), // HH:MM
      className: lesson.class.name,
      subjectName: lesson.subject.name,
      teacherName: lesson.teacher.name,
    }));

    return NextResponse.json({ lessons: lessonsFormatted });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
