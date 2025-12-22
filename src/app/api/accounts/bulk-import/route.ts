import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const role = formData.get("role") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());

    const results = {
      total: lines.length - 1,
      successful: 0,
      failed: 0,
      errors: [] as any[],
    };

    const hashedPassword = await bcrypt.hash("School@123", 10);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      try {
        // Check if email exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email },
        });

        if (existingUser) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            message: `Email ${row.email} already exists`,
          });
          continue;
        }

        if (role === "STUDENT") {
          const user = await prisma.user.create({
            data: {
              email: row.email,
              password: hashedPassword,
              role: "STUDENT",
              student: {
                create: {
                  name: `${row.name} ${row.surname || ""}`.trim(),
                  admissionNo: `STU${Date.now()}${i}`,
                  dateOfBirth: new Date(row.birthday),
                  gender: row.sex === "MALE" ? "MALE" : "FEMALE",
                  address: row.address || null,
                  classId: row.classId,
                  photo: null,
                },
              },
            },
            include: { student: true },
          });

          // Create fee balances
          const terms = await prisma.academicTerm.findMany();
          for (const term of terms) {
            await prisma.feeBalance.create({
              data: {
                studentId: user.student!.id,
                termId: term.id,
                totalFees: 0,
                paidAmount: 0,
                status: "PENDING",
              },
            });
          }

          results.successful++;

        } else if (role === "TEACHER") {
          const user = await prisma.user.create({
            data: {
              email: row.email,
              password: hashedPassword,
              role: "TEACHER",
              teacher: {
                create: {
                  name: `${row.name} ${row.surname || ""}`.trim(),
                  employeeNo: `EMP${Date.now()}${i}`,
                  phone: row.phone || null,
                  address: row.address || null,
                  dateOfBirth: new Date(row.birthday),
                  gender: row.sex === "MALE" ? "MALE" : "FEMALE",
                  photo: null,
                },
              },
            },
            include: { teacher: true },
          });

          // Link subjects if provided
          if (row.subjects) {
            const subjectIds = row.subjects.split(";");
            await Promise.all(
              subjectIds.map((subjectId: string) =>
                prisma.teacherSubject.create({
                  data: {
                    teacherId: user.teacher!.id,
                    subjectId: subjectId.trim(),
                  },
                })
              )
            );
          }

          results.successful++;

        } else if (role === "PARENT") {
          await prisma.user.create({
            data: {
              email: row.email,
              password: hashedPassword,
              role: "PARENT",
              parent: {
                create: {
                  name: row.name,
                  surname: row.surname,
                  email: row.email,
                  phone: row.phone || null,
                  address: row.address || null,
                },
              },
            },
          });

          results.successful++;
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          message: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk import" },
      { status: 500 }
    );
  }
}
