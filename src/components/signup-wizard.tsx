'use client';

import { useState } from 'react';

type Role = 'student' | 'teacher' | 'institute_head' | null;

export function SignupWizard() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  
  // Basic states for the wizard
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [provisioningToken, setProvisioningToken] = useState('');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, we would call the server action here to create the user,
    // verify the provisioning token (if institute head), and insert the profile.
    alert('Signup flow complete (Phase 3 Scaffold). Redirecting to verification...');
  };

  return (
    <form onSubmit={handleSignup} className="space-y-6">
      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold text-white">Step 1: Your Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="button" onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
            Next
          </button>
        </div>
      )}

      {/* STEP 2: Role Selection */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold text-white">Step 2: Choose Your Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['student', 'teacher', 'institute_head'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 rounded-xl border ${role === r ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800'} transition-all`}
              >
                <div className="capitalize font-medium text-white mb-1">{r.replace('_', ' ')}</div>
              </button>
            ))}
          </div>

          {role === 'institute_head' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">Provisioning Token</label>
              <input type="text" required value={provisioningToken} onChange={e => setProvisioningToken(e.target.value)}
                placeholder="UUID Token provided by system admin"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-2">Institute Heads must provide a valid provisioning token to bootstrap a new institution.</p>
            </div>
          )}

          <div className="flex gap-4">
            <button type="button" onClick={prevStep} className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">
              Back
            </button>
            <button type="button" onClick={nextStep} disabled={!role || (role === 'institute_head' && !provisioningToken)} 
              className="w-2/3 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Institution & Context */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-semibold text-white">Step 3: Academic Context</h2>
          <p className="text-slate-400 text-sm mb-4">Search and select your institution to proceed.</p>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Institution Search</label>
            <input type="text" placeholder="Type to search..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-4 mt-6">
            <button type="button" onClick={prevStep} className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">
              Back
            </button>
            <button type="submit" className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
              Complete Signup
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
