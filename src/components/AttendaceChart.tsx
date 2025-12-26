'use client'

import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Monday',
    Present: 40,
    Absent: 24,
  },
  {
    name: 'Tuesday',
    Present: 30,
    Absent: 34,
  },
  {
    name: 'Wednesday',
    Present: 50,
    Absent: 14,
    
  },
  {
    name: 'Thursday',
    Present: 45,
    Absent: 19,
    
  },
  {
    name: 'Friday',
    Present: 35,
    Absent: 29,
    
  },

  {
    name: 'Saturday',
    Present: 55,
    Absent: 9,
  }
];
  
 

function AttendaceChart() {
  return (
    <div className='bg-white p-4 rounded-xl h-full flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
          <h1 className='text-lg font-semibold'>Attendance</h1>
          <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
      </div>
      <div className="flex-1 w-full" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke='#ddd' />
            <XAxis dataKey="name" axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false} />
            <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:"10px",borderColor:"lightgray"}}/>
            <Legend align='left' verticalAlign='top' wrapperStyle={{ paddingTop: "10px", paddingBottom: "20px" }} />
            <Bar 
              dataKey="Present" 
              fill="#FAE27C" 
              legendType='circle'
              radius={[10,10,0,0]}
            />
            <Bar 
              dataKey="Absent" 
              fill="#C3E8FA" 
              legendType='circle'
              radius={[10,10,0,0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AttendaceChart