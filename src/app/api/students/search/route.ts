import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
          { admissionNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      admissionNumber: s.admissionNo,
      className: s.class.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
