import AttendaceChart from '@/components/AttendaceChart'
import CountChart from '@/components/CountChart'
import FinanceChart from '@/components/FinanceChart'
import UserCard from '@/components/UserCard'
import React from 'react'

function page() {
  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row'>
      {/* LEFT SIDE */ }
      <div className="w-full lg:w-2/3 flex-col gap-8 flex">
      {/**USER CARDS */  }
      <div className="flex gap-4 justify-between flex-wrap">
        <UserCard type="Students"/>
        <UserCard type="Teachers" />
        <UserCard type="Parents"/>
        <UserCard type="Staff"/>
      </div>
   {/* MIDDLE CHARTS*/ }
      <div className="flex gap-4 flex-col lg:flex-row">
        {/**count CHART */ }
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
      {/* RIGHT SIDE */ }
      <div className="w-full lg:w-1/3">R</div>
      </div>
    </div>
  )
}

export default page