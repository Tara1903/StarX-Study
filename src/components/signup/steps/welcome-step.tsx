import { ArrowRight } from 'lucide-react';
import { StarXEmblem } from '@/components/ui/starx-logo';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="mb-2">
        <StarXEmblem size={72} glow />
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to <span className="text-white">Star<span className="text-primary">X</span> Study</span>
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
          BEYOND TOMORROW
        </p>
        <p className="text-sm text-muted-foreground">The premier student communication and study platform</p>
      </div>

      <button
        onClick={onNext}
        className="group flex w-full max-w-[240px] items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[#22C55E] transition-all shadow-md"
      >
        Get Started
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
