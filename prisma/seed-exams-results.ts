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

// Helper functions for grading
function getGrade(marks: number): string {
  if (marks >= 90) return "A";
  if (marks >= 80) return "A-";
  if (marks >= 75) return "B+";
  if (marks >= 70) return "B";
  if (marks >= 65) return "B-";
  if (marks >= 60) return "C+";
  if (marks >= 55) return "C";
  if (marks >= 50) return "C-";
  if (marks >= 45) return "D+";
  if (marks >= 40) return "D";
  if (marks >= 35) return "D-";
  return "E";
}

function getRemarks(marks: number): string {
  if (marks >= 85) return "Excellent performance! Keep it up.";
  if (marks >= 75) return "Very good work. Well done!";
  if (marks >= 65) return "Good performance. Keep improving.";
  if (marks >= 55) return "Fair performance. More effort needed.";
  if (marks >= 45) return "Below average. Needs improvement.";
  return "Poor performance. Requires extra support.";
}

async function seedExamsAndResults() {
  try {
    console.log("📝 Starting exams and results seed...\n");

    // Get all classes, subjects, and teachers
    const classes = await prisma.class.findMany();
    const subjects = await prisma.subject.findMany();
    const teachers = await prisma.teacher.findMany({
      include: {
        subjectsTeaching: {
          include: {
            subject: true,
          },
        },
      },
    });

    console.log(`Found ${classes.length} classes, ${subjects.length} subjects, ${teachers.length} teachers\n`);

    let examCount = 0;
    let resultCount = 0;
    
    // Create exams for each class (Mid-Term and End-Term for Term 1)
    for (const classItem of classes) {
      console.log(`Creating exams for ${classItem.name}...`);
      
      // Get students in this class
      const classStudents = await prisma.student.findMany({
        where: { classId: classItem.id },
      });

      if (classStudents.length === 0) {
        console.log(`  ⚠️ No students found in ${classItem.name}, skipping`);
        continue;
      }

      console.log(`  Found ${classStudents.length} students`);

      // Select 5 core subjects for this grade level
      const coreSubjects = subjects.slice(0, 5); // Math, English, Kiswahili, Science, SST

      for (const subject of coreSubjects) {
        // Find a teacher who teaches this subject
        const teacher = teachers.find(t => 
          t.subjectsTeaching && t.subjectsTeaching.some(st => st.subject.id === subject.id)
        );

        if (!teacher) {
          console.log(`  ⚠️ No teacher found for ${subject.name}, skipping`);
          continue;
        }

        // Create Mid-Term Exam
        const midTermExam = await prisma.exam.create({
          data: {
            title: `Term 1 Mid-Term - ${subject.name}`,
            subjectId: subject.id,
            classId: classItem.id,
            teacherId: teacher.id,
            examDate: new Date("2025-02-28"),
            totalMarks: 100,
            duration: 90,
          },
        });
        examCount++;

        // Create results for each student
        for (const student of classStudents) {
          const marks = Math.random() * 40 + 50; // Random marks between 50-90
          const grade = getGrade(marks);
          
          await prisma.result.create({
            data: {
              studentId: student.id,
              examId: midTermExam.id,
              subjectId: subject.id,
              marks: marks,
              grade: grade,
              remarks: getRemarks(marks),
            },
          });
          resultCount++;
        }

        // Create End-Term Exam
        const endTermExam = await prisma.exam.create({
          data: {
            title: `Term 1 End-Term - ${subject.name}`,
            subjectId: subject.id,
            classId: classItem.id,
            teacherId: teacher.id,
            examDate: new Date("2025-04-10"),
            totalMarks: 100,
            duration: 120,
          },
        });
        examCount++;

        // Create results for each student
        for (const student of classStudents) {
          const marks = Math.random() * 40 + 50; // Random marks between 50-90
          const grade = getGrade(marks);
          
          await prisma.result.create({
            data: {
              studentId: student.id,
              examId: endTermExam.id,
              subjectId: subject.id,
              marks: marks,
              grade: grade,
              remarks: getRemarks(marks),
            },
          });
          resultCount++;
        }
      }
      
      console.log(`  ✅ Created exams for ${classItem.name}`);
    }
    
    console.log(`\n✅ Created ${examCount} exams and ${resultCount} results!\n`);

  } catch (error: any) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExamsAndResults();
