import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const incidents = await prisma.behaviorIncident.findMany({
      where: { teacherId: teacher.id },
      include: { student: true },
      orderBy: { incidentDate: "desc" },
    });

    const formattedIncidents = incidents.map((i) => ({
      id: i.id,
      studentName: i.student.name,
      studentAdmission: i.student.admissionNo,
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      studentId,
      title,
      description,
      incidentType,
      category,
      severity,
      actionTaken,
      incidentDate,
    } = body;

    const incident = await prisma.behaviorIncident.create({
      data: {
        studentId,
        teacherId: teacher.id,
        title,
        description,
        incidentType: incidentType || "NEUTRAL",
        category: category || "OTHER",
        severity: severity || "MEDIUM",
        actionTaken: actionTaken || null,
        incidentDate: new Date(incidentDate),
      },
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    console.error("Error creating behavior incident:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
