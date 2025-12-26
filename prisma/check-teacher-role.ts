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

async function checkTeacherRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "teacher.test@engineercentral.edu" },
      include: { teacher: true },
    });

    console.log("User found:", {
      email: user?.email,
      role: user?.role,
      isActive: user?.isActive,
      hasTeacher: !!user?.teacher,
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherRole();
