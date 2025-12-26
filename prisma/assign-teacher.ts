import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function assignTeacher() {
  try {
    // Find the test teacher
    const teacherUser = await prisma.user.findUnique({
      where: { email: "teacher.test@engineercentral.edu" },
      include: { teacher: true },
    });

    if (!teacherUser || !teacherUser.teacher) {
      console.log("❌ Test teacher not found");
      return;
    }

    const teacherId = teacherUser.teacher.id;
    console.log("✅ Found teacher:", teacherUser.teacher.name);

    // Get some classes and subjects
    const classes = await prisma.class.findMany({ take: 3 });
    const subjects = await prisma.subject.findMany({ take: 3 });

    if (classes.length === 0 || subjects.length === 0) {
      console.log("❌ No classes or subjects found in database");
      return;
    }

    // Assign teacher to classes
    for (const cls of classes) {
      try {
        await prisma.teacherClass.create({
          data: {
            teacherId: teacherId,
            classId: cls.id,
            classRef: cls.name,
          },
        });
        console.log(`✅ Assigned to class: ${cls.name}`);
      } catch (e: any) {
        if (e.code !== "P2002") {
          console.error(`Error assigning class ${cls.name}:`, e.message);
        }
      }
    }

    // Assign teacher to subjects
    for (const subject of subjects) {
      try {
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacherId,
            subjectId: subject.id,
          },
        });
        console.log(`✅ Assigned to subject: ${subject.name}`);
      } catch (e: any) {
        if (e.code !== "P2002") {
          console.error(`Error assigning subject ${subject.name}:`, e.message);
        }
      }
    }

    console.log("\n✅ Teacher assignment complete!");
    
  } catch (error) {
    console.error("Error assigning teacher:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTeacher();
