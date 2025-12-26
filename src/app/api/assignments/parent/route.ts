import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get parent's children and their assignments
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            class: {
              include: {
                assignments: {
                  include: {
                    subject: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                    teacher: {
                      select: {
                        name: true,
                      },
                    },
                    submissions: {
                      where: {
                        studentId: {
                          in: [], // Will be populated below
                        },
                      },
                      select: {
                        id: true,
                        studentId: true,
                        submittedAt: true,
                        marks: true,
                        feedback: true,
                      },
                    },
                  },
                  orderBy: {
                    dueDate: "desc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent profile not found" },
        { status: 404 }
      );
    }

    // Get student IDs
    const studentIds = parent.students.map((s) => s.id);

    // Fetch assignments for each student with their submissions
    const studentsWithAssignments = await Promise.all(
      parent.students.map(async (student) => {
        const assignments = await prisma.assignment.findMany({
          where: {
            classId: student.classId,
          },
          include: {
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
            teacher: {
              select: {
                name: true,
              },
            },
            submissions: {
              where: {
                studentId: student.id,
              },
              select: {
                id: true,
                submittedAt: true,
                marks: true,
                feedback: true,
              },
            },
          },
          orderBy: {
            dueDate: "desc",
          },
        });

        return {
          studentId: student.id,
          studentName: student.name,
          admissionNo: student.admissionNo,
          className: student.class.name,
          gradeLevel: student.class.gradeLevel,
          assignments: assignments.map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            subjectName: assignment.subject.name,
            subjectCode: assignment.subject.code,
            teacherName: assignment.teacher.name,
            dueDate: assignment.dueDate,
            totalMarks: assignment.totalMarks,
            createdAt: assignment.createdAt,
            submission: assignment.submissions[0] || null,
            status: getAssignmentStatus(assignment.dueDate, assignment.submissions[0]),
          })),
        };
      })
    );

    return NextResponse.json({
      students: studentsWithAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

function getAssignmentStatus(dueDate: Date, submission: any): string {
  if (submission?.submittedAt) {
    if (submission.marks !== null) {
      return "GRADED";
    }
    return "SUBMITTED";
  }
  
  if (new Date() > new Date(dueDate)) {
    return "OVERDUE";
  }
  
  return "PENDING";
}
