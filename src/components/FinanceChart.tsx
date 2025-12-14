'use client'
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


const data = [
  {
    name: 'Jan',
    Income: 4000,
    Expense: 5000
  },
  {
    name: 'Feb',
    Income: 3000,
    Expense: 4000,
  },
  {
    name: 'Mar',
    Income: 2000,
    Expense: 3000,
  },
  {
    name: 'Apr',
    Income: 2500,
    Expense: 3500,
  },
  {
    name: 'May',
    Income: 2780,
    Expense: 3908,
  },
  {
    name: 'Jun',
    Income: 1890,
    Expense: 4800,
  },
  {
    name: 'Jul',
    Income: 2390,
    Expense: 3800,
  },
  {
    name: 'Aug',
    Income: 3490,
    Expense: 4300,
  },
  {
    name: 'Sep',
    Income: 4000,
    Expense: 5000,
  },
  {
    name: 'Oct',
    Income: 3000,
    Expense: 4000,
  },
  {
    name: 'Nov',
    Income: 2000,
    Expense: 3000,
  },
  {
    name: 'Dec',
    Income: 2780,
    Expense: 3908,
  }
];


function FinanceChart() {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      {/**TITLE */}
      <div className="flex justify-between items-center">
        <h1 className='text-lg font-semibold'>Finance</h1>
        <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer" />
      </div>
      <div className="w-full h-[90%]">
        <LineChart
          responsive
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis dataKey="name" tick={{ fill: "#d1d5db" }} tickLine={false} tickMargin={10} />
          <YAxis width="auto" tick={{ fill: "#d1d5db" }} tickLine={false} tickMargin={20}/>
          <Tooltip />
          <Legend align='left' verticalAlign='middle' wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }} />
          <Line type="monotone" dataKey="Income" stroke="#C3E8FA" strokeWidth={5} />
          <Line type="monotone" dataKey="Expense" stroke="#CFCEFF" strokeWidth={5}/>
        </LineChart>
      </div>
    </div>
  );
}

export default FinanceChart;  