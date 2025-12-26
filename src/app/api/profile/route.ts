import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Fetch user with role-specific data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        parent:
          userRole === "parent"
            ? {
                include: {
                  students: {
                    include: {
                      class: true,
                    },
                  },
                },
              }
            : undefined,
        teacher:
          userRole === "teacher"
            ? {
                include: {
                  subjects: {
                    include: {
                      subject: true,
                    },
                  },
                  classes: {
                    include: {
                      class: true,
                    },
                  },
                },
              }
            : undefined,
        admin: userRole === "admin" ? true : undefined,
        student:
          userRole === "student"
            ? {
                include: {
                  class: true,
                  parent: true,
                },
              }
            : undefined,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format response based on role
    const profileData: any = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      address: user.address || "",
      photo: user.photo,
      role: userRole,
    };

    if (userRole === "parent" && user.parent) {
      profileData.children = user.parent.students.map((student) => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        className: student.class.name,
        photo: student.photo,
      }));
    }

    if (userRole === "teacher" && user.teacher) {
      profileData.subjects = user.teacher.subjects.map((ts) => ({
        id: ts.subject.id,
        name: ts.subject.name,
      }));
      profileData.classes = user.teacher.classes.map((tc) => ({
        id: tc.class.id,
        name: tc.class.name,
      }));
    }

    if (userRole === "student" && user.student) {
      profileData.admissionNumber = user.student.admissionNumber;
      profileData.className = user.student.class.name;
      profileData.parentName = user.student.parent
        ? `${user.student.parent.firstName} ${user.student.parent.lastName}`
        : "N/A";
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, address, email } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone,
        address,
        email,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        address: updatedUser.address,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
