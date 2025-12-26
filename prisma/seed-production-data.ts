import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";

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

async function seedProductionData() {
  const hashedPassword = await bcrypt.hash("School@123", 10);

  try {
    console.log("🌱 Starting production data seed...\n");

    // 1. Create Academic Terms
    console.log("📅 Creating academic terms...");
    const terms = await Promise.all([
      prisma.academicTerm.create({
        data: {
          name: "TERM_1",
          academicYear: "2025",
          startDate: new Date("2025-01-15"),
          endDate: new Date("2025-04-15"),
          openingDate: new Date("2025-01-15"),
          closingDate: new Date("2025-04-15"),
          isActive: true,
        },
      }),
      prisma.academicTerm.create({
        data: {
          name: "TERM_2",
          academicYear: "2025",
          startDate: new Date("2025-05-10"),
          endDate: new Date("2025-08-15"),
          openingDate: new Date("2025-05-10"),
          closingDate: new Date("2025-08-15"),
          isActive: false,
        },
      }),
      prisma.academicTerm.create({
        data: {
          name: "TERM_3",
          academicYear: "2025",
          startDate: new Date("2025-09-05"),
          endDate: new Date("2025-12-15"),
          openingDate: new Date("2025-09-05"),
          closingDate: new Date("2025-12-15"),
          isActive: false,
        },
      }),
    ]);
    console.log(`✅ Created ${terms.length} academic terms\n`);

    // 2. Create Subjects
    console.log("📚 Creating subjects...");
    const subjectData = [
      { name: "Mathematics", code: "MATH" },
      { name: "English", code: "ENG" },
      { name: "Kiswahili", code: "KIS" },
      { name: "Science", code: "SCI" },
      { name: "Social Studies", code: "SST" },
      { name: "Religious Education", code: "CRE" },
      { name: "Physical Education", code: "PE" },
      { name: "Art & Craft", code: "ART" },
      { name: "Music", code: "MUS" },
    ];
    
    const subjects = [];
    for (const sub of subjectData) {
      const existing = await prisma.subject.findFirst({ where: { name: sub.name } });
      if (existing) {
        subjects.push(existing);
      } else {
        const created = await prisma.subject.create({ data: sub });
        subjects.push(created);
      }
    }
    console.log(`✅ Created/Found ${subjects.length} subjects\n`);

    // 3. Create Classes (Baby Class to Grade 9)
    console.log("🏫 Creating classes...");
    const classes = [];
    const grades = ["BABY_CLASS", "PP1", "PP2", "GRADE_1", "GRADE_2", "GRADE_3", 
                    "GRADE_4", "GRADE_5", "GRADE_6", "GRADE_7", "GRADE_8", "GRADE_9"];
    
    for (let i = 0; i < grades.length; i++) {
      const className = await prisma.class.create({
        data: {
          name: `${grades[i].replace(/_/g, " ")} A`,
          gradeLevel: grades[i] as any,
          academicYear: "2025",
          capacity: 40,
        },
      });
      classes.push(className);
    }
    console.log(`✅ Created ${classes.length} classes\n`);

    // 4. Create Teachers
    console.log("👨‍🏫 Creating teachers...");
    const teachers = [];
    const teacherNames = [
      { name: "Jane Smith", subject: "Mathematics" },
      { name: "John Kamau", subject: "English" },
      { name: "Mary Wanjiru", subject: "Kiswahili" },
      { name: "Peter Omondi", subject: "Science" },
      { name: "Grace Akinyi", subject: "Social Studies" },
      { name: "David Mutua", subject: "Religious Education" },
      { name: "Sarah Njeri", subject: "Physical Education" },
      { name: "James Otieno", subject: "Art & Craft" },
    ];

    for (let i = 0; i < teacherNames.length; i++) {
      const teacher = await prisma.user.create({
        data: {
          email: `teacher${i + 1}@engineercentral.edu`,
          password: hashedPassword,
          role: "TEACHER",
          teacher: {
            create: {
              name: teacherNames[i].name,
              employeeNo: `TCH2025${String(i + 1).padStart(3, "0")}`,
              phone: `+25470${String(1000000 + i).substring(1)}`,
              dateOfBirth: new Date(1980 + i, Math.floor(Math.random() * 12), 15),
              gender: i % 2 === 0 ? "FEMALE" : "MALE",
            },
          },
        },
        include: { teacher: true },
      });
      teachers.push(teacher.teacher!);

      // Link teacher to subject
      const subject = subjects.find(s => s.name === teacherNames[i].subject);
      if (subject && teacher.teacher) {
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacher.id,
            subjectId: subject.id,
          },
        });
      }
    }
    console.log(`✅ Created ${teachers.length} teachers\n`);

    // 5. Assign class teachers
    console.log("📝 Assigning class teachers...");
    for (let i = 0; i < Math.min(classes.length, teachers.length); i++) {
      await prisma.class.update({
        where: { id: classes[i].id },
        data: { classTeacherId: teachers[i].id },
      });
    }
    console.log(`✅ Assigned class teachers\n`);

    // 6. Create Parents and Students
    console.log("👨‍👩‍👧‍👦 Creating parents and students...");
    const parentNames = [
      { parent: "Robert & Alice Mwangi", children: ["James Mwangi", "Sarah Mwangi"] },
      { parent: "David & Grace Omondi", children: ["Peter Omondi", "Mary Omondi", "John Omondi"] },
      { parent: "Joseph & Jane Kamau", children: ["Lucy Kamau"] },
      { parent: "Samuel & Ruth Njoroge", children: ["Daniel Njoroge", "Rebecca Njoroge"] },
      { parent: "Michael & Ann Wanjiru", children: ["Kevin Wanjiru"] },
    ];

    let studentCount = 0;
    for (let p = 0; p < parentNames.length; p++) {
      // Create parent
      const parent = await prisma.user.create({
        data: {
          email: `parent${p + 1}@engineercentral.edu`,
          password: hashedPassword,
          role: "PARENT",
          parent: {
            create: {
              name: parentNames[p].parent,
              email: `parent${p + 1}@engineercentral.edu`,
              phone: `+25470${String(2000000 + p).substring(1)}`,
              address: `Nairobi, Kenya - Address ${p + 1}`,
            },
          },
        },
        include: { parent: true },
      });

      // Create children for this parent
      for (let c = 0; c < parentNames[p].children.length; c++) {
        const classIndex = studentCount % classes.length;
        const student = await prisma.user.create({
          data: {
            email: `student${studentCount + 1}@engineercentral.edu`,
            password: hashedPassword,
            role: "STUDENT",
            student: {
              create: {
                name: parentNames[p].children[c],
                admissionNo: `STU2025${String(studentCount + 1).padStart(3, "0")}`,
                dateOfBirth: new Date(2008 + classIndex, Math.floor(Math.random() * 12), 15),
                gender: c % 2 === 0 ? "MALE" : "FEMALE",
                classId: classes[classIndex].id,
                parentId: parent.parent!.id,
              },
            },
          },
          include: { student: true },
        });

        // Create fee balance for each student
        const gradeFees = {
          BABY_CLASS: 35000, PP1: 40000, PP2: 40000,
          GRADE_1: 45000, GRADE_2: 45000, GRADE_3: 50000, GRADE_4: 50000,
          GRADE_5: 55000, GRADE_6: 55000, GRADE_7: 60000, GRADE_8: 60000, GRADE_9: 65000,
        };
        
        const totalFees = gradeFees[classes[classIndex].gradeLevel as keyof typeof gradeFees] || 50000;
        const paidAmount = Math.floor(totalFees * (0.3 + Math.random() * 0.6)); // 30-90% paid
        const statuses = ["PAID", "PARTIAL", "PENDING"];
        const status = paidAmount >= totalFees ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

        await prisma.feeBalance.create({
          data: {
            studentId: student.student!.id,
            totalFees,
            amountPaid: paidAmount,
            balance: totalFees - paidAmount,
            status,
          },
        });

        // Create some fee payments
        if (paidAmount > 0) {
          const paymentMethods = ["M_PESA", "BANK_TRANSFER", "CASH"];
          const numPayments = Math.floor(Math.random() * 3) + 1;
          const paymentPerTransaction = Math.floor(paidAmount / numPayments);

          for (let pay = 0; pay < numPayments; pay++) {
            await prisma.feePayment.create({
              data: {
                studentId: student.student!.id,
                termId: terms[0].id,
                amount: pay === numPayments - 1 ? paidAmount - (paymentPerTransaction * (numPayments - 1)) : paymentPerTransaction,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as any,
                referenceNo: `TXN${Date.now()}${studentCount}${pay}`,
                transactionDate: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
                confirmedBy: "System",
              },
            });
          }
        }

        // Create some attendance records
        const attendanceDates = 20;
        for (let a = 0; a < attendanceDates; a++) {
          const rand = Math.random();
          const status = rand > 0.85 ? "ABSENT" : rand > 0.75 ? "LATE" : "PRESENT";
          await prisma.attendance.create({
            data: {
              studentId: student.student!.id,
              classId: classes[classIndex].id,
              date: new Date(2025, 0, a + 1),
              status: status as any,
              markedBy: teachers[0].id,
            },
          });
        }

        studentCount++;
      }
    }
    console.log(`✅ Created ${parentNames.length} parents and ${studentCount} students\n`);

    // 7. Create Fee Structures
    console.log("💰 Creating fee structures...");
    const feeCategories = ["TUITION", "LIBRARY", "SPORTS", "TRANSPORT", "LUNCH", "EXAMINATION", "UNIFORM"];
    let feeStructureCount = 0;

    for (const classItem of classes) {
      // Base fee calculation based on grade level
      const gradeNum = classItem.gradeLevel.includes("BABY") ? 0 : 
                       classItem.gradeLevel.includes("PP") ? parseInt(classItem.gradeLevel.charAt(2)) :
                       parseInt(classItem.gradeLevel.split("_")[1]);
      const baseFee = 35000 + (gradeNum * 3000);
      
      for (const category of feeCategories) {
        let amount = 0;
        switch (category) {
          case "TUITION": amount = baseFee * 0.6; break;
          case "LIBRARY": amount = 2000; break;
          case "SPORTS": amount = 3000; break;
          case "TRANSPORT": amount = baseFee * 0.15; break;
          case "LUNCH": amount = baseFee * 0.15; break;
          case "EXAMINATION": amount = 5000; break;
          case "UNIFORM": amount = 4000; break;
        }

        await prisma.feeStructure.create({
          data: {
            termId: terms[0].id,
            classId: classItem.id,
            category: category as any,
            amount,
            dueDate: new Date("2025-02-15"),
          },
        });
        feeStructureCount++;
      }
    }
    console.log(`✅ Created ${feeStructureCount} fee structures\n`);

    // 8. Create Staff
    console.log("👔 Creating staff members...");
    const staff = await prisma.user.create({
      data: {
        email: "accountant@engineercentral.edu",
        password: hashedPassword,
        role: "STAFF",
        staff: {
          create: {
            name: "Robert Johnson",
            employeeNo: "STF2025001",
            department: "Finance",
            position: "Senior Accountant",
            phone: "+254703000001",
          },
        },
      },
    });
    console.log(`✅ Created staff member\n`);

    // 9. Create Admin
    console.log("👨‍💼 Creating admin user...");
    const admin = await prisma.user.create({
      data: {
        email: "admin@engineercentral.edu",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`✅ Created admin user\n`);

    // 10. Create Exams and Results
    console.log("📝 Creating exams and results...");
    let examCount = 0;
    let resultCount = 0;
    
    // Create exams for each class (Mid-Term and End-Term for Term 1)
    for (const classItem of classes) {
      // Get students in this class
      const classStudents = await prisma.student.findMany({
        where: { classId: classItem.id },
      });

      if (classStudents.length === 0) continue;

      // Select 5 core subjects for this grade level
      const coreSubjects = subjects.slice(0, 5); // Math, English, Kiswahili, Science, SST

      for (const subject of coreSubjects) {
        // Find a teacher who teaches this subject
        const teacher = teachers.find(t => 
          t.subjects && t.subjects.some((s: any) => s.id === subject.id)
        );

        if (!teacher) continue;

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
    }
    
    console.log(`✅ Created ${examCount} exams and ${resultCount} results\n`);

    console.log("\n🎉 Production data seed completed!\n");
    console.log("📊 Summary:");
    console.log("========================");
    console.log(`Academic Terms: ${terms.length}`);
    console.log(`Subjects: ${subjects.length}`);
    console.log(`Classes: ${classes.length}`);
    console.log(`Teachers: ${teachers.length}`);
    console.log(`Parents: ${parentNames.length}`);
    console.log(`Students: ${studentCount}`);
    console.log(`Fee Structures: ${feeStructureCount}`);
    console.log(`Exams: ${examCount}`);
    console.log(`Results: ${resultCount}`);
    console.log(`Staff: 1`);
    console.log(`Admin: 1`);
    console.log("========================\n");

    console.log("🔐 Login Credentials:");
    console.log("========================");
    console.log("Admin:  admin@engineercentral.edu");
    console.log("Staff:  accountant@engineercentral.edu");
    console.log("Teachers: teacher1@engineercentral.edu to teacher8@engineercentral.edu");
    console.log("Parents: parent1@engineercentral.edu to parent5@engineercentral.edu");
    console.log("Students: student1@engineercentral.edu to student" + studentCount + "@engineercentral.edu");
    console.log("Password for all: School@123");
    console.log("========================\n");

  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("⚠️ Some data already exists. Please reset database first.");
      console.log("Run: npx prisma migrate reset");
    } else {
      console.error("❌ Error seeding data:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedProductionData();
