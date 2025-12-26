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

    console.log("Fetching students for classId:", classId);

    // Get all students in this class
    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: { name: "asc" },
    });

    console.log(`Found ${students.length} students for class ${classId}`);

    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      photo: student.photo,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
