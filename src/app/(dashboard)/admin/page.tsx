import AttendaceChart from '@/components/AttendaceChart'
import CountChart from '@/components/CountChart'
import FinanceChart from '@/components/FinanceChart'
import UserCard from '@/components/UserCard'
import EventCalendar from '@/components/EventCalendar'
import Announcements from '@/components/Announcements'
import QuickActions from '@/components/QuickActions'
import FeeStats from '@/components/FeeStats'
import React from 'react'

function page() {
  return (
    <div className='p-4 flex gap-4 flex-col lg:flex-row'>
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
  )
}

export default page