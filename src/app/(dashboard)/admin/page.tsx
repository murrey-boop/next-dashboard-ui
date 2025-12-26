"use client"

import { useState, useEffect } from 'react'
import AttendaceChart from '@/components/AttendaceChart'
import CountChart from '@/components/CountChart'
import FinanceChart from '@/components/FinanceChart'
import UserCard from '@/components/UserCard'
import EventCalendar from '@/components/EventCalendar'
import Announcements from '@/components/Announcements'
import QuickActions from '@/components/QuickActions'
import FeeStats from '@/components/FeeStats'
import FeeManagement from '@/components/FeeManagement'

type TabType = 'overview' | 'staff' | 'fees'

interface StaffMember {
  id: string
  name: string
  employeeNo: string
  email: string
  phone: string | null
  department: string | null
  salary: string | null
  hireDate: string | null
  workHistory: any
  achievements: any
}

interface FeePayment {
  id: string
  studentName: string
  amount: number
  method: string
  date: string
  status: string
  receiptNo: string
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [loading, setLoading] = useState(false)
  const [staffStats, setStaffStats] = useState({
    total: 0,
    teachers: 0,
    support: 0,
    payroll: 0
  })
  const [feeStats, setFeeStats] = useState({
    totalCollected: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0,
    collectionRate: 0
  })

  // Fetch staff data
  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff()
    }
  }, [activeTab])

  // Fetch fee data
  useEffect(() => {
    if (activeTab === 'fees') {
      fetchFees()
    }
  }, [activeTab])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff')
      const data = await res.json()
      // Ensure data is an array
      const staffArray = Array.isArray(data) ? data : []
      setStaff(staffArray)
      
      // Calculate stats
      const teachersRes = await fetch('/api/admin/teachers')
      const teachers = await teachersRes.json()
      const teachersArray = Array.isArray(teachers) ? teachers : []
      const totalPayroll = staffArray.reduce((sum: number, s: StaffMember) => 
        sum + parseFloat(s.salary || '0'), 0)
      
      setStaffStats({
        total: staffArray.length + teachersArray.length,
        teachers: teachersArray.length,
        support: staffArray.length,
        payroll: totalPayroll
      })
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaff([]) // Set to empty array on error
    }
    setLoading(false)
  }

  const fetchFees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/fees/summary')
      const data = await res.json()
      setFeeStats(data.stats || {
        totalCollected: 0,
        pending: 0,
        overdue: 0,
        thisMonth: 0,
        collectionRate: 0
      })
      setPayments(Array.isArray(data.recentPayments) ? data.recentPayments : [])
    } catch (error) {
      console.error('Error fetching fees:', error)
    }
    setLoading(false)
  }

  return (
    <div className='p-4 flex gap-4 flex-col'>
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">Manage your school efficiently</p>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'staff'
              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          👥 Staff Management
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'fees'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          💰 Fee Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className='flex gap-4 flex-col lg:flex-row'>
          {/* LEFT SIDE */ }
          <div className="w-full lg:w-2/3 flex flex-col gap-8">
            {/**USER CARDS */  }
            <div className="flex gap-4 justify-between flex-wrap">
              <UserCard type="Students"/>
              <UserCard type="Teachers" />
              <UserCard type="Parents"/>
              <UserCard type="Staff"/>
            </div>
            
            {/* MIDDLE CHARTS*/ }
            <div className="flex gap-4 flex-col lg:flex-row">
              {/**COUNT CHART */ }
              <div className="w-full lg:w-1/3 h-[450px]">
                <CountChart />
              </div>
              {/**ATTENDANCE CHART */ }
              <div className="w-full lg:w-2/3 h-[450px]">
                <AttendaceChart />
              </div>
            </div>
            
            {/**FINANCE CHART */ }
            <div className="w-full h-[500px]">
              <FinanceChart />
            </div>
          </div>
          
          {/* RIGHT SIDE */ }
          <div className="w-full lg:w-1/3 flex flex-col gap-8">
            <EventCalendar />
            <Announcements />
            <QuickActions />
            <FeeStats />
          </div>
        </div>
      )}

      {/* Staff Management Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Staff Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
              <div className="text-3xl font-bold mb-2">{staffStats.total}</div>
              <div className="text-blue-100">Total Staff</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
              <div className="text-3xl font-bold mb-2">{staffStats.teachers}</div>
              <div className="text-green-100">Teachers</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
              <div className="text-3xl font-bold mb-2">{staffStats.support}</div>
              <div className="text-purple-100">Support Staff</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-xl">
              <div className="text-3xl font-bold mb-2">KES {staffStats.payroll.toLocaleString()}</div>
              <div className="text-orange-100">Monthly Payroll</div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Support Staff Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hire Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Work History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : staff.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No staff members found</td></tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.employeeNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{member.email}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          KES {parseFloat(member.salary || '0').toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {member.hireDate ? new Date(member.hireDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fee Management Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Fee Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold mb-2">KES {feeStats.totalCollected.toLocaleString()}</div>
              <div className="text-green-100">Total Collected</div>
              <div className="mt-2 text-sm text-green-200">{feeStats.collectionRate || 0}% collection rate</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold mb-2">KES {feeStats.pending.toLocaleString()}</div>
              <div className="text-yellow-100">Pending Payment</div>
              <div className="mt-2 text-sm text-yellow-200">Partial payments</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold mb-2">KES {feeStats.overdue.toLocaleString()}</div>
              <div className="text-red-100">Overdue</div>
              <div className="mt-2 text-sm text-red-200">Requires attention</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold mb-2">KES {feeStats.thisMonth.toLocaleString()}</div>
              <div className="text-blue-100">This Month</div>
              <div className="mt-2 text-sm text-blue-200">Current period</div>
            </div>
          </div>

          {/* Fee Management Component */}
          <FeeManagement />
        </div>
      )}
    </div>
  )
}

export default AdminDashboard