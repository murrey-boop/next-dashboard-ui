import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const classId = searchParams.get("classId") || "";

    const where: any = {};

    // Search filter
    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { admissionNo: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Status filter
    if (status !== "all") {
      where.status = status.toUpperCase();
    }

    // Class filter
    if (classId) {
      where.student = {
        ...where.student,
        classId,
      };
    }

    const studentFees = await prisma.feeBalance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
            parent: true,
            buses: {
              include: {
                bus: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formatted = studentFees.map((sf) => ({
      id: sf.id,
      studentId: sf.student.id,
      studentName: sf.student.name,
      admissionNo: sf.student.admissionNo,
      class: sf.student.class.name,
      parentName: sf.student.parent?.name || "N/A",
      parentPhone: sf.student.parent?.phone || "N/A",
      totalFees: parseFloat(sf.totalFees.toString()),
      amountPaid: parseFloat(sf.amountPaid.toString()),
      balance: parseFloat(sf.balance.toString()),
      status: sf.status,
      busFee: sf.student.buses.reduce(
        (sum, b) => sum + parseFloat(b.feeAmount.toString()),
        0
      ),
      dueDate: sf.dueDate?.toISOString() || null,
      lastPaymentDate: sf.lastPaymentDate?.toISOString() || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching student fees:", error);
    return NextResponse.json(
      { error: "Failed to fetch student fees" },
      { status: 500 }
    );
  }
}
