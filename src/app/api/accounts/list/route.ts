import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const where: any = {};
    if (role && role !== "ALL") {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
        parent: {
          select: {
            name: true,
            surname: true,
          },
        },
        staff: {
          select: {
            name: true,
            surname: true,
          },
        },
        admin: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = users.map((user) => {
      const profile =
        user.student ||
        user.teacher ||
        user.parent ||
        user.staff ||
        user.admin;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile?.name || "",
        surname: profile?.surname || "",
        createdAt: user.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
