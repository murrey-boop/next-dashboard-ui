import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parents = await prisma.parent.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        surname: true,
      },
    });

    const formatted = parents.map((p) => ({
      id: p.id,
      name: `${p.name} ${p.surname}`,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching parents:", error);
    return NextResponse.json(
      { error: "Failed to fetch parents" },
      { status: 500 }
    );
  }
}
