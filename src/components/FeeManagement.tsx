"use client"

import { useState, useEffect, useMemo } from 'react'

interface StudentFee {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  class: string
  parentName: string
  parentPhone: string
  totalFees: number
  amountPaid: number
  balance: number
  status: string
  busFee: number
  dueDate: string | null
  lastPaymentDate: string | null
}

interface PaymentFormData {
  studentId: string
  amount: string
  method: string
  reference: string
}

type ViewMode = 'grid' | 'table'

export default function FeeManagement() {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState('balance-desc')
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    studentId: '',
    amount: '',
    method: 'MPESA',
    reference: ''
  })

  const [stats, setStats] = useState({
    totalCollected: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0,
    collectionRate: 0,
    totalStudents: 0,
    averageBalance: 0
  })

  const fetchStudentFees = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fees/students?status=${statusFilter}`)
      const data = await res.json()
      // Ensure data is an array
      setStudentFees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching fees:', error)
      setStudentFees([]) // Set to empty array on error
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStudentFees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // Calculate real-time stats
  useEffect(() => {
    if (studentFees.length > 0) {
      const totalCollected = studentFees.reduce((sum, sf) => sum + sf.amountPaid, 0)
      const totalBalance = studentFees.reduce((sum, sf) => sum + sf.balance, 0)
      const totalFees = studentFees.reduce((sum, sf) => sum + sf.totalFees, 0)
      const pending = studentFees.filter(sf => sf.status === 'PARTIAL').reduce((sum, sf) => sum + sf.balance, 0)
      const overdue = studentFees.filter(sf => sf.status === 'UNPAID').reduce((sum, sf) => sum + sf.balance, 0)
      
      setStats({
        totalCollected,
        pending,
        overdue,
        thisMonth: totalCollected * 0.15, // Estimate
        collectionRate: totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0,
        totalStudents: studentFees.length,
        averageBalance: studentFees.length > 0 ? Math.round(totalBalance / studentFees.length) : 0
      })
    }
  }, [studentFees])

  // Handler functions
  const handlePayment = (student: StudentFee) => {
    setSelectedStudent(student);
    setPaymentForm({
      studentId: student.studentId,
      amount: student.balance.toString(),
      method: 'MPESA',
      reference: ''
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!paymentForm.amount || !paymentForm.reference) {
      alert('Please fill all fields');
      return;
    }
    alert(`Payment of KES ${paymentForm.amount} recorded for ${selectedStudent?.studentName}`);
    setShowPaymentModal(false);
    fetchStudentFees();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'UNPAID': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Admission No', 'Student Name', 'Class', 'Total Fees', 'Amount Paid', 'Balance', 'Status'];
    const rows = filteredFees.map(sf => [
      sf.admissionNo, sf.studentName, sf.class, 
      sf.totalFees, sf.amountPaid, sf.balance, sf.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filtered and sorted fees
  const filteredFees = useMemo(() => {
    let filtered = studentFees.filter(sf => {
      const matchesSearch = sf.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sf.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sf.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sf.status === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });

    switch (sortBy) {
      case 'balance-desc': filtered.sort((a, b) => b.balance - a.balance); break;
      case 'balance-asc': filtered.sort((a, b) => a.balance - b.balance); break;
      case 'name-asc': filtered.sort((a, b) => a.studentName.localeCompare(b.studentName)); break;
      case 'class': filtered.sort((a, b) => a.class.localeCompare(b.class)); break;
    }
    return filtered;
  }, [studentFees, searchTerm, sortBy, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
              <p className="text-4xl font-bold text-green-600">{stats.collectionRate}%</p>
              <p className="text-xs text-gray-500 mt-2">{stats.totalStudents} students</p>
            </div>
            <div className="h-20 w-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">📈</span>
            </div>
          </div>
          <div className="mt-4 bg-green-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Collected</span>
              <span className="font-bold text-green-700">KES {stats.totalCollected.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
              <p className="text-4xl font-bold text-yellow-600">KES {Math.round(stats.pending/1000)}K</p>
              <p className="text-xs text-gray-500 mt-2">Partially paid</p>
            </div>
            <div className="h-20 w-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          <div className="mt-4 bg-yellow-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Balance</span>
              <span className="font-bold text-yellow-700">KES {stats.averageBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-red-500 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue Amount</p>
              <p className="text-4xl font-bold text-red-600">KES {Math.round(stats.overdue/1000)}K</p>
              <p className="text-xs text-gray-500 mt-2">Needs attention</p>
            </div>
            <div className="h-20 w-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
          <div className="mt-4 bg-red-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unpaid Students</span>
              <span className="font-bold text-red-700">{studentFees.filter(sf => sf.status === 'UNPAID').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Control Bar */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 rounded-2xl shadow-lg p-6 border border-purple-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search students, admission numbers, or parents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-4 pr-12 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all text-lg shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by payment status"
              className="px-5 py-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <option value="all">📋 All Status</option>
              <option value="paid">✅ Paid</option>
              <option value="partial">⏳ Partial</option>
              <option value="unpaid">❌ Unpaid</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort students by"
              className="px-5 py-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <option value="balance-desc">💰 Highest Balance</option>
              <option value="balance-asc">💵 Lowest Balance</option>
              <option value="name-asc">📝 Name (A-Z)</option>
              <option value="class">🎓 By Class</option>
            </select>

            {/* View Toggle */}
            <div className="flex gap-2 bg-white border-2 border-purple-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎴 Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Table
              </button>
            </div>

            <button
              onClick={exportToCSV}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <span>📥</span> Export
            </button>

            <button
              onClick={() => window.print()}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <span>🖨️</span> Print
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            Showing <span className="text-purple-600 font-bold">{filteredFees.length}</span> of <span className="font-bold">{studentFees.length}</span> students
          </div>
          {searchTerm && (
            <div className="text-sm text-gray-600">
              Searching for: <span className="font-semibold text-purple-600">"{searchTerm}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            </div>
          ) : filteredFees.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-2xl font-bold text-gray-700 mb-2">No students found</div>
              <div className="text-gray-500">Try adjusting your filters or search terms</div>
            </div>
          ) : (
            filteredFees.map((sf) => (
              <div
                key={sf.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden border-t-4 border-purple-500"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{sf.studentName}</h3>
                      <p className="text-purple-100 text-sm">{sf.admissionNo}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sf.status === 'PAID' ? 'bg-green-400 text-green-900' :
                      sf.status === 'PARTIAL' ? 'bg-yellow-400 text-yellow-900' :
                      'bg-red-400 text-red-900'
                    }`}>
                      {sf.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-100">
                    <span>🎓</span>
                    <span className="font-semibold">{sf.class}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Parent Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Parent Contact</div>
                    <div className="font-semibold text-gray-900">{sf.parentName}</div>
                    <div className="text-sm text-gray-600">{sf.parentPhone}</div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Fees:</span>
                      <span className="font-bold text-gray-900">KES {sf.totalFees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount Paid:</span>
                      <span className="font-semibold text-green-600">KES {sf.amountPaid.toLocaleString()}</span>
                    </div>
                    {sf.busFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bus Fee:</span>
                        <span className="font-medium text-purple-600">+KES {sf.busFee.toLocaleString()}/mo</span>
                      </div>
                    )}
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Balance:</span>
                      <span className="font-bold text-xl text-red-600">KES {sf.balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Payment Progress</span>
                      <span>{Math.round((sf.amountPaid / sf.totalFees) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(sf.amountPaid / sf.totalFees) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handlePayment(sf)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>💳</span> Pay Now
                    </button>
                    <button
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>📄</span> Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <h2 className="text-2xl font-bold">Student Fee Records</h2>
            <p className="text-purple-100 mt-1">{filteredFees.length} students • Total Balance: KES {filteredFees.reduce((sum, sf) => sum + sf.balance, 0).toLocaleString()}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600"></div>
                        <p className="text-gray-600 font-medium">Loading fee records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="text-6xl mb-4">📭</div>
                      <div className="text-xl font-bold text-gray-700 mb-2">No records found</div>
                      <div className="text-gray-500">Try adjusting your search or filters</div>
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((sf, index) => (
                    <tr key={sf.id} className="hover:bg-purple-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                            {sf.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{sf.studentName}</div>
                            <div className="text-sm text-gray-500">{sf.admissionNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {sf.class}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{sf.parentName}</div>
                        <div className="text-xs text-gray-500">{sf.parentPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {sf.totalFees.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">
                        {sf.amountPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-lg text-red-600">{sf.balance.toLocaleString()}</div>
                        {sf.busFee > 0 && (
                          <div className="text-xs text-purple-600 font-medium">+{sf.busFee.toLocaleString()}/mo bus</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                (sf.amountPaid / sf.totalFees) * 100 >= 75
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : (sf.amountPaid / sf.totalFees) * 100 >= 50
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-red-500 to-pink-500'
                              }`}
                              style={{ width: `${(sf.amountPaid / sf.totalFees) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            {Math.round((sf.amountPaid / sf.totalFees) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                          sf.status === 'PAID'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300'
                            : sf.status === 'PARTIAL'
                            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-300'
                            : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-300'
                        }`}>
                          {sf.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePayment(sf)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                          >
                            💳 Pay
                          </button>
                          <button
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                          >
                            📄
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full transform transition-all animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 rounded-t-3xl text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">💳 Record Payment</h2>
                  <p className="text-purple-100">Process fee payment securely</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                >
                  <span className="text-3xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Student Info Card */}
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Student Name</div>
                    <div className="font-bold text-gray-900 text-lg">{selectedStudent.studentName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Admission Number</div>
                    <div className="font-bold text-gray-900 text-lg">{selectedStudent.admissionNo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Class</div>
                    <div className="font-semibold text-gray-900">{selectedStudent.class}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Parent Contact</div>
                    <div className="font-semibold text-gray-900">{selectedStudent.parentPhone}</div>
                  </div>
                </div>

                {/* Balance Highlight */}
                <div className="mt-6 bg-white rounded-xl p-4 border-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Outstanding Balance</div>
                      <div className="font-bold text-red-600 text-3xl">KES {selectedStudent.balance.toLocaleString()}</div>
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                  {selectedStudent.busFee > 0 && (
                    <div className="mt-2 text-sm text-purple-600">
                      Includes bus fee: KES {selectedStudent.busFee.toLocaleString()}/month
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    💵 Payment Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 focus:outline-none text-2xl font-bold text-gray-900 transition-all"
                    placeholder="0.00"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: Math.round(selectedStudent.balance * 0.25).toString() })}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: Math.round(selectedStudent.balance * 0.5).toString() })}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: Math.round(selectedStudent.balance * 0.75).toString() })}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: selectedStudent.balance.toString() })}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                    >
                      Full Payment
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    💳 Payment Method
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { value: 'MPESA', label: 'M-PESA', icon: '📱', color: 'from-green-500 to-emerald-500' },
                      { value: 'BANK', label: 'Bank', icon: '🏦', color: 'from-blue-500 to-cyan-500' },
                      { value: 'CASH', label: 'Cash', icon: '💵', color: 'from-yellow-500 to-orange-500' },
                      { value: 'CARD', label: 'Card', icon: '💳', color: 'from-purple-500 to-pink-500' },
                      { value: 'CHEQUE', label: 'Cheque', icon: '📝', color: 'from-gray-500 to-gray-600' },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentForm({ ...paymentForm, method: method.value })}
                        className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                          paymentForm.method === method.value
                            ? `bg-gradient-to-r ${method.color} text-white border-transparent shadow-lg`
                            : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="text-xs font-bold">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    🔢 Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:ring-4 focus:ring-purple-100 focus:outline-none font-semibold text-gray-900 transition-all"
                    placeholder="Enter M-PESA code, check number, or transaction ID"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white rounded-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center gap-2"
                >
                  <span>✓</span> Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
