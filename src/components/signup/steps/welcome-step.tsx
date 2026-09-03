import { ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl font-bold text-primary">S</span>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to studchat</h1>
        <p className="text-[#A8B2C2]">Chat. Share. Learn. Together.</p>
      </div>

      <button
        onClick={onNext}
        className="group flex w-full max-w-[240px] items-center justify-center gap-2 rounded-lg bg-[#168BFF] px-4 py-3 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all"
      >
        Get Started
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
