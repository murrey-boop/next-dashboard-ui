"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"

const UserCard = ({type}:{type:string}) => {
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { 
                    opacity: 0, 
                    y: 20,
                    scale: 0.95
                },
                { 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "power3.out",
                    delay: 0.1
                }
            )
        }
    }, [])

    const handleHover = () => {
        gsap.to(cardRef.current, {
            y: -5,
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out"
        })
    }

    const handleHoverOut = () => {
        gsap.to(cardRef.current, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
        })
    }

    return (
        <div 
            ref={cardRef}
            onMouseEnter={handleHover}
            onMouseLeave={handleHoverOut}
            className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[200px] cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
        >
           <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600 font-medium">2024/25</span>
                <Image src="/more.png" alt="more" width={20} height={20} className="float-right"/>
            </div> 
            <h1 className="text-2xl font-semibold my-4">1,234</h1>
            <h2 className="first-letter:capitalize text-sm font-medium text-gray-600">{type}</h2>
        </div>
    )
}

export default UserCard