'use client'

import { useState } from 'react'
import Image from 'next/image'

const events = [
  {
    id: 1,
    title: 'Parent-Teacher Meeting',
    date: '2025-01-15',
    time: '10:00 AM',
    type: 'meeting'
  },
  {
    id: 2,
    title: 'Sports Day',
    date: '2025-01-20',
    time: 'All Day',
    type: 'event'
  },
  {
    id: 3,
    title: 'End of Term 1',
    date: '2025-03-28',
    time: '',
    type: 'holiday'
  }
]

export default function EventCalendar() {
  const [currentDate] = useState(new Date())

  return (
    <div className='bg-white p-4 rounded-xl'>
      <div className="flex justify-between items-center mb-4">
        <h1 className='text-lg font-semibold'>Events Calendar</h1>
        <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
      </div>
      
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-lg bg-lamaSkyLight hover:bg-lamaSky/30 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-sm text-gray-800">{event.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  {event.time && ` • ${event.time}`}
                </p>
              </div>
              <span 
                className={`text-xs px-2 py-1 rounded-full ${
                  event.type === 'meeting' 
                    ? 'bg-lamaPurple text-gray-700' 
                    : event.type === 'event'
                    ? 'bg-lamaYellow text-gray-700'
                    : 'bg-lamaSky text-gray-700'
                }`}
              >
                {event.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-lamaPurple hover:bg-lamaPurplleLight rounded-lg transition-colors">
        View All Events →
      </button>
    </div>
  )
}
