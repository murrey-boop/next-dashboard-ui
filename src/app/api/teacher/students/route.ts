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

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classesTeaching: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get all class IDs this teacher teaches
    const classIds = teacher.classesTeaching.map((tc) => tc.classId);

    // Fetch classes
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true },
    });

    // Fetch all students from these classes
    const students = await prisma.student.findMany({
      where: {
        classId: { in: classIds },
        isActive: true,
      },
      include: {
        class: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      photo: student.photo,
      className: student.class.name,
    }));

    return NextResponse.json({
      students: formattedStudents,
      classes: classes,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
