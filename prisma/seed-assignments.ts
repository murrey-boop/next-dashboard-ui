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

async function main() {
  console.log("Starting to seed assignments...");

  // Get all classes
  const classes = await prisma.class.findMany({
    include: {
      students: true,
    },
  });

  if (classes.length === 0) {
    console.log("No classes found. Please run the main seed script first.");
    return;
  }

  // Get all subjects
  const subjects = await prisma.subject.findMany();

  if (subjects.length === 0) {
    console.log("No subjects found. Please run the main seed script first.");
    return;
  }

  // Get all teachers
  const teachers = await prisma.teacher.findMany({
    include: {
      subjectsTeaching: {
        include: {
          subject: true,
        },
      },
    },
  });

  if (teachers.length === 0) {
    console.log("No teachers found. Please run the main seed script first.");
    return;
  }

  // Get current academic term
  const currentTerm = await prisma.academicTerm.findFirst({
    orderBy: { startDate: "desc" },
  });

  if (!currentTerm) {
    console.log("No academic term found.");
    return;
  }

  // Clear existing assignments to avoid duplicates
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  console.log("Cleared existing assignments and submissions");

  const assignmentTitles = [
    "Essay on Climate Change",
    "Mathematics Problem Set",
    "Science Lab Report",
    "English Literature Analysis",
    "History Research Project",
    "Geography Case Study",
    "Physics Experiment Report",
    "Chemistry Quiz Assignment",
    "Biology Diagram Labeling",
    "Computer Programming Exercise",
    "Art Project Submission",
    "Music Theory Assignment",
    "Physical Education Activity Log",
    "French Vocabulary Practice",
    "Spanish Grammar Exercises",
  ];

  const descriptions = [
    "Complete all questions and show your working. Submit before the due date.",
    "Read the chapter and answer the questions at the end. Minimum 500 words.",
    "Conduct the experiment and write a detailed report with observations.",
    "Analyze the text and provide critical commentary with examples.",
    "Research the topic and prepare a comprehensive report with references.",
    "Study the case and present your findings with supporting data.",
    "Complete the practical work and document your methodology and results.",
    "Answer all questions based on the lessons covered this term.",
    "Draw and label the diagrams accurately with proper annotations.",
    "Write the program according to specifications and test thoroughly.",
  ];

  let assignmentCount = 0;

  // Create 3-5 assignments per class
  for (const classItem of classes) {
    const numAssignments = Math.floor(Math.random() * 3) + 3; // 3-5 assignments

    for (let i = 0; i < numAssignments; i++) {
      // Pick a random subject
      const subject = subjects[Math.floor(Math.random() * subjects.length)];

      // Find a teacher who teaches this subject
      const suitableTeachers = teachers.filter((t) =>
        t.subjectsTeaching.some((ts) => ts.subjectId === subject.id)
      );

      if (suitableTeachers.length === 0) {
        // Use any teacher if no match found
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];

        const daysAgo = Math.floor(Math.random() * 20) + 5; // 5-25 days ago
        const dueDays = Math.floor(Math.random() * 15) + 1; // 1-15 days from now or past

        // Some assignments should be overdue, some pending
        const isPastDue = Math.random() > 0.6; // 40% overdue
        const dueDate = new Date();
        if (isPastDue) {
          dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 5) - 1); // 1-5 days ago
        } else {
          dueDate.setDate(dueDate.getDate() + dueDays); // future
        }

        const assignment = await prisma.assignment.create({
          data: {
            title:
              assignmentTitles[
                Math.floor(Math.random() * assignmentTitles.length)
              ] +
              " - " +
              classItem.name,
            description:
              descriptions[Math.floor(Math.random() * descriptions.length)],
            subjectId: subject.id,
            classId: classItem.id,
            teacherId: teacher.id,
            dueDate: dueDate,
            totalMarks: [10, 20, 30, 50, 100][
              Math.floor(Math.random() * 5)
            ],
            
          },
        });

        assignmentCount++;

        // Create submissions for some students (40% submission rate)
        for (const student of classItem.students) {
          if (Math.random() > 0.6) {
            // 40% have submitted
            const hasGrade = Math.random() > 0.5; // 50% of submissions are graded

            const submission = await prisma.assignmentSubmission.create({
              data: {
                assignmentId: assignment.id,
                studentId: student.id,
                submittedAt: new Date(
                  Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
                ), // Within last 10 days
                marks: hasGrade
                  ? Math.floor(
                      Math.random() * assignment.totalMarks * 0.4 +
                        assignment.totalMarks * 0.6
                    )
                  : null, // 60-100% if graded
                feedback: hasGrade
                  ? [
                      "Good work! Keep it up.",
                      "Excellent effort. Well done!",
                      "Needs improvement in some areas.",
                      "Outstanding performance!",
                      "Good attempt, but review the concepts.",
                    ][Math.floor(Math.random() * 5)]
                  : null,
              },
            });
          }
        }
      } else {
        const teacher =
          suitableTeachers[
            Math.floor(Math.random() * suitableTeachers.length)
          ];

        const daysAgo = Math.floor(Math.random() * 20) + 5; // 5-25 days ago
        const dueDays = Math.floor(Math.random() * 15) + 1; // 1-15 days from now or past

        // Some assignments should be overdue, some pending
        const isPastDue = Math.random() > 0.6; // 40% overdue
        const dueDate = new Date();
        if (isPastDue) {
          dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 5) - 1); // 1-5 days ago
        } else {
          dueDate.setDate(dueDate.getDate() + dueDays); // future
        }

        const assignment = await prisma.assignment.create({
          data: {
            title:
              assignmentTitles[
                Math.floor(Math.random() * assignmentTitles.length)
              ] +
              " - " +
              classItem.name,
            description:
              descriptions[Math.floor(Math.random() * descriptions.length)],
            subjectId: subject.id,
            classId: classItem.id,
            teacherId: teacher.id,
            dueDate: dueDate,
            totalMarks: [10, 20, 30, 50, 100][
              Math.floor(Math.random() * 5)
            ],
            
          },
        });

        assignmentCount++;

        // Create submissions for some students (40% submission rate)
        for (const student of classItem.students) {
          if (Math.random() > 0.6) {
            // 40% have submitted
            const hasGrade = Math.random() > 0.5; // 50% of submissions are graded

            await prisma.assignmentSubmission.create({
              data: {
                assignmentId: assignment.id,
                studentId: student.id,
                submittedAt: new Date(
                  Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
                ), // Within last 10 days
                marks: hasGrade
                  ? Math.floor(
                      Math.random() * assignment.totalMarks * 0.4 +
                        assignment.totalMarks * 0.6
                    )
                  : null, // 60-100% if graded
                feedback: hasGrade
                  ? [
                      "Good work! Keep it up.",
                      "Excellent effort. Well done!",
                      "Needs improvement in some areas.",
                      "Outstanding performance!",
                      "Good attempt, but review the concepts.",
                    ][Math.floor(Math.random() * 5)]
                  : null,
              },
            });
          }
        }
      }
    }
  }

  console.log(`✅ Created ${assignmentCount} assignments successfully!`);
  console.log(
    `   - Some assignments are PENDING (future due date, no submission)`
  );
  console.log(
    `   - Some assignments are OVERDUE (past due date, no submission)`
  );
  console.log(`   - Some assignments are SUBMITTED (has submission, not graded)`);
  console.log(`   - Some assignments are GRADED (has submission with marks)`);
  console.log(`\n📝 You should now see "Submit Assignment" buttons on pending/overdue assignments!`);
}

main()
  .catch((e) => {
    console.error("Error seeding assignments:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
