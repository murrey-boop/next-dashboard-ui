'use client'

import Image from 'next/image'
import Link from 'next/link'

const actions = [
  {
    id: 1,
    title: 'Add Student',
    description: 'Register new student',
    icon: '/student.png',
    href: '/list/students/new',
    color: 'bg-lamaSkyLight hover:bg-lamaSky'
  },
  {
    id: 2,
    title: 'Record Payment',
    description: 'Process fee payment',
    icon: '/announcement.png',
    href: '/fees/payment',
    color: 'bg-lamaYellowLight hover:bg-lamaYellow'
  },
  {
    id: 3,
    title: 'Add Teacher',
    description: 'Register new teacher',
    icon: '/teacher.png',
    href: '/list/teachers/new',
    color: 'bg-lamaPurplleLight hover:bg-lamaPurple'
  },
  {
    id: 4,
    title: 'View Reports',
    description: 'Generate reports',
    icon: '/result.png',
    href: '/reports',
    color: 'bg-lamaSkyLight hover:bg-lamaSky'
  }
]

export default function QuickActions() {
  return (
    <div className='bg-white p-4 rounded-xl'>
      <div className="flex justify-between items-center mb-4">
        <h1 className='text-lg font-semibold'>Quick Actions</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`${action.color} p-3 rounded-lg transition-all transform hover:scale-105 cursor-pointer`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-white p-2 rounded-full">
                <Image 
                  src={action.icon} 
                  alt={action.title} 
                  width={24} 
                  height={24}
                />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-800">{action.title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
