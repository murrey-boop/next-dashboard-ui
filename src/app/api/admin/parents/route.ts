import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parents = await prisma.parent.findMany({
      include: {
        user: true,
        children: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const parentsFormatted = parents.map((parent) => ({
      id: parent.id,
      name: parent.user.name,
      email: parent.user.email,
      phone: parent.phone,
      photo: parent.photo,
      childrenCount: parent.children.length,
      childrenNames: parent.children.map((child) => child.name),
    }));

    return NextResponse.json({ parents: parentsFormatted });
  } catch (error) {
    console.error("Error fetching parents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
