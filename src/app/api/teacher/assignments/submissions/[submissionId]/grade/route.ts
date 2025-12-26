import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissionId = params.submissionId;
    const body = await req.json();
    const { marks, feedback } = body;

    if (marks === undefined || marks === null) {
      return NextResponse.json(
        { error: "Marks are required" },
        { status: 400 }
      );
    }

    // Update the submission
    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks: parseInt(marks),
        feedback: feedback || null,
      },
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
