import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      include: {
        user: true,
        class: {
          select: {
            name: true,
          },
        },
        parent: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const studentsFormatted = students.map((student) => ({
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      email: student.user.email,
      phone: student.phone,
      photo: student.photo,
      className: student.class.name,
      parentName: student.parent?.user.name || "N/A",
    }));

    return NextResponse.json({ students: studentsFormatted });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
