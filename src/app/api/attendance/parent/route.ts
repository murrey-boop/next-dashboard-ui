import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get parent's children and their attendance
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            class: {
              select: {
                name: true,
                gradeLevel: true,
              },
            },
            attendance: {
              orderBy: {
                date: 'desc',
              },
              take: 30, // Last 30 attendance records
              select: {
                id: true,
                date: true,
                status: true,
                remarks: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }

    // Calculate attendance statistics for each student
    const studentsWithStats = parent.students.map((student) => {
      const totalRecords = student.attendance.length;
      const presentCount = student.attendance.filter(
        (a) => a.status === "PRESENT"
      ).length;
      const absentCount = student.attendance.filter(
        (a) => a.status === "ABSENT"
      ).length;
      const lateCount = student.attendance.filter(
        (a) => a.status === "LATE"
      ).length;
      const excusedCount = student.attendance.filter(
        (a) => a.status === "EXCUSED"
      ).length;

      const attendanceRate =
        totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;

      return {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        class: student.class,
        attendance: student.attendance,
        stats: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
        },
      };
    });

    return NextResponse.json({
      students: studentsWithStats,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}
