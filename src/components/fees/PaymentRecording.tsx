"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Student = {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
};

type PaymentMethod = "M_PESA" | "BANK_TRANSFER" | "CASH" | "CHEQUE";

export default function PaymentRecording() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    termId: "",
    amount: "",
    paymentMethod: "M_PESA" as PaymentMethod,
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [terms, setTerms] = useState<{ id: string; name: string }[]>([]);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedStudent && formData.termId) {
      fetchBalance();
    }
  }, [selectedStudent, formData.termId]);

  const fetchTerms = async () => {
    try {
      const res = await fetch("/api/terms");
      if (res.ok) setTerms(await res.json());
    } catch (error) {
      console.error("Failed to fetch terms");
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudents([]);
      return;
    }

    try {
      const res = await fetch(`/api/students/search?q=${query}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Failed to search students");
    }
  };

  const fetchBalance = async () => {
    if (!selectedStudent || !formData.termId) return;

    try {
      const res = await fetch(
        `/api/fees/balances?studentId=${selectedStudent.id}&termId=${formData.termId}`
      );
      if (res.ok) {
        const data = await res.json();
        setBalance(data[0] || null);
      }
    } catch (error) {
      console.error("Failed to fetch balance");
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm(student.name);
    setStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    setLoading(true);

    const payload = {
      studentId: selectedStudent.id,
      termId: formData.termId,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      transactionRef: formData.transactionRef,
      paymentDate: formData.paymentDate,
      description: formData.description,
    };

    try {
      const res = await fetch("/api/fees/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to record payment");
      }

      const payment = await res.json();

      toast.success("Payment recorded successfully");
      
      // Generate receipt
      generateReceipt(payment);
      
      // Reset form
      resetForm();
      
      // Refresh balance
      fetchBalance();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = (payment: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("ENGINEER CENTRAL SCHOOLS", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("FEE PAYMENT RECEIPT", 105, 30, { align: "center" });
    
    // Receipt details
    doc.setFontSize(10);
    doc.text(`Receipt No: ${payment.id.slice(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 20, 60);
    
    doc.text(`Student: ${selectedStudent?.name}`, 20, 75);
    doc.text(`Admission No: ${selectedStudent?.admissionNumber}`, 20, 85);
    doc.text(`Class: ${selectedStudent?.className}`, 20, 95);
    
    doc.text(`Term: ${terms.find(t => t.id === formData.termId)?.name}`, 20, 110);
    doc.text(`Amount Paid: KES ${Number(formData.amount).toLocaleString()}`, 20, 120);
    doc.text(`Payment Method: ${formData.paymentMethod.replace('_', ' ')}`, 20, 130);
    doc.text(`Transaction Ref: ${formData.transactionRef || 'N/A'}`, 20, 140);
    
    if (balance) {
      doc.text(`Previous Balance: KES ${(balance.totalFees - balance.paidAmount).toLocaleString()}`, 20, 155);
      doc.text(`Amount Paid: KES ${Number(formData.amount).toLocaleString()}`, 20, 165);
      doc.text(`New Balance: KES ${Math.max(0, (balance.totalFees - balance.paidAmount - Number(formData.amount))).toLocaleString()}`, 20, 175);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text("This is a computer-generated receipt", 105, 280, { align: "center" });
    
    // Download
    doc.save(`receipt-${payment.id.slice(0, 8)}.pdf`);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchTerm("");
    setFormData({
      termId: "",
      amount: "",
      paymentMethod: "M_PESA",
      transactionRef: "",
      paymentDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setBalance(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Record Fee Payment</h2>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
        {/* Student Search */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">
            Search Student
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchStudents(e.target.value);
            }}
            placeholder="Enter student name or admission number..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
          
          {students.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">
                    {student.admissionNumber} - {student.className}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedStudent && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Selected Student</h3>
            <p><strong>Name:</strong> {selectedStudent.name}</p>
            <p><strong>Admission No:</strong> {selectedStudent.admissionNumber}</p>
            <p><strong>Class:</strong> {selectedStudent.className}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Term</label>
            <select
              value={formData.termId}
              onChange={(e) =>
                setFormData({ ...formData, termId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          {balance && (
            <div className="col-span-2 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Fee Balance</h4>
              <p><strong>Total Fees:</strong> KES {balance.totalFees.toLocaleString()}</p>
              <p><strong>Paid Amount:</strong> KES {balance.paidAmount.toLocaleString()}</p>
              <p className="text-lg font-bold text-red-600">
                <strong>Balance:</strong> KES {(balance.totalFees - balance.paidAmount).toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Amount (KES)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentMethod: e.target.value as PaymentMethod,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="M_PESA">M-PESA</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Transaction Reference
            </label>
            <input
              type="text"
              value={formData.transactionRef}
              onChange={(e) =>
                setFormData({ ...formData, transactionRef: e.target.value })
              }
              placeholder="e.g., PKL1234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentDate: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Additional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition"
            >
              {loading ? "Recording..." : "Record Payment & Generate Receipt"}
            </button>
            {selectedStudent && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
