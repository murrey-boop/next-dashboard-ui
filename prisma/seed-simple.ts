// Simple seed script
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load .env file
dotenv.config({ path: ".env" });

// Manually parse DATABASE_URL to ensure password is properly escaped
// Format: postgresql://user:password@host:port/database
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in .env file");
  process.exit(1);
}

const url = new URL(connectionString);

const pool = new Pool({
  user: url.username,
  password: url.password,
  host: url.hostname,
  port: parseInt(url.port),
  database: url.pathname.slice(1), // Remove leading /
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with sample data...\n");

  try {
    // Get the first admin, teacher, and class
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    const teacher = await prisma.teacher.findFirst({
      include: {
        user: true,
      },
    });

    const classWithStudents = await prisma.class.findFirst({
      include: {
        students: {
          take: 2,
        },
      },
    });

    if (!admin) {
      console.log("❌ No admin found. Please create an admin user first.");
      return;
    }

    if (!teacher) {
      console.log("❌ No teacher found. Please create a teacher first.");
      return;
    }

    if (!classWithStudents) {
      console.log("❌ No class found. Please create a class first.");
      return;
    }

    console.log("✅ Found admin:", admin.email);
    console.log("✅ Found teacher:", teacher.user.email);
    console.log("✅ Found class:", classWithStudents.name);
    console.log();

    // Create announcements
    console.log("📢 Creating announcements...");
    
    const announcement1 = await prisma.announcement.create({
      data: {
        title: "Urgent: Staff Meeting Tomorrow",
        content: "All teaching staff are required to attend the staff meeting tomorrow at 9 AM in the main hall. We will discuss the new curriculum changes and upcoming events.",
        targetRole: "TEACHER",
        priority: "URGENT",
        publishedBy: admin.id,
        createdAt: new Date("2025-01-15"),
      },
    });

    const announcement2 = await prisma.announcement.create({
      data: {
        title: "School Reopening Notice",
        content: "The school will reopen on February 5th, 2025. All students are expected to report on time with their uniforms and necessary materials.",
        targetRole: null, // All roles
        priority: "IMPORTANT",
        publishedBy: admin.id,
        createdAt: new Date("2025-01-10"),
      },
    });

    const announcement3 = await prisma.announcement.create({
      data: {
        title: "Field Trip Next Month",
        content: "We are organizing an educational field trip to the National Museum next month. More details will follow soon.",
        targetRole: "PARENT",
        classId: classWithStudents.id,
        priority: "NORMAL",
        publishedBy: admin.id,
        createdAt: new Date("2025-01-12"),
      },
    });

    const announcement4 = await prisma.announcement.create({
      data: {
        title: "Exam Timetable Released",
        content: "The mid-term examination timetable has been published. Please check the notice board for your exam schedule.",
        targetRole: "STUDENT",
        classId: classWithStudents.id,
        priority: "IMPORTANT",
        publishedBy: admin.id,
        createdAt: new Date("2025-01-20"),
      },
    });

    console.log(`  ✅ Created ${4} announcements`);
    console.log();

    // Create calendar events
    console.log("📅 Creating calendar events...");

    const event1 = await prisma.calendarEvent.create({
      data: {
        title: "New Year Holiday",
        description: "School closed for New Year celebrations",
        eventDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-03"),
        eventType: "HOLIDAY",
        createdBy: admin.id,
        createdAt: new Date("2024-12-15"),
      },
    });

    const event2 = await prisma.calendarEvent.create({
      data: {
        title: "Mid-Term Examinations",
        description: "Mid-term exams for all classes. Please arrive 15 minutes early.",
        eventDate: new Date("2025-02-10"),
        endDate: new Date("2025-02-14"),
        eventType: "EXAM",
        classId: classWithStudents.id,
        createdBy: admin.id,
        createdAt: new Date("2025-01-15"),
      },
    });

    const event3 = await prisma.calendarEvent.create({
      data: {
        title: "Sports Day",
        description: "Annual sports day competition. All students to participate.",
        eventDate: new Date("2025-03-15"),
        endDate: new Date("2025-03-15"),
        eventType: "SPORTS",
        createdBy: admin.id,
        createdAt: new Date("2025-01-18"),
      },
    });

    const event4 = await prisma.calendarEvent.create({
      data: {
        title: "Parent-Teacher Meeting",
        description: "Quarterly meeting with parents to discuss student progress",
        eventDate: new Date("2025-01-20"),
        endDate: new Date("2025-01-20"),
        eventType: "MEETING",
        createdBy: admin.id,
        createdAt: new Date("2025-01-05"),
      },
    });

    console.log(`  ✅ Created ${4} calendar events`);
    console.log();

    // Create behavior incidents (if students exist)
    if (classWithStudents.students.length > 0) {
      console.log("📝 Creating behavior incidents...");

      const student1 = classWithStudents.students[0];
      const student2 = classWithStudents.students[1] || student1;

      const behavior1 = await prisma.behaviorIncident.create({
        data: {
          studentId: student1.id,
          teacherId: teacher.id,
          title: "Excellent Class Participation",
          description: "Student actively participated in class discussions and helped other students understand the material.",
          incidentType: "POSITIVE",
          category: "ACADEMIC",
          severity: "LOW",
          actionTaken: "Praised in front of class and noted in record",
          incidentDate: new Date("2025-01-18"),
        },
      });

      const behavior2 = await prisma.behaviorIncident.create({
        data: {
          studentId: student2.id,
          teacherId: teacher.id,
          title: "Late Assignment Submission",
          description: "Assignment was submitted 3 days late without prior communication or valid excuse.",
          incidentType: "NEGATIVE",
          category: "ACADEMIC",
          severity: "MEDIUM",
          actionTaken: "Counseled student about time management. Parent contacted.",
          incidentDate: new Date("2025-01-15"),
        },
      });

      const behavior3 = await prisma.behaviorIncident.create({
        data: {
          studentId: student1.id,
          teacherId: teacher.id,
          title: "Helping New Student",
          description: "Volunteered to help a new student settle in and showed them around the school.",
          incidentType: "POSITIVE",
          category: "SOCIAL",
          severity: "LOW",
          actionTaken: "Recognized as student of the week",
          incidentDate: new Date("2025-01-20"),
        },
      });

      console.log(`  ✅ Created ${3} behavior incidents`);
      console.log();
    }

    // Create resources
    console.log("📚 Creating resources...");

    // Get a subject for the teacher
    const teacherSubject = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: teacher.id,
      },
      include: {
        subject: true,
      },
    });

    if (teacherSubject) {
      const resource1 = await prisma.resource.create({
        data: {
          title: "Mathematics Revision Notes",
          description: "Comprehensive revision notes covering all topics for the upcoming exam.",
          fileName: "math_revision.pdf",
          fileType: "application/pdf",
          fileData: "base64_encoded_pdf_data_here", // Placeholder
          subjectId: teacherSubject.subjectId,
          classId: classWithStudents.id,
          uploadedBy: teacher.id,
          isPublic: true,
          downloads: 15,
          createdAt: new Date("2025-01-10"),
        },
      });

      const resource2 = await prisma.resource.create({
        data: {
          title: "Science Experiment Videos",
          description: "Collection of videos demonstrating key science experiments.",
          fileName: "https://youtube.com/playlist?list=sample123",
          fileType: "video/url",
          fileData: "https://youtube.com/playlist?list=sample123",
          subjectId: teacherSubject.subjectId,
          classId: classWithStudents.id,
          uploadedBy: teacher.id,
          isPublic: true,
          downloads: 42,
          createdAt: new Date("2025-01-12"),
        },
      });

      const resource3 = await prisma.resource.create({
        data: {
          title: "Reading Comprehension Worksheets",
          description: "Practice worksheets for improving reading skills.",
          fileName: "reading_worksheets.docx",
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileData: "base64_encoded_doc_data_here", // Placeholder
          subjectId: teacherSubject.subjectId,
          classId: classWithStudents.id,
          uploadedBy: teacher.id,
          isPublic: false,
          downloads: 8,
          createdAt: new Date("2025-01-15"),
        },
      });

      console.log(`  ✅ Created ${3} resources`);
    } else {
      console.log("  ⚠️  No subject found for teacher. Skipping resources.");
    }

    console.log();
    console.log("=" .repeat(60));
    console.log("✨ Seeding completed successfully!");
    console.log("=" .repeat(60));
    console.log();
    console.log("Summary:");
    console.log("  • 4 Announcements (all priorities, different target roles)");
    console.log("  • 4 Calendar Events (holiday, exam, sports, meeting)");
    console.log("  • 3 Behavior Incidents (positive and negative examples)");
    console.log("  • 3 Resources (PDF, video link, document)");
    console.log();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
