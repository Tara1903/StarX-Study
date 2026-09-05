import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';
import { z } from 'zod';

interface CredentialsStepProps {
  data: SignupState;
  onNext: (data: Partial<SignupState>) => void;
  onPrev: () => void;
}

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function CredentialsStep({ data, onNext, onPrev }: CredentialsStepProps) {
  const [formData, setFormData] = useState({
    fullName: data.fullName || '',
    email: data.email || '',
    password: data.password || '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = schema.parse(formData);
      onNext({
        fullName: validated.fullName,
        email: validated.email,
        password: validated.password,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (err as any).errors.forEach((e: any) => {
          if (e.path && e.path[0]) newErrors[e.path[0].toString()] = e.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-8 w-full max-w-md mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">Your details</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#F5F7FB]">Full Name</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-[#6F7B8E]" />
            </div>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
              className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                errors.fullName ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
              } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
              placeholder="John Doe"
            />
          </div>
          {errors.fullName && <p className="text-sm text-red-400">{errors.fullName}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#F5F7FB]">Email address</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-5 w-5 text-[#6F7B8E]" />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
              } pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#F5F7FB]">Create your password</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-[#6F7B8E]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => {
                setFormData(p => ({ ...p, password: e.target.value }));
                if (e.target.value.length >= 8) setErrors(p => ({ ...p, password: '' }));
              }}
              className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
              } pl-10 pr-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6F7B8E] hover:text-[#A8B2C2]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-red-400">{errors.password}</p>
          ) : (
            <div className="flex gap-1 mt-2">
              <div className={`h-1 flex-1 rounded-full ${formData.password.length > 0 ? 'bg-orange-500' : 'bg-white/10'}`} />
              <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 6 ? 'bg-yellow-500' : 'bg-white/10'}`} />
              <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-white/10'}`} />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-[#F5F7FB]">Confirm password</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-5 w-5 text-[#6F7B8E]" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={e => {
                setFormData(p => ({ ...p, confirmPassword: e.target.value }));
                if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' }));
              }}
              className={`block w-full h-11 rounded-lg border bg-[#111D31] text-white ${
                errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-[#168BFF] focus:ring-[#168BFF]/20'
              } pl-10 pr-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:outline-none focus:ring-2`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6F7B8E] hover:text-[#A8B2C2]"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-[#168BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#12CFEA] transition-all group"
      >
        Continue
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}
