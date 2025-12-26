import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const studentId = formData.get("studentId") as string;
    const submissionText = formData.get("submissionText") as string;
    const file = formData.get("file") as File | null;

    if (!assignmentId || !studentId || !submissionText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify parent owns this student
    const parent = await prisma.parent.findUnique({
      where: { id: session.user.id },
      include: {
        students: {
          where: { id: studentId },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return NextResponse.json(
        { error: "Student not found or unauthorized" },
        { status: 403 }
      );
    }

    // Verify assignment exists and student is in the correct class
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const student = parent.students[0];
    if (student.classId !== assignment.classId) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" },
        { status: 403 }
      );
    }

    // Check if submission already exists
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
    });

    let fileData = null;
    if (file && file.size > 0) {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      try {
        // Convert file to buffer for storage
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Store as bytes directly (better than base64 for large files)
        fileData = buffer;
      } catch (fileError) {
        console.error("File processing error:", fileError);
        return NextResponse.json(
          { error: "Failed to process file upload" },
          { status: 400 }
        );
      }
    }

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileData: fileData || existingSubmission.fileData,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Assignment resubmitted successfully",
        submission: {
          id: updatedSubmission.id,
          submittedAt: updatedSubmission.submittedAt,
        },
      });
    } else {
      // Create new submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,
          fileData,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Assignment submitted successfully",
        submission: {
          id: submission.id,
          submittedAt: submission.submittedAt,
        },
      });
    }
  } catch (error) {
    console.error("Assignment submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
