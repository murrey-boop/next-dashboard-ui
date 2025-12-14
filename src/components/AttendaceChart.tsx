'use client'

import Image from 'next/image';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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
    <div className='bg-white p-4 rounded-xl h-full '>
      <div className='flex justify-between items-center'>
          <h1 className='text-lg font-semibold'>Attendance </h1>
          <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer "/>
      </div>
      <BarChart
        style={{ width: '100%', height:'90%' }}
        responsive
        data={data}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke='#ddd' />
        <XAxis dataKey="name" axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false } />
        <YAxis  axisLine={false}   tick={{ fill: "#d1d5db" }} tickLine={false }/>
        <Tooltip  contentStyle={{borderRadius:"10px",borderColor:"lightgray"}}/>
        <Legend align='left' verticalAlign='top' wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }} />
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
    </div>
  )
}

export default AttendaceChart