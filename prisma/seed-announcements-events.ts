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

async function seedAnnouncementsAndEvents() {
  try {
    console.log("📢 Starting announcements and events seed...\n");

    // Create Announcements
    console.log("Creating announcements...");
    const announcements = await Promise.all([
      prisma.announcement.create({
        data: {
          title: "School Reopening - Term 1 2025",
          content: `Dear Parents and Guardians,

We are pleased to inform you that the school will be reopening on Monday, January 15th, 2025 for Term 1.

Please ensure your child:
- Has all the required textbooks and learning materials
- Is in proper school uniform
- Reports by 8:00 AM

Term 1 runs from January 15th to April 15th, 2025.

Thank you for your cooperation.

The Administration`,
          targetRoles: ["PARENT", "STUDENT"],
          priority: "important",
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.announcement.create({
        data: {
          title: "Fee Payment Deadline Extended",
          content: `Dear Parents,

We have extended the fee payment deadline to February 15th, 2025.

Payment can be made via:
- M-PESA: Paybill 247247, Account: Student Admission Number
- Bank Transfer: Account Details on the fee structure
- Cash at the school office (during working hours)

For any inquiries, please contact the accounts office.

Thank you.`,
          targetRoles: ["PARENT"],
          priority: "urgent",
          createdBy: "accountant@engineercentral.edu",
        },
      }),

      prisma.announcement.create({
        data: {
          title: "Parent-Teacher Meeting - February 20th",
          content: `Dear Parents,

You are cordially invited to the Parent-Teacher meeting scheduled for:

Date: February 20th, 2025
Time: 2:00 PM - 5:00 PM
Venue: School Hall

This is an opportunity to discuss your child's academic progress and other matters.

Your presence is highly appreciated.

Thank you.`,
          targetRoles: ["PARENT"],
          priority: "important",
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.announcement.create({
        data: {
          title: "Sports Day Registration Open",
          content: `Dear Students and Parents,

Registration for the Annual Sports Day is now open!

Date: March 15th, 2025
Events: Track & Field, Ball Games, Relay Races

Students interested in participating should register with their PE teacher by February 28th, 2025.

Let's make this year's Sports Day memorable!`,
          targetRoles: ["PARENT", "STUDENT"],
          priority: "normal",
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.announcement.create({
        data: {
          title: "Mid-Term Break Dates",
          content: `Dear Parents and Students,

The Mid-Term Break for Term 1, 2025 is scheduled as follows:

Break Begins: Friday, February 28th, 2025 (after classes)
School Resumes: Monday, March 10th, 2025 at 8:00 AM

Please plan accordingly.

Safe travels!`,
          targetRoles: ["PARENT", "STUDENT"],
          priority: "normal",
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.announcement.create({
        data: {
          title: "Library Books Return Reminder",
          content: `Dear Students and Parents,

This is a reminder to return all borrowed library books by February 10th, 2025.

Overdue books will attract a fine of KES 10 per day.

Please ensure timely returns to avoid penalties.

Thank you.`,
          targetRoles: ["PARENT", "STUDENT"],
          priority: "normal",
          createdBy: "admin@engineercentral.edu",
        },
      }),
    ]);

    console.log(`✅ Created ${announcements.length} announcements\n`);

    // Create Events
    console.log("Creating events...");
    const events = await Promise.all([
      prisma.event.create({
        data: {
          title: "Annual Academic Awards Day",
          description: "Celebration of academic excellence and student achievements for the previous year. Top performers in all grades will be recognized and awarded.",
          eventDate: new Date("2025-02-14"),
          location: "School Hall",
          targetRoles: ["PARENT", "STUDENT", "TEACHER"],
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.event.create({
        data: {
          title: "Parent-Teacher Meeting",
          description: "Discuss student progress, academic performance, and any concerns with class teachers. Individual consultations available.",
          eventDate: new Date("2025-02-20"),
          location: "Respective Classrooms",
          targetRoles: ["PARENT", "TEACHER"],
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.event.create({
        data: {
          title: "Science Fair",
          description: "Students showcase their science projects and experiments. Open to all grades. Parents are welcome to attend.",
          eventDate: new Date("2025-03-05"),
          location: "Science Laboratory & School Grounds",
          targetRoles: ["PARENT", "STUDENT", "TEACHER"],
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.event.create({
        data: {
          title: "Annual Sports Day",
          description: "Inter-house sports competition featuring track and field events, ball games, and relay races. All students participate.",
          eventDate: new Date("2025-03-15"),
          location: "School Sports Field",
          targetRoles: ["PARENT", "STUDENT", "TEACHER"],
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.event.create({
        data: {
          title: "Career Guidance Workshop",
          description: "Professional career counselors will guide students on career paths and subject choices. Parents encouraged to attend.",
          eventDate: new Date("2025-03-22"),
          location: "School Hall",
          targetRoles: ["PARENT", "STUDENT"],
          createdBy: "admin@engineercentral.edu",
        },
      }),

      prisma.event.create({
        data: {
          title: "End of Term 1 Closing Ceremony",
          description: "Official closing of Term 1. Results distribution and awards for outstanding performance during the term.",
          eventDate: new Date("2025-04-15"),
          location: "School Assembly Ground",
          targetRoles: ["PARENT", "STUDENT", "TEACHER"],
          createdBy: "admin@engineercentral.edu",
        },
      }),
    ]);

    console.log(`✅ Created ${events.length} events\n`);

    console.log("\n🎉 Announcements and events seed completed!\n");

  } catch (error: any) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAnnouncementsAndEvents();
