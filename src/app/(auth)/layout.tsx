import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Brand/Gradient (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-800 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">studchat</span>
          </Link>
        </div>
        
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight">
            Chat. Share. Learn. Together.
          </h1>
          <p className="text-lg text-indigo-100">
            A premium student & teacher communication platform.
          </p>
        </div>
        
        <div className="text-sm text-indigo-200">
          © {new Date().getFullYear()} studchat. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 lg:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
              <MessageCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">studchat</h2>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
