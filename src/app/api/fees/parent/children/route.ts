import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get parent with their children
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            class: true,
            feeBalance: true,
            feePayments: {
              orderBy: {
                transactionDate: "desc",
              },
              take: 20,
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Transform data for frontend
    const childrenFeeData = parent.students.map((student: any) => ({
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNo,
      className: student.class.name,
      photo: student.photo,
      balances: student.feeBalance ? [{
        id: student.feeBalance.id,
        termName: 'Current Term',
        totalFees: Number(student.feeBalance.totalFees),
        paidAmount: Number(student.feeBalance.amountPaid),
        balance: Number(student.feeBalance.balance),
        status: student.feeBalance.status,
        dueDate: new Date().toISOString(),
      }] : [],
      payments: student.feePayments.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        transactionRef: p.referenceNumber,
        paymentDate: p.transactionDate.toISOString(),
        termName: 'Current Term',
      })),
    }));

    return NextResponse.json(childrenFeeData);
  } catch (error) {
    console.error("Error fetching parent fee data:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee data" },
      { status: 500 }
    );
  }
}
