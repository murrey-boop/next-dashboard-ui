'use client'

import Image from 'next/image'

const announcements = [
  {
    id: 1,
    title: 'New Term Schedule Released',
    description: 'Term 1 begins January 6th. Please check the updated timetable.',
    time: '2 hours ago',
    priority: 'important'
  },
  {
    id: 2,
    title: 'Fee Payment Deadline',
    description: 'Term 1 fees must be paid by January 20th to avoid late charges.',
    time: '1 day ago',
    priority: 'urgent'
  },
  {
    id: 3,
    title: 'Sports Trials',
    description: 'Football and basketball trials this Friday at 3 PM.',
    time: '2 days ago',
    priority: 'normal'
  }
]

export default function Announcements() {
  return (
    <div className='bg-white p-4 rounded-xl'>
      <div className="flex justify-between items-center mb-4">
        <h1 className='text-lg font-semibold'>Announcements</h1>
        <Image src="/moreDark.png" alt="more" width={20} height={20} className="cursor-pointer"/>
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`p-3 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer ${
              announcement.priority === 'urgent'
                ? 'border-red-500 bg-red-50'
                : announcement.priority === 'important'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm text-gray-800 flex-1">
                {announcement.title}
              </h3>
              {announcement.priority === 'urgent' && (
                <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">{announcement.description}</p>
            <span className="text-xs text-gray-400">{announcement.time}</span>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-sm text-lamaPurple hover:bg-lamaPurplleLight rounded-lg transition-colors">
        View All Announcements →
      </button>
    </div>
  )
}
