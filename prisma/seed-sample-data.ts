import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ 
  connectionString,
  // Explicitly parse the connection string to avoid password issues
  connectionTimeoutMillis: 5000,
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
        classesTeaching: true,
        subjectsTeaching: true,
      },
    });

    const classData = await prisma.class.findFirst({
      include: {
        students: true,
      },
    });

    if (!admin || !teacher || !classData) {
      console.error("❌ Missing required data (admin, teacher, or class)");
      return;
    }

    console.log(`✅ Found admin: ${admin.name}`);
    console.log(`✅ Found teacher: ${teacher.name}`);
    console.log(`✅ Found class: ${classData.name} with ${classData.students.length} students`);

    // 1. Create Announcements
    console.log("\n📢 Creating announcements...");
    const announcements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: "School Reopening Announcement",
          content:
            "Dear Students and Parents, We are excited to announce that school will reopen on January 8th, 2025. Please ensure all fees are paid and uniforms are ready.",
          priority: "IMPORTANT",
          targetRole: null,
          classId: null,
          publishedBy: admin.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: "Staff Meeting - Mandatory Attendance",
          content:
            "All teaching staff are required to attend the meeting on Friday at 3 PM in the staff room. Agenda: Term planning and curriculum review.",
          priority: "URGENT",
          targetRole: "TEACHER",
          classId: null,
          publishedBy: admin.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: `${classData.name} - Field Trip Permission`,
          content:
            "Parents of students in this class, please sign and return the field trip permission forms by Wednesday. The trip is scheduled for next Friday.",
          priority: "NORMAL",
          targetRole: "PARENT",
          classId: classData.id,
          publishedBy: admin.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: "Exam Timetable Released",
          content:
            "The end-of-term examination timetable has been released. Please check the notice board or contact your class teacher for details.",
          priority: "IMPORTANT",
          targetRole: "STUDENT",
          classId: null,
          publishedBy: admin.id,
        },
      }),
    ]);
    console.log(`✅ Created ${announcements.length} announcements`);

    // 2. Create Calendar Events
    console.log("\n📅 Creating calendar events...");
    const events = await Promise.all([
      prisma.calendarEvent.create({
        data: {
          title: "New Year Holiday",
          description: "School closed for New Year celebrations",
          eventDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-01"),
          eventType: "HOLIDAY",
          classId: null,
        },
      }),
      prisma.calendarEvent.create({
        data: {
          title: "Mid-Term Examinations",
          description: "Mid-term exams for all classes",
          eventDate: new Date("2025-02-10"),
          endDate: new Date("2025-02-14"),
          eventType: "EXAM",
          classId: null,
        },
      }),
      prisma.calendarEvent.create({
        data: {
          title: "Sports Day",
          description: "Annual sports day event - all students participate",
          eventDate: new Date("2025-03-15"),
          endDate: new Date("2025-03-15"),
          eventType: "SPORTS",
          classId: null,
        },
      }),
      prisma.calendarEvent.create({
        data: {
          title: `${classData.name} Parent-Teacher Meeting`,
          description: "Discuss student progress and address concerns",
          eventDate: new Date("2025-01-20"),
          endDate: new Date("2025-01-20"),
          eventType: "MEETING",
          classId: classData.id,
        },
      }),
    ]);
    console.log(`✅ Created ${events.length} calendar events`);

    // 3. Create Behavior Incidents (if students exist)
    if (classData.students.length > 0) {
      console.log("\n👥 Creating behavior incidents...");
      const incidents = await Promise.all([
        prisma.behaviorIncident.create({
          data: {
            studentId: classData.students[0].id,
            teacherId: teacher.id,
            title: "Excellent Class Participation",
            description:
              "Student actively participated in class discussions and helped other students understand difficult concepts.",
            incidentType: "POSITIVE",
            category: "ACADEMIC",
            severity: "LOW",
            actionTaken: "Verbal commendation given in front of class",
            incidentDate: new Date(),
          },
        }),
        classData.students.length > 1
          ? prisma.behaviorIncident.create({
              data: {
                studentId: classData.students[1].id,
                teacherId: teacher.id,
                title: "Late Submission of Assignment",
                description:
                  "Assignment submitted 3 days after the deadline without prior notice or valid reason.",
                incidentType: "NEGATIVE",
                category: "ACADEMIC",
                severity: "MEDIUM",
                actionTaken: "Parent contacted and deadline extension given",
                incidentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              },
            })
          : null,
        classData.students.length > 2
          ? prisma.behaviorIncident.create({
              data: {
                studentId: classData.students[2].id,
                teacherId: teacher.id,
                title: "Helped New Student Settle In",
                description:
                  "Volunteered to show new student around and helped them make friends.",
                incidentType: "POSITIVE",
                category: "SOCIAL",
                severity: "LOW",
                actionTaken: "Certificate of kindness awarded",
                incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              },
            })
          : null,
      ].filter(Boolean));
      console.log(`✅ Created ${incidents.length} behavior incidents`);
    }

    // 4. Create Resources
    console.log("\n📚 Creating resources...");
    const subjectId =
      teacher.subjectsTeaching.length > 0 ? teacher.subjectsTeaching[0].subjectId : null;

    const resources = await Promise.all([
      prisma.resource.create({
        data: {
          title: "Mathematics Revision Notes",
          description: "Comprehensive notes for term 1 mathematics topics including algebra and geometry",
          fileUrl: "https://example.com/math-notes.pdf",
          fileName: "Math_Revision_Notes.pdf",
          fileType: "application/pdf",
          subjectId: subjectId,
          classId: classData.id,
          uploadedBy: teacher.userId,
          isPublic: true,
        },
      }),
      prisma.resource.create({
        data: {
          title: "Science Experiment Videos",
          description: "Video demonstrations of physics experiments covered in class",
          fileUrl: "https://www.youtube.com/watch?v=example",
          fileName: null,
          fileType: "video/link",
          subjectId: subjectId,
          classId: null,
          uploadedBy: teacher.userId,
          isPublic: true,
        },
      }),
      prisma.resource.create({
        data: {
          title: "Reading Comprehension Worksheets",
          description: "Practice worksheets for improving reading skills",
          fileUrl: "https://example.com/worksheets.doc",
          fileName: "Reading_Worksheets.docx",
          fileType: "application/msword",
          subjectId: subjectId,
          classId: classData.id,
          uploadedBy: teacher.userId,
          isPublic: false,
        },
      }),
    ]);
    console.log(`✅ Created ${resources.length} resources`);

    console.log("\n✨ Sample data seeding completed successfully!\n");

    console.log("Summary:");
    console.log(`📢 Announcements: ${announcements.length}`);
    console.log(`📅 Calendar Events: ${events.length}`);
    console.log(`👥 Behavior Incidents: ${classData.students.length > 0 ? "Created" : "Skipped (no students)"}`);
    console.log(`📚 Resources: ${resources.length}`);
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
