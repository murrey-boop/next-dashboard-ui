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

    // Get parent's children and their results
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            class: {
              select: {
                name: true,
                gradeLevel: true,
              },
            },
            results: {
              include: {
                exam: {
                  include: {
                    subject: {
                      select: {
                        name: true,
                        code: true,
                      },
                    },
                    class: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                subject: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
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

    // Group results by student and calculate statistics
    const studentsWithResults = parent.students.map((student) => {
      const results = student.results;
      const totalExams = results.length;
      
      // Calculate average marks
      const totalMarks = results.reduce((sum, r) => sum + Number(r.marks), 0);
      const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;
      
      // Calculate grade distribution
      const gradeDistribution: { [key: string]: number } = {};
      results.forEach((result) => {
        if (result.grade) {
          gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
        }
      });

      // Group results by exam
      const examResults = results.reduce((acc, result) => {
        const examId = result.exam.id;
        if (!acc[examId]) {
          acc[examId] = {
            examId: result.exam.id,
            examTitle: result.exam.title,
            examDate: result.exam.examDate,
            className: result.exam.class.name,
            totalMarks: result.exam.totalMarks,
            results: [],
          };
        }
        acc[examId].results.push({
          id: result.id,
          subjectName: result.subject.name,
          subjectCode: result.subject.code,
          marks: Number(result.marks),
          grade: result.grade,
          remarks: result.remarks,
        });
        return acc;
      }, {} as any);

      return {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        class: student.class,
        stats: {
          totalExams,
          averageMarks: Math.round(averageMarks * 10) / 10,
          gradeDistribution,
        },
        exams: Object.values(examResults),
        allResults: results.map((r) => ({
          id: r.id,
          examTitle: r.exam.title,
          examDate: r.exam.examDate,
          subjectName: r.subject.name,
          subjectCode: r.subject.code,
          marks: Number(r.marks),
          totalMarks: r.exam.totalMarks,
          grade: r.grade,
          remarks: r.remarks,
        })),
      };
    });

    return NextResponse.json({
      students: studentsWithResults,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results data" },
      { status: 500 }
    );
  }
}
