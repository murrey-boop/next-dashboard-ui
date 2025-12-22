'use client'

import Image from 'next/image';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Boys',
    count: 240,
    fill: '#C3E8FA',
  },
  {
    name: 'Girls',
    count: 260,
    fill: '#FAE27C',
  },
    {
        name :"Total",
        count:500,
        fill:"white"
    },
  


];





function CountChart() {
  return (
    <div className='bg-white p-4 rounded-xl h-full flex flex-col'>
        {/**TITLE */}
        <div className="flex justify-between items-center mb-4">
            <h1 className='text-lg font-semibold'>Students</h1>
            <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
        </div>
        {/**CHART */ }
        <div className="relative w-full flex-1 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              barSize={32}
              data={data}
            >
              <RadialBar
                background
                dataKey="count"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <Image  
            src="/maleFemale.png" 
            alt="maleFemale" 
            width={50} 
            height={50} 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
        {/*BOTTOM INFO */ }
        <div className="flex justify-center gap-16 mt-4">
            <div className="flex flex-col gap-1 items-center">
                <div className="w-5 h-5 bg-lamaSky rounded-full" />
                <h1 className='font-bold'>1,234</h1> 
                <h2 className='text-xs text-gray-400'>Boys (55%)</h2>
            </div>
            <div className="flex flex-col gap-1 items-center">
                <div className="w-5 h-5 bg-lamaYellow rounded-full" />
                <h1 className='font-bold'>1,234</h1> 
                <h2 className='text-xs text-gray-400'>Girls (45%)</h2>
            </div>
        </div>
    </div>
  )
}

export default CountChart;