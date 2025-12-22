import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code || null,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subject:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Subject with this name or code already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
