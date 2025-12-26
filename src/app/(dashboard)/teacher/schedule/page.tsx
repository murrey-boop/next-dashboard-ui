"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

type ScheduleItem = {
  id: string;
  day: string;
  time: string;
  subject: string;
  class: string;
  room?: string;
};

export default function TeacherSchedule() {
  const { data: session, status } = useSession();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const times = [
    "8:00 - 9:00 AM",
    "9:00 - 10:00 AM",
    "10:00 - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 - 1:00 PM",
    "1:00 - 2:00 PM",
    "2:00 - 3:00 PM",
    "3:00 - 4:00 PM",
  ];

  useEffect(() => {
    if (status === "authenticated") {
      fetchSchedule();
    }
  }, [status]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/teacher/schedule");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setSchedule(data.schedule);
    } catch (error) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDayAndTime = (day: string, time: string) => {
    return schedule.find((item) => item.day === day && item.time === time);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Weekly Class Schedule", 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Teacher: ${session?.user?.name || "N/A"}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Table data
    const tableData: any[] = [];
    times.forEach((time) => {
      const row = [time];
      days.forEach((day) => {
        const item = getScheduleForDayAndTime(day, time);
        if (item) {
          row.push(`${item.subject}\n${item.class}\n${item.room || ""}`);
        } else {
          row.push("-");
        }
      });
      tableData.push(row);
    });

    // Generate table
    (doc as any).autoTable({
      startY: 40,
      head: [["Time", ...days]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 35 },
      },
    });

    // Save PDF
    doc.save(`schedule-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Schedule downloaded!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
          <p className="text-gray-600 mt-1">Your class timetable</p>
        </div>
        <button
          onClick={generatePDF}
          className="bg-lamaSky text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
        >
          <span>📄</span> Download PDF
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-lamaSky text-white">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border border-gray-300 px-4 py-3 text-center font-semibold"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time, timeIdx) => (
              <tr key={timeIdx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50">
                  {time}
                </td>
                {days.map((day) => {
                  const item = getScheduleForDayAndTime(day, time);
                  return (
                    <td
                      key={`${day}-${timeIdx}`}
                      className="border border-gray-300 px-4 py-3 text-center"
                    >
                      {item ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-blue-600">
                            {item.subject}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.class}
                          </div>
                          {item.room && (
                            <div className="text-xs text-gray-500">
                              {item.room}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Schedule Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Total Periods: {schedule.length}</li>
          <li>• Subjects Teaching: {new Set(schedule.map(s => s.subject)).size}</li>
          <li>• Classes: {new Set(schedule.map(s => s.class)).size}</li>
        </ul>
      </div>
    </div>
  );
}
