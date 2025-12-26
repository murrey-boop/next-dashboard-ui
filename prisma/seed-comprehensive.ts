import { PrismaClient, UserRole, Gender, GradeLevel, BusStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      admin: {
        create: {
          name: 'System Administrator',
          phone: '+254700000000',
        },
      },
    },
  });

  console.log('✓ Admin user created');

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: 'Mathematics', description: 'Math and Numeracy', code: 'MATH' } }),
    prisma.subject.create({ data: { name: 'English', description: 'English Language', code: 'ENG' } }),
    prisma.subject.create({ data: { name: 'Science', description: 'General Science', code: 'SCI' } }),
    prisma.subject.create({ data: { name: 'Social Studies', description: 'Social Studies', code: 'SST' } }),
    prisma.subject.create({ data: { name: 'Kiswahili', description: 'Kiswahili Language', code: 'KIS' } }),
  ]);

  console.log(`✓ ${subjects.length} subjects created`);

  // Create classes
  const classes = await Promise.all([
    prisma.class.create({ data: { name: 'Grade 1A', gradeLevel: GradeLevel.GRADE_1, capacity: 40, academicYear: '2024/2025' } }),
    prisma.class.create({ data: { name: 'Grade 1B', gradeLevel: GradeLevel.GRADE_1, capacity: 40, academicYear: '2024/2025' } }),
    prisma.class.create({ data: { name: 'Grade 2A', gradeLevel: GradeLevel.GRADE_2, capacity: 40, academicYear: '2024/2025' } }),
    prisma.class.create({ data: { name: 'Grade 3A', gradeLevel: GradeLevel.GRADE_3, capacity: 40, academicYear: '2024/2025' } }),
    prisma.class.create({ data: { name: 'PP1 Blue', gradeLevel: GradeLevel.PP1, capacity: 30, academicYear: '2024/2025' } }),
    prisma.class.create({ data: { name: 'PP2 Red', gradeLevel: GradeLevel.PP2, capacity: 30, academicYear: '2024/2025' } }),
  ]);

  console.log(`✓ ${classes.length} classes created`);

  // Create teachers
  const teacherData = [
    { name: 'John Mwangi', email: 'john.mwangi@school.com', phone: '+254712345678', subjects: [subjects[0].id, subjects[2].id] }, // Math, Science
    { name: 'Mary Achieng', email: 'mary.achieng@school.com', phone: '+254723456789', subjects: [subjects[1].id, subjects[4].id] }, // English, Kiswahili
    { name: 'Peter Kamau', email: 'peter.kamau@school.com', phone: '+254734567890', subjects: [subjects[3].id] }, // Social Studies
    { name: 'Grace Wanjiru', email: 'grace.wanjiru@school.com', phone: '+254745678901', subjects: [subjects[0].id] }, // Math
    { name: 'David Omondi', email: 'david.omondi@school.com', phone: '+254756789012', subjects: [subjects[1].id, subjects[2].id] }, // English, Science
  ];

  const teachers = [];
  for (let i = 0; i < teacherData.length; i++) {
    const td = teacherData[i];
    const teacherPassword = await hash('teacher123', 10);
    const teacher = await prisma.user.create({
      data: {
        email: td.email,
        password: teacherPassword,
        role: UserRole.TEACHER,
        teacher: {
          create: {
            employeeNo: `T${(i + 1).toString().padStart(4, '0')}`,
            name: td.name,
            phone: td.phone,
            subjectsTeaching: {
              create: td.subjects.map(subId => ({
                subjectId: subId,
              })),
            },
            classesTeaching: {
              create: [{
                classId: classes[i % classes.length].id,
                classRef: classes[i % classes.length].name,
              }],
            },
          },
        },
      },
    });
    
    const teacherRecord = await prisma.teacher.findUnique({
      where: { userId: teacher.id },
    });
    
    teachers.push(teacherRecord!);
  }

  console.log(`✓ ${teachers.length} teachers created`);

  // Create parents and students
  const parentData = [
    { parentName: 'James Kimani', email: 'james.kimani@parent.com', phone: '+254700111111', students: 2 },
    { parentName: 'Sarah Njeri', email: 'sarah.njeri@parent.com', phone: '+254700222222', students: 1 },
    { parentName: 'Joseph Otieno', email: 'joseph.otieno@parent.com', phone: '+254700333333', students: 3 },
    { parentName: 'Faith Wambui', email: 'faith.wambui@parent.com', phone: '+254700444444', students: 1 },
    { parentName: 'Michael Mutua', email: 'michael.mutua@parent.com', phone: '+254700555555', students: 2 },
  ];

  const studentNames = [
    'Kevin Kimani', 'Lucy Kimani', 
    'Brian Njoroge',
    'Sharon Otieno', 'Daniel Otieno', 'Emma Otieno',
    'Nancy Wambui',
    'Victor Mutua', 'Joy Mutua',
  ];

  let studentIndex = 0;
  const allStudents = [];

  for (let i = 0; i < parentData.length; i++) {
    const pd = parentData[i];
    const parentPassword = await hash('parent123', 10);
    
    const parent = await prisma.user.create({
      data: {
        email: pd.email,
        password: parentPassword,
        role: UserRole.PARENT,
        parent: {
          create: {
            name: pd.parentName,
            phone: pd.phone,
            email: pd.email,
          },
        },
      },
    });
    
    const parentRecord = await prisma.parent.findUnique({
      where: { userId: parent.id },
    });

    // Create students for this parent
    for (let j = 0; j < pd.students; j++) {
      const studentPassword = await hash('student123', 10);
      const studentName = studentNames[studentIndex];
      const student = await prisma.user.create({
        data: {
          email: studentName.toLowerCase().replace(' ', '.') + '@student.com',
          password: studentPassword,
          role: UserRole.STUDENT,
          student: {
            create: {
              admissionNo: `STD${(studentIndex + 1).toString().padStart(4, '0')}`,
              name: studentName,
              dateOfBirth: new Date('2015-01-01'),
              gender: j % 2 === 0 ? Gender.MALE : Gender.FEMALE,
              classId: classes[studentIndex % classes.length].id,
              parentId: parentRecord!.id,
            },
          },
        },
      });

      const studentRecord = await prisma.student.findUnique({
        where: { userId: student.id },
      });

      allStudents.push(studentRecord!);
      studentIndex++;
    }
  }

  console.log(`✓ ${parentData.length} parents and ${allStudents.length} students created`);

  // Create support staff
  const staffData = [
    { name: 'Alice Muthoni', email: 'alice.muthoni@school.com', phone: '+254711111111', department: 'KITCHEN', salary: 25000 },
    { name: 'John Kipchoge', email: 'john.kipchoge@school.com', phone: '+254722222222', department: 'TRANSPORT', salary: 30000 },
    { name: 'Robert Ochieng', email: 'robert.ochieng@school.com', phone: '+254733333333', department: 'SECURITY', salary: 28000 },
    { name: 'Jane Wanjiku', email: 'jane.wanjiku@school.com', phone: '+254744444444', department: 'CLEANING', salary: 20000 },
    { name: 'Patrick Mwenda', email: 'patrick.mwenda@school.com', phone: '+254755555555', department: 'MAINTENANCE', salary: 32000 },
    { name: 'Margaret Akinyi', email: 'margaret.akinyi@school.com', phone: '+254766666666', department: 'KITCHEN', salary: 24000 },
  ];

  for (let i = 0; i < staffData.length; i++) {
    const sd = staffData[i];
    const staffPassword = await hash('staff123', 10);
    await prisma.user.create({
      data: {
        email: sd.email,
        password: staffPassword,
        role: UserRole.SUPPORT_STAFF,
        name: sd.name,
        employeeNo: `STAFF${(i + 1).toString().padStart(4, '0')}`,
        phone: sd.phone,
        department: sd.department,
        salary: sd.salary,
        hireDate: new Date('2023-01-01'),
        workHistory: [
          { role: sd.department, period: '2023-Present', description: 'Current position' },
        ],
        achievements: [
          { title: 'Employee of the Month', date: '2024-06', description: 'Excellent performance' },
        ],
      },
    });
  }

  console.log(`✓ ${staffData.length} support staff members created`);

  // Create buses
  const busData = [
    { registrationNo: 'KAA 123B', capacity: 45, driverName: 'John Kipchoge', route: 'CBD - Westlands' },
    { registrationNo: 'KBB 456C', capacity: 35, driverName: 'Simon Kamau', route: 'Eastlands - School' },
    { registrationNo: 'KCC 789D', capacity: 50, driverName: 'Paul Omondi', route: 'Karen - Langata' },
  ];

  const buses = [];
  for (const bd of busData) {
    const bus = await prisma.bus.create({
      data: {
        registrationNo: bd.registrationNo,
        capacity: bd.capacity,
        driverName: bd.driverName,
        route: bd.route,
        status: BusStatus.ACTIVE,
      },
    });
    buses.push(bus);
  }

  console.log(`✓ ${buses.length} buses created`);

  // Assign students to buses
  const busAssignments = [];
  const studentsToAssign = Math.min(20, allStudents.length);
  for (let i = 0; i < studentsToAssign; i++) {
    const busAssignment = await prisma.studentBus.create({
      data: {
        studentId: allStudents[i].id,
        busId: buses[i % buses.length].id,
        feeAmount: 5000, // KES 5000 monthly bus fee
      },
    });
    busAssignments.push(busAssignment);
  }

  console.log(`✓ ${busAssignments.length} bus assignments created`);

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'School Reopening Reminder',
        content: 'School reopens on Monday, January 8th, 2024. Please ensure your child is ready.',
        priority: 'IMPORTANT',
        createdAt: new Date('2024-01-05'),
      },
      {
        title: 'Parent-Teacher Meeting',
        content: 'There will be a parent-teacher meeting on January 20th at 2:00 PM in the school hall.',
        priority: 'NORMAL',
        createdAt: new Date('2024-01-10'),
      },
      {
        title: 'Fee Payment Deadline',
        content: 'All fees must be paid by January 31st to avoid late payment penalties.',
        priority: 'URGENT',
        createdAt: new Date('2024-01-15'),
      },
      {
        title: 'Sports Day Announcement',
        content: 'Annual sports day will be held on March 15th. All parents are invited to attend.',
        priority: 'NORMAL',
        createdAt: new Date('2024-02-01'),
      },
    ],
  });

  console.log('✓ Announcements created');

  // Create calendar events
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: 'Mid-Term Exams',
        description: 'Mid-term examinations for all grades',
        eventDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-14'),
        eventType: 'EXAM',
        createdBy: admin.id,
      },
      {
        title: 'Sports Day',
        description: 'Annual inter-house sports competition',
        eventDate: new Date('2024-03-15'),
        eventType: 'SPORTS',
        createdBy: admin.id,
      },
      {
        title: 'Parent Meeting',
        description: 'Quarterly parent-teacher meeting',
        eventDate: new Date('2024-01-20'),
        eventType: 'MEETING',
        createdBy: admin.id,
      },
      {
        title: 'Public Holiday',
        description: 'School closed for public holiday',
        eventDate: new Date('2024-01-01'),
        eventType: 'HOLIDAY',
        createdBy: admin.id,
      },
    ],
  });

  console.log('✓ Calendar events created');

  // Create resources
  await prisma.resource.createMany({
    data: [
      {
        title: 'Mathematics Grade 1 Workbook',
        description: 'Comprehensive math exercises for Grade 1',
        fileType: 'PDF',
        fileName: 'math_grade1.pdf',
        subjectId: subjects[0].id,
        classId: classes[0].id,
        uploadedBy: teachers[0].id,
        isPublic: true,
      },
      {
        title: 'English Reading Materials',
        description: 'Collection of reading passages and comprehension questions',
        fileType: 'PDF',
        fileName: 'english_reading.pdf',
        subjectId: subjects[1].id,
        uploadedBy: teachers[1].id,
        isPublic: true,
      },
      {
        title: 'Science Experiment Videos',
        description: 'Educational science experiment demonstrations',
        fileType: 'VIDEO',
        fileUrl: 'https://example.com/science-videos',
        subjectId: subjects[2].id,
        uploadedBy: teachers[0].id,
        isPublic: true,
      },
    ],
  });

  console.log('✓ Resources created');

  // Create behavior incidents
  for (let i = 0; i < 5; i++) {
    await prisma.behaviorIncident.create({
      data: {
        studentId: allStudents[i].id,
        teacherId: teachers[i % teachers.length].id,
        incidentType: i % 2 === 0 ? 'POSITIVE' : 'NEGATIVE',
        category: 'ACADEMIC',
        title: i % 2 === 0 ? 'Excellent Performance' : 'Late Submission',
        description: i % 2 === 0 
          ? 'Student showed exceptional performance in class' 
          : 'Student submitted homework late without valid reason',
        severity: i % 2 === 0 ? 'LOW' : 'MEDIUM',
        incidentDate: new Date(),
      },
    });
  }

  console.log('✓ Behavior incidents created');

  // Create lessons
  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    await prisma.lesson.create({
      data: {
        dayOfWeek: (i % 5) + 1, // Monday = 1 to Friday = 5
        startTime: `0${8 + i}:00`,
        endTime: `0${9 + i}:00`,
        subjectId: subjects[i % subjects.length].id,
        classId: classes[i % classes.length].id,
        teacherId: teacher.id,
        room: `Room ${100 + i}`,
      },
    });
  }

  console.log('✓ Lessons created');

  // Create fee balances
  for (const student of allStudents.slice(0, 5)) {
    await prisma.feeBalance.create({
      data: {
        studentId: student.id,
        totalFees: 45000,
        amountPaid: 30000,
        balance: 15000,
      },
    });
  }

  console.log('✓ Fee balances created');

  console.log('🎉 Comprehensive seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - 1 Admin`);
  console.log(`   - ${teachers.length} Teachers`);
  console.log(`   - ${allStudents.length} Students`);
  console.log(`   - ${parentData.length} Parents`);
  console.log(`   - ${staffData.length} Support Staff`);
  console.log(`   - ${buses.length} Buses`);
  console.log(`   - ${busAssignments.length} Bus Assignments`);
  console.log(`   - ${subjects.length} Subjects`);
  console.log(`   - ${classes.length} Classes`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin: admin@school.com / admin123');
  console.log('   Teacher: john.mwangi@school.com / teacher123');
  console.log('   Student: kevin.kimani@student.com / student123');
  console.log('   Parent: james.kimani@parent.com / parent123');
  console.log('   Staff: alice.muthoni@school.com / staff123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
