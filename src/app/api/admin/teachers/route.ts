import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        subjectsTeaching: {
          include: {
            subject: true,
          },
        },
        classesTeaching: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get class names for each teacher
    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const classIds = teacher.classesTeaching.map((ct) => ct.classId);
        const classes = await prisma.class.findMany({
          where: {
            id: {
              in: classIds,
            },
          },
          select: {
            name: true,
          },
        });

        return {
          id: teacher.id,
          name: teacher.name,
          employeeNo: teacher.employeeNo,
          email: teacher.user.email,
          phone: teacher.phone,
          photo: teacher.photo,
          subjects: teacher.subjectsTeaching.map((st) => st.subject.name),
          classes: classes.map((c) => c.name),
        };
      })
    );

    return NextResponse.json({ teachers: teachersWithDetails });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
