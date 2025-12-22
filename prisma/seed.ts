import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create default admin
  const hashedPassword = await hash('School@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@engineercentral.edu' },
    update: {},
    create: {
      email: 'admin@engineercentral.edu',
      password: hashedPassword,
      role: UserRole.ADMIN,
      admin: {
        create: {
          name: 'System Administrator',
          phone: '+254700000000',
        },
      },
    },
  });

  console.log('✅ Admin created:', adminUser.email);

  // Create academic terms for 2024/2025
  const term1 = await prisma.academicTerm.upsert({
    where: {
      name_academicYear: {
        name: 'TERM_1',
        academicYear: '2024/2025',
      },
    },
    update: {},
    create: {
      name: 'TERM_1',
      academicYear: '2024/2025',
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-03-28'),
      openingDate: new Date('2025-01-06'),
      closingDate: new Date('2025-03-28'),
      isActive: true,
    },
  });

  const term2 = await prisma.academicTerm.upsert({
    where: {
      name_academicYear: {
        name: 'TERM_2',
        academicYear: '2024/2025',
      },
    },
    update: {},
    create: {
      name: 'TERM_2',
      academicYear: '2024/2025',
      startDate: new Date('2025-05-05'),
      endDate: new Date('2025-07-25'),
      openingDate: new Date('2025-05-05'),
      closingDate: new Date('2025-07-25'),
      isActive: false,
    },
  });

  const term3 = await prisma.academicTerm.upsert({
    where: {
      name_academicYear: {
        name: 'TERM_3',
        academicYear: '2024/2025',
      },
    },
    update: {},
    create: {
      name: 'TERM_3',
      academicYear: '2024/2025',
      startDate: new Date('2025-09-08'),
      endDate: new Date('2025-11-21'),
      openingDate: new Date('2025-09-08'),
      closingDate: new Date('2025-11-21'),
      isActive: false,
    },
  });

  console.log('✅ Academic terms created');

  // Create sample classes
  const classes = [
    { name: 'Baby Class A', gradeLevel: 'BABY_CLASS' },
    { name: 'PP1 Blue', gradeLevel: 'PP1' },
    { name: 'PP2 Red', gradeLevel: 'PP2' },
    { name: 'Grade 1A', gradeLevel: 'GRADE_1' },
    { name: 'Grade 2A', gradeLevel: 'GRADE_2' },
    { name: 'Grade 3A', gradeLevel: 'GRADE_3' },
    { name: 'Grade 4A', gradeLevel: 'GRADE_4' },
    { name: 'Grade 5A', gradeLevel: 'GRADE_5' },
    { name: 'Grade 6A', gradeLevel: 'GRADE_6' },
    { name: 'Grade 7A', gradeLevel: 'GRADE_7' },
    { name: 'Grade 8A', gradeLevel: 'GRADE_8' },
    { name: 'Grade 9A', gradeLevel: 'GRADE_9' },
  ];

  for (const classData of classes) {
    await prisma.class.upsert({
      where: { name: classData.name },
      update: {},
      create: {
        name: classData.name,
        gradeLevel: classData.gradeLevel as any,
        capacity: 40,
        academicYear: '2024/2025',
      },
    });
  }

  console.log('✅ Classes created');

  // Create sample subjects
  const subjects = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English', code: 'ENG' },
    { name: 'Kiswahili', code: 'KISW' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Creative Arts', code: 'CRE' },
    { name: 'Physical Education', code: 'PE' },
    { name: 'Computer Studies', code: 'COMP' },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }

  console.log('✅ Subjects created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
