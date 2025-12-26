import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createTeacher() {
  const hashedPassword = await bcrypt.hash("School@123", 10);

  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "teacher.test@engineercentral.edu" },
    });

    if (existingUser) {
      console.log("❌ Teacher user already exists");
      await prisma.$disconnect();
      return;
    }

    // Create teacher user
    const teacher = await prisma.user.create({
      data: {
        email: "teacher.test@engineercentral.edu",
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            name: "Jane Smith",
            employeeNo: "TCH2025999",
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

    console.log("✅ Created teacher user:", teacher.email);
    console.log("✅ Teacher ID:", teacher.teacher?.id);

    // Get some classes and subjects to assign
    const classes = await prisma.class.findMany({ take: 3 });
    const subjects = await prisma.subject.findMany({ take: 3 });

    if (classes.length > 0 && teacher.teacher) {
      // Assign to classes
      for (const cls of classes) {
        await prisma.teacherClass.create({
          data: {
            teacherId: teacher.teacher.id,
            classId: cls.id,
            classRef: cls.name,
          },
        });
        console.log(`✅ Assigned to class: ${cls.name}`);
      }
    }

    if (subjects.length > 0 && teacher.teacher) {
      // Assign to subjects
      for (const subject of subjects) {
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacher.id,
            subjectId: subject.id,
          },
        });
        console.log(`✅ Assigned to subject: ${subject.name}`);
      }
    }

    console.log("\n✅ Teacher setup complete!");
    console.log("Email: teacher.test@engineercentral.edu");
    console.log("Password: School@123");

  } catch (error: any) {
    console.error("Error creating teacher:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTeacher();
