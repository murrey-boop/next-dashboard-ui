import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Fetch all assignments created by teacher
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record from userId
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        class: true,
        submissions: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAssignments = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      subject: a.subject.name,
      class: a.class.name,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      createdAt: a.createdAt,
      totalSubmissions: a.submissions.length,
      gradedSubmissions: a.submissions.filter((s) => s.marks !== null).length,
      pendingGrading: a.submissions.filter((s) => s.marks === null).length,
    }));

    return NextResponse.json({ assignments: formattedAssignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher record from userId
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, subjectId, classId, dueDate, totalMarks, attachmentData, attachmentName } = body;

    if (!title || !description || !subjectId || !classId || !dueDate || !totalMarks) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        subjectId,
        classId,
        teacherId: teacher.id,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks),
        attachmentData: attachmentData || null,
        attachmentName: attachmentName || null,
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
