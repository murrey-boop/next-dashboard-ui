import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = params.examId;

    const results = await prisma.result.findMany({
      where: { examId },
      include: {
        student: true,
      },
      orderBy: { student: { name: "asc" } },
    });

    const students = results.map((result) => ({
      id: result.studentId,
      name: result.student.name,
      admissionNo: result.student.admissionNo,
      marks: result.marks,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching marks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = params.examId;
    const body = await req.json();
    const { studentId, marks } = body;

    if (!studentId || marks === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get exam to fetch subjectId
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { subjectId: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update or create result
    const result = await prisma.result.upsert({
      where: {
        studentId_examId: {
          studentId,
          examId,
        },
      },
      update: { marks },
      create: {
        examId,
        studentId,
        subjectId: exam.subjectId,
        marks,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error updating marks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
