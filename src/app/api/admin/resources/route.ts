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

    const resources = await prisma.resource.findMany({
      include: {
        subject: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get uploader names
    const uploaderIds = resources.map((r) => r.uploadedBy);
    const teachers = await prisma.teacher.findMany({
      where: { userId: { in: uploaderIds } },
      select: { userId: true, name: true },
    });

    const teacherMap = new Map(teachers.map((t) => [t.userId, t.name]));

    const formattedResources = resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileName: resource.fileName,
      fileType: resource.fileType,
      subjectName: resource.subject?.name || null,
      className: resource.class?.name || null,
      uploadedBy: teacherMap.get(resource.uploadedBy) || "Unknown",
      isPublic: resource.isPublic,
      downloads: resource.downloads,
      createdAt: resource.createdAt.toISOString(),
    }));

    return NextResponse.json({ resources: formattedResources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
