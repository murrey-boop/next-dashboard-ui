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
        photo: true,
      },
    });

    // Get all exams for this class
    const exams = await prisma.exam.findMany({
      where: {
        classId,
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

    // Get all assignment submissions
    const assignments = await prisma.assignment.findMany({
      where: {
        classId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        assignmentId: { in: assignments.map((a) => a.id) },
        marks: { not: null },
      },
      include: {
        assignment: true,
      },
    });

    // Build gradebook
    const studentGrades = students.map((student) => {
      const studentResults = results.filter((r) => r.studentId === student.id);
      const studentSubmissions = submissions.filter((s) => s.studentId === student.id);

      const grades = [
        ...studentResults.map((result) => ({
          examTitle: result.exam.title,
          score: result.score,
          maxScore: 100,
          percentage: result.score,
        })),
        ...studentSubmissions.map((sub) => ({
          examTitle: sub.assignment.title,
          score: Number(sub.marks!),
          maxScore: 100,
          percentage: Number(sub.marks!),
        })),
      ];

      const average =
        grades.length > 0
          ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
          : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          admissionNo: student.admissionNo,
          photo: student.photo,
        },
        grades,
        average,
      };
    });

    return NextResponse.json({ studentGrades });
  } catch (error) {
    console.error("Error fetching gradebook:", error);
    return NextResponse.json({ error: "Failed to fetch gradebook" }, { status: 500 });
  }
}
