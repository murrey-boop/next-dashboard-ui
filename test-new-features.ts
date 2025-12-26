import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🔍 Checking new tables...\n');

  // Check Announcements
  const announcements = await prisma.announcement.findMany({ take: 5 });
  console.log(`✅ Announcements: ${announcements.length} found`);
  if (announcements.length > 0) {
    console.log('   Sample:', announcements[0]);
  }

  // Check Calendar Events
  const events = await prisma.calendarEvent.findMany({ take: 5 });
  console.log(`✅ Calendar Events: ${events.length} found`);
  if (events.length > 0) {
    console.log('   Sample:', events[0]);
  }

  // Check Behavior Incidents
  const incidents = await prisma.behaviorIncident.findMany({ take: 5 });
  console.log(`✅ Behavior Incidents: ${incidents.length} found`);
  if (incidents.length > 0) {
    console.log('   Sample:', incidents[0]);
  }

  // Check Resources
  const resources = await prisma.resource.findMany({ take: 5 });
  console.log(`✅ Resources: ${resources.length} found`);
  if (resources.length > 0) {
    console.log('   Sample:', resources[0]);
  }

  // Check if teacher has subjects and classes
  const teacher = await prisma.teacher.findFirst({
    include: {
      subjects: true,
      classes: true,
    },
  });
  
  if (teacher) {
    console.log(`\n✅ Sample Teacher: ${teacher.name}`);
    console.log(`   Subjects: ${teacher.subjects.length}`);
    console.log(`   Classes: ${teacher.classes.length}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
