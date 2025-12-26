import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher ID from user
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Fetch lessons for this teacher
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const times = [
      "8:00 - 9:00 AM",
      "9:00 - 10:00 AM",
      "10:00 - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "12:00 - 1:00 PM",
      "1:00 - 2:00 PM",
      "2:00 - 3:00 PM",
      "3:00 - 4:00 PM",
    ];

    // Convert lessons to schedule format
    const schedule = lessons.map((lesson) => {
      const startHour = parseInt(lesson.startTime.split(":")[0]);
      const endHour = parseInt(lesson.endTime.split(":")[0]);
      
      // Format time display
      const formatTime = (time: string) => {
        const [hour, min] = time.split(":");
        const h = parseInt(hour);
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayHour}:${min} ${period}`;
      };

      const timeStr = `${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}`;

      return {
        id: lesson.id,
        day: days[lesson.dayOfWeek],
        time: timeStr,
        subject: lesson.subject.name,
        class: lesson.class.name,
        room: lesson.room || undefined,
      };
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
