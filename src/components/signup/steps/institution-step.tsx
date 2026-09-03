import { useState } from 'react';
import { Search, MapPin, ArrowLeft, ArrowRight, Building, GraduationCap, Library } from 'lucide-react';
import { SignupState } from '../onboarding-wizard';

interface InstitutionStepProps {
  data: SignupState;
  onNext: (data: Partial<SignupState>) => void;
  onPrev: () => void;
}

const mockInstitutions = [
  { id: '1', name: 'SAGE University', type: 'university', hasCampuses: true, hasDepartments: true, usesSemesters: true },
  { id: '2', name: 'MIT College of Engineering', type: 'college', hasCampuses: false, hasDepartments: true, usesSemesters: true },
  { id: '3', name: 'Delhi Public School', type: 'school', hasCampuses: false, hasDepartments: false, usesSemesters: false },
];

export function InstitutionStep({ data, onNext, onPrev }: InstitutionStepProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const filtered = mockInstitutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType ? inst.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const handleSelect = (inst: typeof mockInstitutions[0]) => {
    onNext({
      universityId: inst.id,
      universityName: inst.name,
      institutionType: inst.type,
      hasCampuses: inst.hasCampuses,
      hasDepartments: inst.hasDepartments,
      usesSemesters: inst.usesSemesters
    });
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-md mx-auto h-[500px]">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPrev} className="p-2 hover:bg-white/5 rounded-lg text-[#6F7B8E] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white">Find your institution</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType(selectedType === 'university' ? null : 'university')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
            selectedType === 'university' ? 'bg-[#168BFF] text-white' : 'bg-white/5 text-[#A8B2C2] hover:bg-white/10'
          }`}
        >
          <Building className="w-3 h-3" /> University
        </button>
        <button
          onClick={() => setSelectedType(selectedType === 'college' ? null : 'college')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
            selectedType === 'college' ? 'bg-[#168BFF] text-white' : 'bg-white/5 text-[#A8B2C2] hover:bg-white/10'
          }`}
        >
          <GraduationCap className="w-3 h-3" /> College
        </button>
        <button
          onClick={() => setSelectedType(selectedType === 'school' ? null : 'school')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
            selectedType === 'school' ? 'bg-[#168BFF] text-white' : 'bg-white/5 text-[#A8B2C2] hover:bg-white/10'
          }`}
        >
          <Library className="w-3 h-3" /> School
        </button>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-[#6F7B8E]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="block w-full h-11 rounded-lg border border-white/10 bg-[#111D31] text-white pl-10 px-3 py-2 text-sm placeholder-[#6F7B8E] focus:border-[#168BFF] focus:outline-none focus:ring-2 focus:ring-[#168BFF]/20"
          placeholder="Search institutions..."
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filtered.map(inst => (
          <button
            key={inst.id}
            onClick={() => handleSelect(inst)}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group text-left"
          >
            <div>
              <h3 className="font-semibold text-white">{inst.name}</h3>
              <p className="text-xs text-[#A8B2C2] capitalize flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {inst.type}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6F7B8E] opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[#6F7B8E] text-sm">
            No institutions found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
