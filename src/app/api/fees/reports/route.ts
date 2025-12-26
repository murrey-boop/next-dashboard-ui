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
    const termId = searchParams.get("termId");

    if (!termId) {
      return NextResponse.json(
        { error: "termId is required" },
        { status: 400 }
      );
    }

    // Get all fee payments for the term
    const payments = await prisma.feePayment.findMany({
      where: { termId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        term: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Get all students with their fee balances
    const students = await prisma.student.findMany({
      include: {
        class: true,
        feeBalances: true,
      },
    });

    // Calculate overview from payments
    const totalCollected = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    
    // Calculate expected revenue from all students (simplified)
    const totalExpectedRevenue = students.reduce(
      (sum, s) => sum + (s.feeBalances ? Number(s.feeBalances.totalFees) : 0),
      0
    );
    
    const totalPending = totalExpectedRevenue - totalCollected;
    const collectionRate =
      totalExpectedRevenue > 0
        ? (totalCollected / totalExpectedRevenue) * 100
        : 0;

    const totalStudents = students.length;
    const paidStudents = students.filter((s) => s.feeBalances && s.feeBalances.status === "PAID").length;
    const partialStudents = students.filter(
      (s) => s.feeBalances && s.feeBalances.status === "PARTIAL"
    ).length;
    const pendingStudents = students.filter(
      (s) => s.feeBalances && s.feeBalances.status === "PENDING"
    ).length;

    // By Class - group payments by student class
    const byClassMap = new Map<
      string,
      { expected: number; collected: number }
    >();
    
    students.forEach((s) => {
      const className = s.class.name;
      const existing = byClassMap.get(className) || {
        expected: 0,
        collected: 0,
      };
      byClassMap.set(className, {
        expected: existing.expected + (s.feeBalances ? Number(s.feeBalances.totalFees) : 0),
        collected: existing.collected + (s.feeBalances ? Number(s.feeBalances.amountPaid) : 0),
      });
    });

    const byClass = Array.from(byClassMap.entries())
      .map(([className, data]) => ({
        className,
        expected: data.expected,
        collected: data.collected,
        pending: data.expected - data.collected,
        rate: data.expected > 0 ? (data.collected / data.expected) * 100 : 0,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));

    // By Term (just return current term data)
    const term = await prisma.academicTerm.findUnique({
      where: { id: termId },
    });
    
    const byTerm = [
      {
        termName: term?.name || "Current Term",
        expected: totalExpectedRevenue,
        collected: totalCollected,
        pending: totalPending,
        rate: collectionRate,
      },
    ];

    // By Month
    const byMonthMap = new Map<string, number>();
    payments.forEach((p) => {
      const month = new Date(p.transactionDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      byMonthMap.set(month, (byMonthMap.get(month) || 0) + Number(p.amount));
    });

    const byMonth = Array.from(byMonthMap.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));

    // By Payment Method
    const byMethodMap = new Map<
      string,
      { amount: number; count: number }
    >();
    payments.forEach((p) => {
      const existing = byMethodMap.get(p.paymentMethod) || {
        amount: 0,
        count: 0,
      };
      byMethodMap.set(p.paymentMethod, {
        amount: existing.amount + Number(p.amount),
        count: existing.count + 1,
      });
    });

    const byPaymentMethod = Array.from(byMethodMap.entries()).map(
      ([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
      })
    );

    const reportData = {
      overview: {
        totalExpectedRevenue,
        totalCollected,
        totalPending,
        collectionRate,
        totalStudents,
        paidStudents,
        partialStudents,
        pendingStudents,
      },
      byClass,
      byTerm,
      byMonth,
      byPaymentMethod,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
