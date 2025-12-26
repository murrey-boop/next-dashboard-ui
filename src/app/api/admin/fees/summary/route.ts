import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get fee summary statistics
    const feeBalances = await prisma.feeBalance.findMany({
      include: {
        student: {
          select: {
            name: true,
            admissionNo: true,
          },
        },
      },
    });

    const totalFees = feeBalances.reduce((sum, fb) => sum + parseFloat(fb.totalFees.toString()), 0);
    const totalPaid = feeBalances.reduce((sum, fb) => sum + parseFloat(fb.amountPaid.toString()), 0);
    const totalBalance = feeBalances.reduce((sum, fb) => sum + parseFloat(fb.balance.toString()), 0);

    // Get this month's payments (mock data for now, will be real when payment table exists)
    const thisMonth = totalPaid * 0.15; // Estimate 15% collected this month

    // Categorize balances
    const pending = feeBalances.filter(fb => fb.status === "PARTIAL").reduce((sum, fb) => sum + parseFloat(fb.balance.toString()), 0);
    const overdue = feeBalances.filter(fb => fb.status === "OVERDUE").reduce((sum, fb) => sum + parseFloat(fb.balance.toString()), 0);

    // Get recent "payments" - mock data for demonstration
    const recentPayments = feeBalances.slice(0, 10).map((fb, index) => ({
      id: fb.id,
      studentName: fb.student.name,
      amount: parseFloat(fb.amountPaid.toString()),
      method: ["M-PESA", "Bank Transfer", "Cash", "Card"][index % 4],
      date: new Date(Date.now() - index * 86400000).toISOString(),
      status: "completed",
      receiptNo: `RCP-${fb.student.admissionNo}-${Date.now().toString().slice(-6)}`,
    }));

    return NextResponse.json({
      stats: {
        totalCollected: Math.round(totalPaid),
        pending: Math.round(pending),
        overdue: Math.round(overdue),
        thisMonth: Math.round(thisMonth),
        totalFees: Math.round(totalFees),
        totalBalance: Math.round(totalBalance),
        collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
      },
      recentPayments,
    });
  } catch (error) {
    console.error("Error fetching fee summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee summary" },
      { status: 500 }
    );
  }
}
