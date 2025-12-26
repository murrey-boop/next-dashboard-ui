import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get parent's children
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const studentIds = parent.students.map((s) => s.id);

    // Fetch behavior incidents for all children
    const incidents = await prisma.behaviorIncident.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        student: true,
        teacher: true,
      },
      orderBy: { incidentDate: "desc" },
    });

    const formattedIncidents = incidents.map((i) => ({
      id: i.id,
      studentName: i.student.name,
      studentAdmission: i.student.admissionNo,
      teacherName: i.teacher.name,
      title: i.title,
      description: i.description,
      incidentType: i.incidentType,
      category: i.category,
      severity: i.severity,
      actionTaken: i.actionTaken,
      incidentDate: i.incidentDate.toISOString(),
    }));

    return NextResponse.json({ incidents: formattedIncidents });
  } catch (error) {
    console.error("Error fetching behavior incidents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
