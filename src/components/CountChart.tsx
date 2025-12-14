'use client'

import Image from 'next/image';
import { RadialBarChart, RadialBar, Legend } from 'recharts';

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
    <div className='bg-white p-4 rounded-xl h-full '>
        {/**TITTLE */}
        <div className="flex justify-between items-center">
            <h1 className='text-lg font-semibold'>Students</h1>
            <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
        </div>
        {/**CHART */ }
        <div className=" w-full h-[75%]">
        <RadialBarChart
          width={300}
          height={250}
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="100%"
          barSize={32}
          data={data}
        >
          <RadialBar

            background
            dataKey="count"
          />
        </RadialBarChart> 
        <Image  src="/maleFemale.png" 
        alt="maleFemale" 
        width={50} 
        height={50} 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
        </div>
        {/*BOTTOM INFO */ }
        <div className="flex justify-center gap-16">
            <div className=" flex flex-col gap-1">
                <div className="w-5 h-5 bg-lamaSky rounded-full" />
                <h1 className=' font-bold'>1,234</h1> 
                <h2 className='text-xs text-gray-300'>Boys (55%)</h2>
            </div>
            <div className=" flex flex-col gap-1">
                <div className="w-5 h-5 bg-lamaYellow rounded-full" />
                <h1 className=' font-bold'>1,234</h1> 
                <h2 className='text-xs text-gray-300'>Girls (45%)</h2>
            </div>
        </div>
    </div>
  )
}

export default CountChart;