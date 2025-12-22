import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET fee balance for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      // If no studentId provided and user is parent, get all their children's balances
      if (session.user.role === 'PARENT') {
        const parent = await prisma.parent.findUnique({
          where: { userId: session.user.id },
          include: {
            students: {
              include: {
                feeBalances: true,
                class: true,
              },
            },
          },
        });

        return NextResponse.json(parent?.students || []);
      }

      // If student, get their own balance
      if (session.user.role === 'STUDENT') {
        const student = await prisma.student.findUnique({
          where: { userId: session.user.id },
          include: {
            feeBalances: true,
            class: true,
          },
        });

        return NextResponse.json(student ? [student] : []);
      }

      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      );
    }

    const balance = await prisma.feeBalance.findUnique({
      where: { studentId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!balance) {
      return NextResponse.json(
        { error: 'Fee balance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error fetching fee balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee balance' },
      { status: 500 }
    );
  }
}

// POST/PUT update fee balance (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, totalFees } = body;

    if (!studentId || !totalFees) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const balance = await prisma.feeBalance.upsert({
      where: { studentId },
      create: {
        studentId,
        totalFees,
        amountPaid: 0,
        balance: totalFees,
        status: 'PENDING',
      },
      update: {
        totalFees,
        balance: totalFees,
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json(balance);
  } catch (error) {
    console.error('Error updating fee balance:', error);
    return NextResponse.json(
      { error: 'Failed to update fee balance' },
      { status: 500 }
    );
  }
}
