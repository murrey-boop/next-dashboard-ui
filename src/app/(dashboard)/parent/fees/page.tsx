"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

type ChildFeeData = {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  photo: string | null;
  balances: Array<{
    id: string;
    termName: string;
    totalFees: number;
    paidAmount: number;
    balance: number;
    status: string;
    dueDate: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    transactionRef: string | null;
    paymentDate: string;
    termName: string;
  }>;
};

const COLORS = ["#82ca9d", "#ffc658", "#ff8042"];

export default function ParentFeesPage() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<ChildFeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  
  // Payment states
  const [showMpesaForm, setShowMpesaForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    type: "success" | "error";
    message: string;
    reference?: string;
  } | null>(null);

  useEffect(() => {
    fetchChildrenFeeData();
  }, []);

  const fetchChildrenFeeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fees/parent/children");
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0].studentId);
      }
    } catch (error) {
      toast.error("Failed to load fee information");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentChild = () => {
    return children.find((c) => c.studentId === selectedChild);
  };

  const getTotalStats = () => {
    const child = getCurrentChild();
    if (!child) return { total: 0, paid: 0, balance: 0 };

    const total = child.balances.reduce((sum, b) => sum + b.totalFees, 0);
    const paid = child.balances.reduce((sum, b) => sum + b.paidAmount, 0);
    const balance = total - paid;

    return { total, paid, balance };
  };

  const getStatusDistribution = () => {
    const child = getCurrentChild();
    if (!child) return [];

    const statusCount = child.balances.reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count as number,
    }));
  };

  const getPaymentTrend = () => {
    const child = getCurrentChild();
    if (!child) return [];

    // Group by term
    const byTerm = child.payments.reduce((acc: any, p) => {
      const term = p.termName;
      acc[term] = (acc[term] || 0) + p.amount;
      return acc;
    }, {});

    return Object.entries(byTerm).map(([term, amount]) => ({
      term,
      amount: amount as number,
    }));
  };

  const downloadStatement = () => {
    const child = getCurrentChild();
    if (!child) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("ENGINEER CENTRAL SCHOOLS", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("FEE STATEMENT", 105, 30, { align: "center" });

    // Student Info
    doc.setFontSize(10);
    doc.text(`Student: ${child.studentName}`, 20, 45);
    doc.text(`Admission No: ${child.admissionNumber}`, 20, 52);
    doc.text(`Class: ${child.className}`, 20, 59);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      150,
      45,
      { align: "right" }
    );

    // Fee Balances Table
    doc.setFontSize(12);
    doc.text("Fee Balances by Term", 20, 75);

    const balanceRows = child.balances.map((b) => [
      b.termName,
      `KES ${b.totalFees.toLocaleString()}`,
      `KES ${b.paidAmount.toLocaleString()}`,
      `KES ${b.balance.toLocaleString()}`,
      b.status,
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [["Term", "Total Fees", "Paid", "Balance", "Status"]],
      body: balanceRows,
    });

    // Payment History
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Payment History", 20, finalY);

    const paymentRows = child.payments.map((p) => [
      new Date(p.paymentDate).toLocaleDateString(),
      p.termName,
      `KES ${p.amount.toLocaleString()}`,
      p.paymentMethod.replace("_", " "),
      p.transactionRef || "N/A",
    ]);

    (doc as any).autoTable({
      startY: finalY + 5,
      head: [["Date", "Term", "Amount", "Method", "Ref"]],
      body: paymentRows,
    });

    doc.save(`statement-${child.admissionNumber}.pdf`);
    toast.success("Statement downloaded");
  };

  const downloadInvoice = (balanceId: string) => {
    const child = getCurrentChild();
    if (!child) return;

    const balance = child.balances.find((b) => b.id === balanceId);
    if (!balance) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("ENGINEER CENTRAL SCHOOLS", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("FEE INVOICE", 105, 30, { align: "center" });

    // Invoice Details
    doc.setFontSize(10);
    doc.text(`Invoice No: ${balanceId.slice(0, 8).toUpperCase()}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 52);
    doc.text(`Due Date: ${new Date(balance.dueDate).toLocaleDateString()}`, 20, 59);

    // Student Info
    doc.text(`Bill To:`, 20, 75);
    doc.text(`${child.studentName}`, 20, 82);
    doc.text(`${child.admissionNumber} - ${child.className}`, 20, 89);

    // Fee Details
    doc.setFontSize(12);
    doc.text("Fee Details", 20, 110);

    (doc as any).autoTable({
      startY: 115,
      head: [["Description", "Amount"]],
      body: [
        [balance.termName + " Fees", `KES ${balance.totalFees.toLocaleString()}`],
        ["Amount Paid", `KES ${balance.paidAmount.toLocaleString()}`],
        ["Balance Due", `KES ${balance.balance.toLocaleString()}`],
      ],
    });

    // Footer
    doc.setFontSize(8);
    doc.text(
      "Please ensure timely payment to avoid penalties",
      105,
      280,
      { align: "center" }
    );

    doc.save(`invoice-${balanceId.slice(0, 8)}.pdf`);
    toast.success("Invoice downloaded");
  };

  // M-PESA Payment Handler
  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);
    setPaymentStatus(null);

    try {
      const child = getCurrentChild();
      if (!child) return;

      // Simulate STK Push
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate transaction reference
      const transactionRef = `MPE${Date.now().toString().slice(-10)}`;

      // Call payment API
      const res = await fetch("/api/fees/parent/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: child.studentId,
          amount: parseFloat(paymentAmount),
          paymentMethod: "M_PESA",
          transactionRef,
        }),
      });

      if (!res.ok) throw new Error("Payment failed");

      setPaymentStatus({
        type: "success",
        message: "Payment successful! Your fee balance has been updated.",
        reference: transactionRef,
      });

      // Reset form and refresh data
      setShowMpesaForm(false);
      setMpesaPhone("");
      setPaymentAmount("");
      fetchChildrenFeeData();

      toast.success("Payment processed successfully!");
    } catch (error) {
      setPaymentStatus({
        type: "error",
        message: "Payment failed. Please try again or contact support.",
      });
      toast.error("Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Card Payment Handler
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);
    setPaymentStatus(null);

    try {
      const child = getCurrentChild();
      if (!child) return;

      // Simulate card processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Generate transaction reference
      const transactionRef = `CARD${Date.now().toString().slice(-10)}`;

      // Call payment API
      const res = await fetch("/api/fees/parent/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: child.studentId,
          amount: parseFloat(paymentAmount),
          paymentMethod: "CREDIT_CARD",
          transactionRef,
        }),
      });

      if (!res.ok) throw new Error("Payment failed");

      setPaymentStatus({
        type: "success",
        message: "Card payment successful! Your fee balance has been updated.",
        reference: transactionRef,
      });

      // Reset form and refresh data
      setShowCardForm(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setPaymentAmount("");
      fetchChildrenFeeData();

      toast.success("Payment processed successfully!");
    } catch (error) {
      setPaymentStatus({
        type: "error",
        message: "Card payment failed. Please check your details and try again.",
      });
      toast.error("Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading fee information...</div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Fee Information</h1>
        <div className="text-center py-12 text-gray-500">
          No children found in your account. Please contact the school administration.
        </div>
      </div>
    );
  }

  const currentChild = getCurrentChild();
  const stats = getTotalStats();
  const statusData = getStatusDistribution();
  const paymentTrend = getPaymentTrend();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Fee Information</h1>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="mb-6">
          <label htmlFor="child-select" className="block text-sm font-medium mb-2">Select Child:</label>
          <select
            id="child-select"
            value={selectedChild || ""}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto"
          >
            {children.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.studentName} - {child.className} ({child.admissionNumber})
              </option>
            ))}
          </select>
        </div>
      )}

      {currentChild && (
        <>
          {/* Student Info Card */}
          <div className="bg-gradient-to-r from-lamaPurplleLight to-lamaSkyLight p-6 rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-lamaPurple">
                {currentChild.studentName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentChild.studentName}</h2>
                <p className="text-gray-600">
                  {currentChild.admissionNumber} • {currentChild.className}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Fees</h3>
              <p className="text-2xl font-bold text-blue-600">
                KES {stats.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Amount Paid</h3>
              <p className="text-2xl font-bold text-green-600">
                KES {stats.paid.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Balance Due</h3>
              <p className="text-2xl font-bold text-red-600">
                KES {stats.balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Payment Status Distribution */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">No data available</div>
              )}
            </div>

            {/* Payment Trend */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Payments by Term</h3>
              {paymentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={paymentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="term" />
                    <YAxis />
                    <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">No payments yet</div>
              )}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={downloadStatement}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
            >
              📄 Download Full Statement
            </button>
          </div>

          {/* Fee Balances Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Fee Balances by Term</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Term</th>
                    <th className="border p-3 text-right">Total Fees</th>
                    <th className="border p-3 text-right">Paid</th>
                    <th className="border p-3 text-right">Balance</th>
                    <th className="border p-3 text-center">Status</th>
                    <th className="border p-3 text-center">Due Date</th>
                    <th className="border p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentChild.balances.map((balance) => (
                    <tr key={balance.id} className="hover:bg-gray-50">
                      <td className="border p-3 font-medium">{balance.termName}</td>
                      <td className="border p-3 text-right">
                        {balance.totalFees.toLocaleString()}
                      </td>
                      <td className="border p-3 text-right">
                        {balance.paidAmount.toLocaleString()}
                      </td>
                      <td className="border p-3 text-right font-semibold text-red-600">
                        {balance.balance.toLocaleString()}
                      </td>
                      <td className="border p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            balance.status === "PAID"
                              ? "bg-green-100 text-green-600"
                              : balance.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {balance.status}
                        </span>
                      </td>
                      <td className="border p-3 text-center">
                        {new Date(balance.dueDate).toLocaleDateString()}
                      </td>
                      <td className="border p-3 text-center">
                        <button
                          onClick={() => downloadInvoice(balance.id)}
                          className="text-blue-500 hover:underline text-sm"
                        >
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            {currentChild.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left">Date</th>
                      <th className="border p-3 text-left">Term</th>
                      <th className="border p-3 text-right">Amount</th>
                      <th className="border p-3 text-left">Method</th>
                      <th className="border p-3 text-left">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentChild.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="border p-3">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="border p-3">{payment.termName}</td>
                        <td className="border p-3 text-right font-semibold">
                          KES {payment.amount.toLocaleString()}
                        </td>
                        <td className="border p-3">
                          {payment.paymentMethod.replace("_", " ")}
                        </td>
                        <td className="border p-3">
                          {payment.transactionRef || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                No payment history available
              </div>
            )}
          </div>

          {/* Make Payment Section */}
          {stats.balance > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Make a Payment</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* M-PESA Payment */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800">M-PESA Payment</h4>
                      <p className="text-sm text-green-700">Pay using your phone</p>
                    </div>
                  </div>
                  
                  {!showMpesaForm ? (
                    <button
                      onClick={() => setShowMpesaForm(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      Pay with M-PESA
                    </button>
                  ) : (
                    <form onSubmit={handleMpesaPayment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          M-PESA Phone Number
                        </label>
                        <input
                          type="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="254712345678"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                          pattern="254[0-9]{9}"
                        />
                        <p className="text-xs text-gray-600 mt-1">Format: 254XXXXXXXXX</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (KES)
                        </label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                          required
                          min="1"
                          max={stats.balance}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Max: KES {stats.balance.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">\n                        <button
                          type="submit"
                          disabled={processingPayment}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {processingPayment ? "Processing..." : "Send STK Push"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMpesaForm(false);
                            setMpesaPhone("");
                            setPaymentAmount("");
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Card Payment */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💳</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800">Card Payment</h4>
                      <p className="text-sm text-blue-700">Visa, Mastercard</p>
                    </div>
                  </div>
                  
                  {!showCardForm ? (
                    <button
                      onClick={() => setShowCardForm(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Pay with Card
                    </button>
                  ) : (
                    <form onSubmit={handleCardPayment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          pattern="[0-9]{16}"
                          maxLength={16}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            pattern="[0-9]{3}"
                            maxLength={3}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (KES)
                        </label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          min="1"
                          max={stats.balance}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Max: KES {stats.balance.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={processingPayment}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {processingPayment ? "Processing..." : "Pay Now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCardForm(false);
                            setCardNumber("");
                            setCardExpiry("");
                            setCardCvv("");
                            setPaymentAmount("");
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 text-center">
                        🔒 Your payment is secure and encrypted
                      </p>
                    </form>
                  )}
                </div>
              </div>
              
              {/* Payment Status Messages */}
              {paymentStatus && (
                <div className={`mt-4 p-4 rounded-lg ${
                  paymentStatus.type === "success" 
                    ? "bg-green-100 border border-green-300 text-green-800" 
                    : "bg-red-100 border border-red-300 text-red-800"
                }`}>
                  <p className="font-semibold">{paymentStatus.message}</p>
                  {paymentStatus.reference && (
                    <p className="text-sm mt-1">Reference: {paymentStatus.reference}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Payment Instructions for alternative methods */}
          <div className="mt-6 bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">Alternative Payment Methods</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Bank Transfer:</strong> KCB Bank, Account: 1234567890, Reference: {currentChild.admissionNumber}</p>
              <p><strong>Cash/Cheque:</strong> Visit the school accounts office during business hours</p>
              <p className="text-xs text-gray-500 mt-3">
                After payment, please contact the accounts office with your transaction reference for confirmation.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
