import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Brand/Gradient (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-800 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="studchat logo" className="h-12 w-12 rounded-xl object-cover shadow-lg" />
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
            <img src="/logo.jpg" alt="studchat logo" className="h-16 w-16 rounded-2xl object-cover shadow-xl" />
            <h2 className="text-2xl font-bold text-gray-900">studchat</h2>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
