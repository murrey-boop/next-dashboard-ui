import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.update({
      where: { id: params.id },
      data: {
        name,
        code: code || null,
      },
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    console.error("Error updating subject:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Subject with this name or code already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if subject is being used by any teacher
    const teacherSubjects = await prisma.teacherSubject.findFirst({
      where: { subjectId: params.id },
    });

    if (teacherSubjects) {
      return NextResponse.json(
        { error: "Cannot delete subject that is assigned to teachers" },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting subject:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
