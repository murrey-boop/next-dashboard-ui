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
    const classId = searchParams.get("classId");
    const termId = searchParams.get("termId");
    const minBalance = searchParams.get("minBalance");

    const where: any = {
      status: {
        in: ["PARTIAL", "PENDING"],
      },
    };

    if (classId) {
      where.student = {
        classId: classId,
      };
    }

    if (termId) {
      where.termId = termId;
    }

    const balances = await prisma.feeBalance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        term: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
          take: 1,
        },
      },
      orderBy: [
        { student: { class: { name: "asc" } } },
        { student: { name: "asc" } },
      ],
    });

    let defaulters = balances.map((balance) => ({
      id: balance.id,
      studentName: balance.student.name,
      admissionNumber: balance.student.admissionNo,
      className: balance.student.class.name,
      termName: "Current Term",
      totalFees: Number(balance.totalFees),
      paidAmount: Number(balance.amountPaid),
      balance: Number(balance.balance),
      status: balance.status,
      lastPaymentDate: balance.lastPayment || null,
    }));

    // Filter by minimum balance if specified
    if (minBalance) {
      defaulters = defaulters.filter((d) => d.balance >= Number(minBalance));
    }

    return NextResponse.json(defaulters);
  } catch (error) {
    console.error("Error fetching defaulters:", error);
    return NextResponse.json(
      { error: "Failed to fetch defaulters" },
      { status: 500 }
    );
  }
}
