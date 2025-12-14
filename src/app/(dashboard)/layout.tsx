import Image from "next/image";
import Link from "next/link";
import  Menu  from "@/components/Menu";
import Navbar from "@/components/Navbar";


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex" >
      {/* Sidebar */ }
      <aside className="w-[14%]  md:w-[8%] lg:w-[16%] xl:w-[14%]">
        <Link href="/" className="flex justify-center gap-2 items-center lg:justify-start p-4">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <span className="hidden lg:block">Engineer Central Schools</span>
        </Link>
        <div>
          <Menu />
        </div>
        </aside>
      {/* Main Content Area */ }
      <main className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll">
        <Navbar />
        {children}
        </main>      

    </div>
  );
}