import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

// GET all payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId');

    const where: any = {};
    
    // If not admin, only show own data
    if (session.user.role === 'PARENT') {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { students: true },
      });
      
      if (parent) {
        where.studentId = { in: parent.students.map(s => s.id) };
      }
    } else if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
      });
      
      if (student) {
        where.studentId = student.id;
      }
    }

    if (studentId) where.studentId = studentId;
    if (termId) where.termId = termId;

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
          },
        },
        term: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST record new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'PARENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, termId, amount, paymentMethod, referenceNo, remarks } = body;

    if (!studentId || !termId || !amount || !paymentMethod || !referenceNo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // If parent, verify it's their child
    if (session.user.role === 'PARENT') {
      if (student.parentId !== (await prisma.parent.findUnique({ where: { userId: session.user.id } }))?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Record payment
    const payment = await prisma.feePayment.create({
      data: {
        studentId,
        termId,
        amount,
        paymentMethod,
        referenceNo,
        remarks,
        confirmedBy: session.user.role === 'ADMIN' ? session.user.name : null,
      },
      include: {
        student: true,
        term: true,
      },
    });

    // Update fee balance
    const balance = await prisma.feeBalance.upsert({
      where: { studentId },
      create: {
        studentId,
        totalFees: 0,
        amountPaid: amount,
        balance: -amount,
        lastPayment: new Date(),
      },
      update: {
        amountPaid: { increment: amount },
        balance: { decrement: amount },
        lastPayment: new Date(),
      },
    });

    // Update status based on balance
    await prisma.feeBalance.update({
      where: { studentId },
      data: {
        status: Number(balance.balance) <= 0 ? 'PAID' : Number(balance.balance) < Number(balance.totalFees) ? 'PARTIAL' : 'PENDING',
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Payment with this reference number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
