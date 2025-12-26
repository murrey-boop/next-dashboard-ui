import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        admissionNo: true,
      },
    });

    // Get all exams for this class
    const exams = await prisma.exam.findMany({
      where: {
        lesson: {
          classId,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Get all results
    const results = await prisma.result.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        examId: { in: exams.map((e) => e.id) },
      },
      include: {
        exam: true,
      },
    });

    // Build performance data
    const performance = students.map((student) => {
      const studentResults = results.filter((r) => r.studentId === student.id);

      const examScores = exams.map((exam) => {
        const result = studentResults.find((r) => r.examId === exam.id);
        return {
          title: exam.title,
          score: result?.score || 0,
        };
      });

      const average =
        examScores.length > 0
          ? examScores.reduce((sum, e) => sum + e.score, 0) / examScores.length
          : 0;

      return {
        studentName: student.name,
        admissionNo: student.admissionNo,
        exams: examScores,
        average,
      };
    });

    return NextResponse.json({ performance });
  } catch (error) {
    console.error("Error fetching performance report:", error);
    return NextResponse.json({ error: "Failed to fetch performance report" }, { status: 500 });
  }
}
