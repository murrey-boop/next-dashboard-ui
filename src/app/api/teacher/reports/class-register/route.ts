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

    const students = await prisma.student.findMany({
      where: { classId },
      orderBy: { admissionNo: "asc" },
      select: {
        id: true,
        name: true,
        admissionNo: true,
        email: true,
        phone: true,
        photo: true,
        dateOfBirth: true,
        address: true,
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching class register:", error);
    return NextResponse.json({ error: "Failed to fetch class register" }, { status: 500 });
  }
}
