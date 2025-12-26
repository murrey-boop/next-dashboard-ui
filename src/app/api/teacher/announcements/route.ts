import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      console.log("Auth failed:", { session: !!session, role: session?.user?.role });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher's classes
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { 
        classesTeaching: true
      },
    });

    if (!teacher) {
      console.log("Teacher not found for userId:", session.user.id);
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const classIds = teacher.classesTeaching.map((tc) => tc.classId);
    console.log("Teacher classes:", classIds);

    // Fetch announcements: all-school, role-specific, or class-specific
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetRole: null, classId: null }, // All school
          { targetRole: "TEACHER", classId: null }, // All teachers
          { classId: { in: classIds } }, // Specific classes
        ],
      },
      include: {
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Announcements found:", announcements.length);

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
