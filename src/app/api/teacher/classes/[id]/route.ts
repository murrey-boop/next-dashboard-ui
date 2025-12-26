import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classId = params.id;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          where: { isActive: true },
          include: {
            results: {
              include: {
                exam: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Calculate average performance for each student
    const studentsWithPerformance = classData.students.map((student) => {
      const resultsWithMarks = student.results.filter((r) => r.marks !== null);
      const averageMarks =
        resultsWithMarks.length > 0
          ? resultsWithMarks.reduce((sum, r) => {
              const marks = Number(r.marks ?? 0);
              const totalMarks = Number(r.exam.totalMarks ?? 1);
              const percentage = (marks / totalMarks) * 100;
              return sum + percentage;
            }, 0) / resultsWithMarks.length
          : null;

      return {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        photo: student.photo,
        averageMarks,
      };
    });

    // Calculate class average
    const studentsWithMarks = studentsWithPerformance.filter((s) => s.averageMarks !== null);
    const classAverage =
      studentsWithMarks.length > 0
        ? studentsWithMarks.reduce((sum, s) => sum + (s.averageMarks || 0), 0) /
          studentsWithMarks.length
        : 0;

    const classDetail = {
      id: classData.id,
      name: classData.name,
      gradeLevel: classData.gradeLevel,
      capacity: classData.capacity,
      studentCount: classData.students.length,
      averagePerformance: classAverage,
    };

    return NextResponse.json({
      class: classDetail,
      students: studentsWithPerformance,
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
