import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050B16] text-[#F5F7FB]">
      {/* Left side - Brand/Gradient (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#071735] border-r border-white/5 p-12 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#168BFF]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#4936E8]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="studchat logo" className="h-12 w-12 rounded-xl object-cover shadow-2xl border border-white/10" />
            <span className="text-3xl font-bold tracking-tight">studchat</span>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
            Chat. Share. Learn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#12CFEA] to-[#168BFF]">Together.</span>
          </h1>
          <p className="text-lg text-[#A8B2C2] font-medium leading-relaxed">
            The premium communication platform designed exclusively for university students and educators.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-[#6F7B8E] font-medium">
          &copy; {new Date().getFullYear()} studchat. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-10 flex flex-col items-center justify-center gap-4 lg:hidden">
            <img src="/logo.jpg" alt="studchat logo" className="h-16 w-16 rounded-2xl object-cover shadow-2xl border border-white/10" />
            <h2 className="text-2xl font-bold tracking-tight text-white">studchat</h2>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
