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

    const assignmentId = params.id;

    // Get submissions for this assignment
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const formattedSubmissions = submissions.map((sub) => ({
      id: sub.id,
      studentName: sub.student.name,
      studentId: sub.studentId,
      submittedAt: sub.submittedAt,
      marks: sub.marks,
      feedback: sub.feedback,
      fileData: sub.fileData,
    }));

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
