import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        subjectsTeaching: true,
        classesTeaching: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const subjectIds = teacher.subjectsTeaching.map((ts) => ts.subjectId);
    const classIds = teacher.classesTeaching.map((tc) => tc.classId);

    // Fetch public resources and teacher's own resources
    const allResources = await prisma.resource.findMany({
      where: {
        OR: [
          { isPublic: true },
          { uploadedBy: teacher.userId },
          { subjectId: { in: subjectIds } },
          { classId: { in: classIds } },
        ],
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const resources = allResources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileName: resource.fileName,
      fileType: resource.fileType,
      subjectName: resource.subject?.name || null,
      className: resource.class?.name || null,
      downloads: resource.downloads,
      createdAt: resource.createdAt.toISOString(),
    }));

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      fileData,
      fileName,
      fileType,
      fileUrl,
      subjectId,
      classId,
      isPublic,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!fileData && !fileUrl) {
      return NextResponse.json({ error: "File or URL is required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        fileData,
        fileName,
        fileType,
        fileUrl,
        subjectId: subjectId || null,
        classId: classId || null,
        uploadedBy: teacher.userId,
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json({ message: "Resource uploaded", resource });
  } catch (error) {
    console.error("Error uploading resource:", error);
    return NextResponse.json({ error: "Failed to upload resource" }, { status: 500 });
  }
}
