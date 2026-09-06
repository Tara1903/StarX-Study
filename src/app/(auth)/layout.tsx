import Link from "next/link";
import { StarXLogo } from "@/components/ui/starx-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050805] text-[#F5F7F5]">
      {/* Left side - Brand/Gradient (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#08110B] border-r border-[#193022] p-12 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#16A34A]/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/10 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <StarXLogo variant="header" size="lg" showTagline={false} href="/" />
        </div>
        
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/15 border border-[#16A34A]/30 text-[11px] font-bold tracking-[0.2em] text-[#86EFAC] uppercase">
            BEYOND TOMORROW
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Chat. Share. Learn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#34D399]">Together.</span>
          </h1>
          <p className="text-base text-[#A7B3AA] font-normal leading-relaxed">
            The next-generation communication and study platform built for academic excellence.
          </p>
        </div>
        
        <div className="relative z-10 text-xs text-[#748078] font-medium">
          &copy; {new Date().getFullYear()} StarX Study. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-4 sm:p-8 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-8 flex flex-col items-center justify-center gap-2 lg:hidden">
            <StarXLogo variant="header" size="lg" showTagline={true} href="/" />
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
