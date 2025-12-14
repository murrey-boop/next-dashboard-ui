import Image from "next/image"

const UserCard = ({type}:{type:string}) => {
    return (
        <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 ">
           <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] bg-white px-2 rounded-full text-green-600">2024/25</span>
                <Image src="/more.png" alt="more" width={20} height={20} className="float-right"/>
            </div> 
            <h1 className="text-2xl font-semibold my-4">1,234</h1>
            <h2 className=" first-letter:capitalize text-sm font-medium text-gray-600">{type}</h2>
        </div>
)
}


export default UserCard