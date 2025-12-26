import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all teachers with their subjects and classes
    const teachers = await prisma.teacher.findMany({
      include: {
        subjectsTeaching: {
          include: {
            subject: true,
          },
        },
        classesTeaching: true,
      },
    });

    // Clear existing schedules
    await prisma.lesson.deleteMany({});

    // Generate schedules for all teachers
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const times = [
      { start: "08:00", end: "09:00" },
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "13:00", end: "14:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
    ];

    let scheduleCount = 0;

    for (const teacher of teachers) {
      const subjects = teacher.subjectsTeaching;
      const classIds = teacher.classesTeaching.map((tc) => tc.classId);

      // Get actual class records
      const classes = await prisma.class.findMany({
        where: { id: { in: classIds } },
      });

      let lessonIndex = 0;

      // Create a reasonable schedule for each teacher
      for (let i = 0; i < subjects.length && i < 5; i++) {
        const subject = subjects[i];
        const classObj = classes[i % classes.length];

        if (!classObj) continue;

        const day = days[lessonIndex % days.length];
        const dayIndex = days.indexOf(day) + 1; // Monday = 1
        const timeSlot = times[Math.floor(lessonIndex / days.length) % times.length];

        await prisma.lesson.create({
          data: {
            teacherId: teacher.id,
            subjectId: subject.subjectId,
            classId: classObj.id,
            dayOfWeek: dayIndex,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            room: `Room ${100 + lessonIndex}`,
          },
        });

        scheduleCount++;
        lessonIndex++;
      }
    }

    return NextResponse.json({
      message: `Generated ${scheduleCount} schedule entries for ${teachers.length} teachers`,
      count: scheduleCount,
    });
  } catch (error) {
    console.error("Error generating bulk schedules:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
