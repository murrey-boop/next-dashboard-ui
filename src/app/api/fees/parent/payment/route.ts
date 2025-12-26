import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, amount, paymentMethod, transactionRef } = body;

    // Validate input
    if (!studentId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify parent owns this student
    const parent = await prisma.parent.findUnique({
      where: { id: session.user.id },
      include: {
        students: {
          where: { id: studentId },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return NextResponse.json(
        { error: "Student not found or unauthorized" },
        { status: 403 }
      );
    }

    const student = parent.students[0];

    // Get current term balance
    const currentBalance = await prisma.feeBalance.findFirst({
      where: {
        studentId: student.id,
        balance: { gt: 0 },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!currentBalance) {
      return NextResponse.json(
        { error: "No outstanding balance found" },
        { status: 404 }
      );
    }

    // Validate amount
    if (amount > currentBalance.balance) {
      return NextResponse.json(
        { error: "Amount exceeds outstanding balance" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.feePayment.create({
      data: {
        studentId: student.id,
        academicTermId: currentBalance.academicTermId,
        amount: parseFloat(amount),
        paymentMethod:
          paymentMethod === "M_PESA"
            ? "M_PESA"
            : paymentMethod === "CREDIT_CARD"
            ? "CREDIT_CARD"
            : "BANK_TRANSFER",
        transactionRef: transactionRef || `TXN${Date.now()}`,
        paymentDate: new Date(),
      },
    });

    // Update balance
    await prisma.feeBalance.update({
      where: { id: currentBalance.id },
      data: {
        paidAmount: currentBalance.paidAmount + parseFloat(amount),
        balance: currentBalance.balance - parseFloat(amount),
        status:
          currentBalance.balance - parseFloat(amount) === 0
            ? "PAID"
            : "PARTIAL",
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        transactionRef: payment.transactionRef,
        paymentDate: payment.paymentDate,
      },
      newBalance: currentBalance.balance - parseFloat(amount),
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
