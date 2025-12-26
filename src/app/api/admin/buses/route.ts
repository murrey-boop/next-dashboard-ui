import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        registrationNo: "asc",
      },
    });

    const formattedBuses = buses.map((bus) => ({
      id: bus.id,
      registrationNo: bus.registrationNo,
      capacity: bus.capacity,
      driverName: bus.driverName,
      route: bus.route,
      status: bus.status,
      studentsCount: bus._count.students,
    }));

    return NextResponse.json({
      success: true,
      buses: formattedBuses,
    });
  } catch (error) {
    console.error("Error fetching buses:", error);
    return NextResponse.json(
      { error: "Failed to fetch buses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationNo, capacity, driverName, route } = body;

    if (!registrationNo || !capacity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if registration already exists
    const existing = await prisma.bus.findUnique({
      where: { registrationNo },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Registration number already exists" },
        { status: 400 }
      );
    }

    const newBus = await prisma.bus.create({
      data: {
        registrationNo: registrationNo.toUpperCase(),
        capacity: parseInt(capacity),
        driverName: driverName || null,
        route: route || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      bus: newBus,
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    return NextResponse.json(
      { error: "Failed to create bus" },
      { status: 500 }
    );
  }
}
