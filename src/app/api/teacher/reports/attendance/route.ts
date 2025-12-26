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

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
    });

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
      },
      orderBy: { date: "desc" },
    });

    // Group by date
    const attendanceByDate = attendanceRecords.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { present: 0, absent: 0, total: 0 };
      }
      if (record.present) {
        acc[dateKey].present++;
      } else {
        acc[dateKey].absent++;
      }
      acc[dateKey].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

    const attendance = Object.entries(attendanceByDate).map(([date, data]) => ({
      date,
      present: data.present,
      absent: data.absent,
      total: data.total,
      percentage: (data.present / data.total) * 100,
    }));

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    return NextResponse.json({ error: "Failed to fetch attendance report" }, { status: 500 });
  }
}
