"use client"

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/parent",
        visible: ["parent"],
      },
      {
        icon: "/home.png",
        label: "Home",
        href: "/admin",
        visible: ["admin"],
      },
      {
        icon: "/home.png",
        label: "Home",
        href: "/teacher",
        visible: ["teacher"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/teacher/assignments",
        visible: ["teacher"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/teacher/attendance",
        visible: ["teacher"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/teacher/exams",
        visible: ["teacher"],
      },
      {
        icon: "/student.png",
        label: "My Students",
        href: "/teacher/students",
        visible: ["teacher"],
      },
      {
        icon: "/class.png",
        label: "My Classes",
        href: "/teacher/classes",
        visible: ["teacher"],
      },
      {
        icon: "/calendar.png",
        label: "Schedule",
        href: "/teacher/schedule",
        visible: ["teacher"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/teacher/announcements",
        visible: ["teacher"],
      },
      {
        icon: "/student.png",
        label: "Behavior",
        href: "/teacher/behavior",
        visible: ["teacher"],
      },
      {
        icon: "/subject.png",
        label: "Resources",
        href: "/teacher/resources",
        visible: ["teacher"],
      },
      {
        icon: "/result.png",
        label: "Gradebook",
        href: "/teacher/gradebook",
        visible: ["teacher"],
      },
      {
        icon: "/finance.png",
        label: "Reports",
        href: "/teacher/reports",
        visible: ["teacher"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/admin/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Buses",
        href: "/admin/buses",
        visible: ["admin"],
      },
      {
        icon: "/calendar.png",
        label: "Schedules",
        href: "/admin/schedules",
        visible: ["admin"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/admin/announcements",
        visible: ["admin"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/admin/events",
        visible: ["admin"],
      },
      {
        icon: "/subject.png",
        label: "Resources",
        href: "/admin/resources",
        visible: ["admin"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/parent/results",
        visible: ["parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/parent/attendance",
        visible: ["parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/parent/events",
        visible: ["parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/parent/announcements",
        visible: ["parent"],
      },
      {
        icon: "/student.png",
        label: "Behavior",
        href: "/parent/behavior",
        visible: ["parent"],
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/parent/assignments",
        visible: ["parent"],
      },
      {
        icon: "/finance.png",
        label: "Fees",
        href: "/parent/fees",
        visible: ["parent"],
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        icon: "/finance.png",
        label: "Fee Management",
        href: "/admin/fees",
        visible: ["admin"],
      },
      {
        icon: "/subject.png",
        label: "Subject Management",
        href: "/admin/subjects",
        visible: ["admin"],
      },
      {
        icon: "/profile.png",
        label: "Account Management",
        href: "/admin/accounts",
        visible: ["admin"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/api/auth/signout",
        visible: ["admin", "teacher", "parent"],
      },
    ],
  },
];

const Menu = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase();

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      signOut({ callbackUrl: "/sign-in" });
    }
  };

  useEffect(() => {
    if (menuRef.current) {
      const items = menuRef.current.querySelectorAll('.menu-item');
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out"
        }
      );
    }
  }, []);

  return (
    <div ref={menuRef} className="mt-4 text-sm">
      {menuItems.map((section) => {
        // Filter items based on user role
        const visibleItems = section.items.filter((item) =>
          userRole && item.visible.includes(userRole)
        );

        // Don't show section if no items are visible
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="flex flex-col gap-2">
            <span className="hidden lg:block text-gray-400 font-light px-4 mt-4">
              {section.title}
            </span>
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              const isLogout = item.label === "Logout";
              
              if (isLogout) {
                return (
                  <button
                    key={item.label}
                    onClick={handleLogout}
                    className="menu-item flex items-center lg:justify-start justify-center gap-3 p-3 rounded-md mt-2 transition-all hover:bg-lamaSkyLight w-full text-left"
                  >
                    <Image src={item.icon} alt={item.label} width={20} height={20} />
                    <span className="hidden lg:block">{item.label}</span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`menu-item flex items-center lg:justify-start justify-center gap-3 p-3 rounded-md mt-2 transition-all ${
                    isActive
                      ? "bg-lamaSky text-gray-900 font-semibold"
                      : "hover:bg-lamaSkyLight"
                  }`}
                >
                  <Image src={item.icon} alt={item.label} width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Menu;