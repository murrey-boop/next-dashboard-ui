import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role, email, name, surname, phone, address, bloodType, birthday, sex } = body;

    // Validate required fields
    if (!role || !email || !name || !surname || !birthday || !sex) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash("School@123", 10);

    // Create user with role-specific data
    let user: any;

    if (role === "STUDENT") {
      const { admissionNumber, classId, parentId, parentName, parentSurname, parentEmail, parentPhone } = body;

      if (!admissionNumber || !classId) {
        return NextResponse.json(
          { error: "Missing student-specific fields" },
          { status: 400 }
        );
      }

      let finalParentId = parentId;

      // Create new parent if parent details provided
      if (parentName && parentEmail && !parentId) {
        const parentUser = await prisma.user.create({
          data: {
            email: parentEmail,
            password: hashedPassword,
            role: "PARENT",
            parent: {
              create: {
                name: `${parentName} ${parentSurname || ''}`.trim(),
                email: parentEmail,
                phone: parentPhone || '',
              },
            },
          },
          include: {
            parent: true,
          },
        });
        finalParentId = parentUser.parent!.id;
      }

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "STUDENT",
          student: {
            create: {
              name: `${name} ${surname}`,
              admissionNo: admissionNumber,
              dateOfBirth: new Date(birthday),
              gender: sex,
              address: address || null,
              classId,
              parentId: finalParentId || null,
              photo: null,
            },
          },
        },
        include: {
          student: true,
        },
      });

      // Create fee balance for student
      await prisma.feeBalance.create({
        data: {
          studentId: user.student!.id,
          totalFees: 0,
          amountPaid: 0,
          balance: 0,
          status: "PENDING",
        },
      });

    } else if (role === "TEACHER") {
      const { employeeNumber, tscNumber, teacherRole, qualification, subject1, subject2, subject3, subject4, subject5 } = body;

      if (!employeeNumber) {
        return NextResponse.json(
          { error: "Missing teacher-specific fields" },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "TEACHER",
          teacher: {
            create: {
              name: `${name} ${surname}`,
              employeeNo: employeeNumber,
              tscNumber: tscNumber || null,
              role: teacherRole || "TEACHER",
              phone: phone || null,
              address: address || null,
              dateOfBirth: new Date(birthday),
              gender: sex,
              photo: null,
            },
          },
        },
        include: {
          teacher: true,
        },
      });

      // Create or find subjects and link them
      const subjectNames = [subject1, subject2, subject3, subject4, subject5].filter(Boolean);
      
      for (const subjectName of subjectNames) {
        // Find or create subject
        let subject = await prisma.subject.findFirst({
          where: { name: { equals: subjectName, mode: 'insensitive' } },
        });

        if (!subject) {
          subject = await prisma.subject.create({
            data: { 
              name: subjectName,
              code: "",
            },
          });
        }

        // Link teacher to subject
        await prisma.teacherSubject.create({
          data: {
            teacherId: user.teacher!.id,
            subjectId: subject.id,
          },
        });
      }

    } else if (role === "PARENT") {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "PARENT",
          parent: {
            create: {
              name: `${name} ${surname}`.trim(),
              email,
              phone: phone || "",
              address: address || null,
            },
          },
        },
        include: {
          parent: true,
        },
      });

    } else if (role === "STAFF") {
      const { employeeNumber, qualification } = body;

      if (!employeeNumber) {
        return NextResponse.json(
          { error: "Missing staff-specific fields" },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "STAFF",
          staff: {
            create: {
              name: `${name} ${surname}`,
              employeeNo: employeeNumber,
              phone: phone || null,
              address: address || null,
              department: "General", // Default value, can be updated later
              position: qualification || "Staff",
              photo: null,
            },
          },
        },
        include: {
          staff: true,
        },
      });

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "User created successfully", 
      user: { id: user.id, email: user.email, role: user.role } 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or admission/employee number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
