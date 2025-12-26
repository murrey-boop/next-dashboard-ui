import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    // Get all support staff (not teachers)
    const staff = await prisma.user.findMany({
      where: {
        role: "SUPPORT_STAFF",
      },
      select: {
        id: true,
        name: true,
        employeeNo: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        department: true,
        salary: true,
        hireDate: true,
        workHistory: true,
        achievements: true,
      },
      orderBy: {
        hireDate: "desc",
      },
    });

    // Format data
    const formattedStaff = staff.map((member) => ({
      id: member.id,
      name: member.name,
      employeeNo: member.employeeNo,
      email: member.email,
      phone: member.phone,
      photo: member.photo,
      role: member.role,
      department: member.department || "ADMIN",
      salary: Number(member.salary || 0),
      hireDate: member.hireDate?.toISOString() || new Date().toISOString(),
      achievements: (member.achievements as any)?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, department, salary, hireDate } = body;

    // Validate required fields
    if (!name || !email || !password || !department || !salary || !hireDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate employee number
    const count = await prisma.user.count({
      where: { role: "SUPPORT_STAFF" },
    });
    const employeeNo = `STAFF${(count + 1).toString().padStart(4, "0")}`;

    // Create staff member
    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "SUPPORT_STAFF",
        department,
        employeeNo,
        salary: parseFloat(salary),
        hireDate: new Date(hireDate),
        workHistory: [],
        achievements: [],
      },
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        employeeNo: newStaff.employeeNo,
      },
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
