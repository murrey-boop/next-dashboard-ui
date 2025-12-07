import Image from 'next/image'
import React from 'react'

function Navbar() {
  return (
    <div className='flex items-center justify-between p-4'>
        {/**SEARCH BAR */}
        <div className="hidden md:flex items-center gap-2 text-xs rounded full ring-[1.5px] ring-gray-300 px-3 py-2 relative">
            <Image src="/search.png" alt="Search Icon" width={14} height={14} className="absolute ml-3"/>
            <input 
                type="text" 
                placeholder="Search..."
                className="p-2 w-[200px] outline-none bg-transparent"
            />
        </div>
        {/**ICON AND USER */}
        <div className="flex items-center gap-6 justify-end w-full">
            <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
                <Image src="/message.png" alt="Message Icon" width={16} height={16}/>
            </div>
            <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
                <Image src="/announcement.png" alt="Announcement Icon" width={16} height={16}/>
                <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">3</div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs leading-3 font-medium ">Mr. Maina</span>
                <span className="text-[10px] text-right text-gray-500">Admin</span>
            </div>
            <Image src="/avatar.png" alt="User Avatar" width={32} height={32} className="rounded-full"/>
        </div>
    </div>
  )
}

export default Navbar