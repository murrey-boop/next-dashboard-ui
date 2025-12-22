import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function createTestAccounts() {
  const hashedPassword = await bcrypt.hash("School@123", 10);

  try {
    // Create test parent
    const parent = await prisma.user.create({
      data: {
        email: "parent.test@engineercentral.edu",
        password: hashedPassword,
        role: "PARENT",
        parent: {
          create: {
            name: "John Doe",
            email: "parent.test@engineercentral.edu",
            phone: "+254700000001",
            address: "Nairobi, Kenya",
          },
        },
      },
      include: {
        parent: true,
      },
    });

    console.log("✅ Created test parent:", parent.email);

    // Create test teacher
    const teacher = await prisma.user.create({
      data: {
        email: "teacher.test@engineercentral.edu",
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            name: "Jane Smith",
            employeeNo: "TCH2025001",
            role: "TEACHER",
            phone: "+254700000002",
            dateOfBirth: new Date("1990-05-15"),
            gender: "FEMALE",
          },
        },
      },
      include: {
        teacher: true,
      },
    });

    console.log("✅ Created test teacher:", teacher.email);

    // Create test student
    const classes = await prisma.class.findFirst();
    
    if (classes) {
      const student = await prisma.user.create({
        data: {
          email: "student.test@engineercentral.edu",
          password: hashedPassword,
          role: "STUDENT",
          student: {
            create: {
              name: "Mary Doe",
              admissionNo: "STU2025001",
              dateOfBirth: new Date("2010-03-10"),
              gender: "FEMALE",
              classId: classes.id,
              parentId: parent.parent!.id,
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
          studentId: student.student!.id,
          totalFees: 50000,
          amountPaid: 20000,
          balance: 30000,
          status: "PARTIAL",
        },
      });

      console.log("✅ Created test student:", student.email);
    }

    // Create test staff
    const staff = await prisma.user.create({
      data: {
        email: "staff.test@engineercentral.edu",
        password: hashedPassword,
        role: "STAFF",
        staff: {
          create: {
            name: "Robert Johnson",
            employeeNo: "STF2025001",
            department: "Administration",
            position: "Accountant",
            phone: "+254700000003",
          },
        },
      },
      include: {
        staff: true,
      },
    });

    console.log("✅ Created test staff:", staff.email);

    console.log("\n📋 Test Accounts Summary:");
    console.log("========================");
    console.log("Parent:  parent.test@engineercentral.edu");
    console.log("Teacher: teacher.test@engineercentral.edu");
    console.log("Student: student.test@engineercentral.edu");
    console.log("Staff:   staff.test@engineercentral.edu");
    console.log("Password for all: School@123");
    console.log("========================\n");

  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("⚠️ Test accounts already exist");
    } else {
      console.error("Error creating test accounts:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();
