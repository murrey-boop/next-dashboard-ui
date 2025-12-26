import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete bus
    await prisma.bus.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Bus deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bus:", error);
    return NextResponse.json(
      { error: "Failed to delete bus" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { driverName, route, status, capacity } = body;

    const updated = await prisma.bus.update({
      where: { id },
      data: {
        ...(driverName !== undefined && { driverName }),
        ...(route !== undefined && { route }),
        ...(status && { status }),
        ...(capacity && { capacity: parseInt(capacity) }),
      },
    });

    return NextResponse.json({
      success: true,
      bus: updated,
    });
  } catch (error) {
    console.error("Error updating bus:", error);
    return NextResponse.json(
      { error: "Failed to update bus" },
      { status: 500 }
    );
  }
}
