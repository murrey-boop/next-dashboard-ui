import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET all fee structures
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');

    const where: any = {};
    if (classId) where.classId = classId;
    if (termId) where.termId = termId;

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        class: true,
        term: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data to match frontend structure
    const transformed = feeStructures.map(fs => ({
      id: fs.id,
      className: fs.class.name,
      termName: fs.term.name,
      tuitionFee: fs.category === 'TUITION' ? fs.amount : 0,
      transportFee: fs.category === 'TRANSPORT' ? fs.amount : 0,
      activityFee: fs.category === 'SPORTS' ? Number(fs.amount) : 0,
      examFee: fs.category === 'EXAMINATION' ? Number(fs.amount) : 0,
      totalFee: fs.amount,
      dueDate: fs.dueDate.toISOString(),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee structures' },
      { status: 500 }
    );
  }
}

// POST create new fee structure
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { classId, termId, category, amount, description, dueDate } = body;

    if (!classId || !termId || !category || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        classId,
        termId,
        category,
        amount,
        description,
        dueDate: new Date(dueDate),
      },
      include: {
        class: true,
        term: true,
      },
    });

    return NextResponse.json(feeStructure, { status: 201 });
  } catch (error: any) {
    console.error('Error creating fee structure:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Fee structure already exists for this class, term, and category' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create fee structure' },
      { status: 500 }
    );
  }
}

// DELETE fee structure
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing fee structure ID' },
        { status: 400 }
      );
    }

    await prisma.feeStructure.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    return NextResponse.json(
      { error: 'Failed to delete fee structure' },
      { status: 500 }
    );
  }
}
