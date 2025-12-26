import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));
    
    if (!session || !session.user?.id) {
      console.log("No session or user ID");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (session.user.role !== "TEACHER") {
      console.log("User role is:", session.user.role);
      return NextResponse.json({ error: "Unauthorized - Not a teacher" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Finding teacher with userId:", userId);

    // Get teacher with classes and subjects
    const teacher = await prisma.teacher.findUnique({
      where: { userId: userId },
      include: {
        classesTeaching: true,
        subjectsTeaching: {
          include: {
            subject: true,
          },
        },
        assignments: {
          include: {
            submissions: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Get classes with student counts
    const classIds = teacher.classesTeaching.map(tc => tc.classId);
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      include: {
        students: true,
      },
    });

    // Calculate stats
    const totalClasses = classes.length;
    const totalStudents = classes.reduce(
      (sum, cls) => sum + cls.students.length,
      0
    );

    const totalAssignments = teacher.assignments.length;
    const pendingGrading = teacher.assignments.reduce(
      (sum, assignment) =>
        sum +
        assignment.submissions.filter((sub) => sub.marks === null).length,
      0
    );

    // Get today's date for attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get recent submissions (last 7 days)
    const recentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          teacherId: teacher.id,
        },
        submittedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        student: true,
        assignment: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 10,
    });

    // Format classes data
    const classesData = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      capacity: cls.capacity,
      studentCount: cls.students.length,
    }));

    // Get subjects taught
    const subjects = teacher.subjectsTeaching.map((ts) => ({
      id: ts.subject.id,
      name: ts.subject.name,
      code: ts.subject.code,
    }));

    return NextResponse.json({
      teacher: {
        name: teacher.name,
        employeeNo: teacher.employeeNo,
        photo: teacher.photo,
      },
      stats: {
        totalClasses,
        totalStudents,
        totalAssignments,
        pendingGrading,
      },
      classes: classesData,
      subjects,
      recentSubmissions: recentSubmissions.map((sub) => ({
        id: sub.id,
        studentName: `${sub.student.firstName} ${sub.student.lastName}`,
        assignmentTitle: sub.assignment.title,
        subjectName: sub.assignment.subject.name,
        className: sub.assignment.class.name,
        submittedAt: sub.submittedAt,
        isGraded: sub.marks !== null,
      })),
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
