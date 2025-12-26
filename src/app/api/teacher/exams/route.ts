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

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const exams = await prisma.exam.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: {
          include: {
            students: true,
          },
        },
        results: true,
      },
      orderBy: { examDate: "desc" },
    });

    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject.name,
      class: exam.class.name,
      examDate: exam.examDate.toISOString(),
      totalMarks: exam.totalMarks,
      submittedCount: exam.results.filter((r) => r.marks !== null).length,
      totalStudents: exam.class.students.length,
    }));

    return NextResponse.json({ exams: formattedExams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, subjectId, classId, examDate, totalMarks, duration } = body;

    if (!title || !subjectId || !classId || !examDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        subjectId,
        classId,
        teacherId: teacher.id,
        examDate: new Date(examDate),
        totalMarks: totalMarks || 100,
        duration: duration || null,
      },
    });

    // Create result entries for all students in the class
    const students = await prisma.student.findMany({
      where: { classId, isActive: true },
    });

    await prisma.result.createMany({
      data: students.map((student) => ({
        examId: exam.id,
        studentId: student.id,
        subjectId: exam.subjectId,
        marks: 0, // Default to 0 instead of null for Decimal type
      })),
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
