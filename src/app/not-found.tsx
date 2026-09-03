import Link from 'next/link';
import { ArrowLeft, BookOpen, Home, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-card/80 border border-border p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl border border-primary/20">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Academic Resource Not Found</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The subject, page, or announcement you requested does not exist or has been moved.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            href="/subjects"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted/60 text-foreground font-semibold text-xs hover:bg-muted transition-all border border-border"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>View My Subjects</span>
          </Link>

          <Link
            href="/announcements"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted/30 text-muted-foreground hover:text-foreground font-semibold text-xs transition-all"
          >
            <span>Campus Announcements</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
