import { ECE_SUBJECTS, ECESubject } from '@/lib/ece-data';

export interface ResolvedSubject {
  id: string; // The URL slug or DB id
  uuid: string; // Deterministic RFC4122 UUID for DB / message queries
  name: string;
  shortName: string;
  code: string;
  facultyName: string;
  facultyAbb: string;
  credits: number;
  color: string;
  description: string;
  room: string;
  academicContext: string;
  universityName: string;
  departmentName: string;
  semesterInfo: string;
  type: 'theory' | 'lab' | 'hybrid';
  icon: string;
}

// Deterministic RFC4122 v4 UUIDs for predefined academic subjects
export const ECE_UUID_MAP: Record<string, string> = {
  'math-1': '11111111-1111-4111-8111-111111111111',
  'chemistry': '22222222-2222-4222-8222-222222222222',
  'basic-electrical': '33333333-3333-4333-8333-333333333333',
  'engineering-graphics': '44444444-4444-4444-8444-444444444444',
  'pces-1': '55555555-5555-4555-8555-555555555555',
  'esdm': '66666666-6666-4666-8666-666666666666',
};

const UUID_TO_ECE_SLUG: Record<string, string> = Object.entries(ECE_UUID_MAP).reduce(
  (acc, [slug, uuid]) => ({ ...acc, [uuid]: slug }),
  {}
);

const ACADEMIC_CONTEXT_DEFAULT = 'B.Tech ECE • 1st Year • Semester 1 • Section A • Room No. 03';
const UNIVERSITY_DEFAULT = 'IET, SAGE University, Indore';
const DEPARTMENT_DEFAULT = 'Electronics & Communication Engineering (ECE)';
const SEMESTER_DEFAULT = 'Semester 1 • Session July-Dec 2026';

export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function getSubjectUuid(idOrSlug: string): string {
  if (ECE_UUID_MAP[idOrSlug]) {
    return ECE_UUID_MAP[idOrSlug];
  }
  if (isUuid(idOrSlug)) {
    return idOrSlug;
  }
  return idOrSlug;
}

export async function resolveSubject(
  idOrSlug: string,
  supabase?: any
): Promise<ResolvedSubject | null> {
  if (!idOrSlug) return null;

  // 1. Check if it's a known ECE subject slug
  const directEce = ECE_SUBJECTS.find(
    (s) => s.id === idOrSlug || s.id.toLowerCase() === idOrSlug.toLowerCase()
  );
  if (directEce) {
    return formatEceSubject(directEce);
  }

  // 2. Check if it matches an ECE UUID
  const slugFromUuid = UUID_TO_ECE_SLUG[idOrSlug.toLowerCase()];
  if (slugFromUuid) {
    const matched = ECE_SUBJECTS.find((s) => s.id === slugFromUuid);
    if (matched) return formatEceSubject(matched);
  }

  // 3. Fallback name/code check in ECE
  const fuzzyMatch = ECE_SUBJECTS.find(
    (s) =>
      s.code.toLowerCase() === idOrSlug.toLowerCase() ||
      s.shortName.toLowerCase() === idOrSlug.toLowerCase() ||
      s.name.toLowerCase().replace(/\s+/g, '-') === idOrSlug.toLowerCase()
  );
  if (fuzzyMatch) {
    return formatEceSubject(fuzzyMatch);
  }

  // 4. If Supabase client provided and is UUID, check Supabase
  if (supabase && isUuid(idOrSlug)) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          color,
          university:universities(name),
          semester:semesters(name, department:departments(name))
        `)
        .eq('id', idOrSlug)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          uuid: data.id,
          name: data.name,
          shortName: data.name.substring(0, 4).toUpperCase(),
          code: data.id.substring(0, 8).toUpperCase(),
          facultyName: 'Course Faculty',
          facultyAbb: 'CF',
          credits: 4,
          color: data.color || '#3B82F6',
          description: `${data.name} academic course.`,
          room: 'Room No. 03',
          academicContext: ACADEMIC_CONTEXT_DEFAULT,
          universityName: data.university?.name || UNIVERSITY_DEFAULT,
          departmentName: data.semester?.department?.name || DEPARTMENT_DEFAULT,
          semesterInfo: data.semester?.name || SEMESTER_DEFAULT,
          type: 'theory',
          icon: 'BookOpen',
        };
      }
    } catch {
      // Supabase lookup error ignored, will return null
    }
  }

  return null;
}

function formatEceSubject(ece: ECESubject): ResolvedSubject {
  return {
    id: ece.id,
    uuid: ECE_UUID_MAP[ece.id] || ece.id,
    name: ece.name,
    shortName: ece.shortName,
    code: ece.code,
    facultyName: ece.facultyName,
    facultyAbb: ece.facultyAbb,
    credits: ece.credits,
    color: ece.color,
    description: ece.description,
    room: ece.room,
    academicContext: ACADEMIC_CONTEXT_DEFAULT,
    universityName: UNIVERSITY_DEFAULT,
    departmentName: DEPARTMENT_DEFAULT,
    semesterInfo: SEMESTER_DEFAULT,
    type: ece.type,
    icon: ece.icon,
  };
}

// Pre-seeded academic materials for each subject
export function getSubjectMaterials(subjectId: string) {
  const materialsMap: Record<string, any[]> = {
    'math-1': [
      { id: 'm1-1', title: 'Unit 1: Linear Algebra & Matrices Lecture Notes', type: 'application/pdf', size: 2450000, date: '2026-08-25', author: 'Prof. Ruchi Shrivastava' },
      { id: 'm1-2', title: 'Unit 2: Differential Calculus & Mean Value Theorems', type: 'application/pdf', size: 1840000, date: '2026-08-28', author: 'Prof. Ruchi Shrivastava' },
      { id: 'm1-3', title: 'Previous Year Mid-Sem Examination Papers (2023-2025)', type: 'application/pdf', size: 3120000, date: '2026-08-30', author: 'Prof. Ruchi Shrivastava' },
    ],
    'chemistry': [
      { id: 'ch-1', title: 'Engineering Chemistry Lab Manual (First Year)', type: 'application/pdf', size: 4200000, date: '2026-08-22', author: 'Prof. Garima Pawar' },
      { id: 'ch-2', title: 'Spectroscopy & Molecular Structure Module PPT', type: 'application/pdf', size: 5600000, date: '2026-08-27', author: 'Prof. Garima Pawar' },
      { id: 'ch-3', title: 'Water Technology & Hardness Numerical Problems', type: 'application/pdf', size: 1450000, date: '2026-08-29', author: 'Prof. Garima Pawar' },
    ],
    'basic-electrical': [
      { id: 'be-1', title: 'DC Circuit Analysis & Network Theorems Notes', type: 'application/pdf', size: 2890000, date: '2026-08-24', author: 'Prof. Ranu Thakur' },
      { id: 'be-2', title: 'Single-Phase Transformer Construction & Equivalent Circuit', type: 'application/pdf', size: 3410000, date: '2026-08-29', author: 'Prof. Ranu Thakur' },
      { id: 'be-3', title: 'Electrical Safety Precautions and Earthing Guide', type: 'application/pdf', size: 1120000, date: '2026-08-31', author: 'Prof. Ranu Thakur' },
    ],
    'engineering-graphics': [
      { id: 'eg-1', title: 'Orthographic Projections Step-by-Step Tutorial Sheets', type: 'application/pdf', size: 6800000, date: '2026-08-23', author: 'Prof. Vikas Bakshi' },
      { id: 'eg-2', title: 'Scales and Engineering Curves Problem Bank', type: 'application/pdf', size: 2150000, date: '2026-08-28', author: 'Prof. Vikas Bakshi' },
      { id: 'eg-3', title: 'AutoCAD 2D Drafting Fundamentals Guide', type: 'application/pdf', size: 8400000, date: '2026-08-30', author: 'Prof. Vikas Bakshi' },
    ],
    'pces-1': [
      { id: 'pc-1', title: 'Professional Email Writing & Resume Building Handbook', type: 'application/pdf', size: 1980000, date: '2026-08-26', author: 'Dr. Varun Parmal' },
      { id: 'pc-2', title: 'Group Discussion Strategies & Mock Topics 2026', type: 'application/pdf', size: 1240000, date: '2026-08-30', author: 'Dr. Varun Parmal' },
    ],
    'esdm': [
      { id: 'es-1', title: 'Disaster Management Protocols & National Guidelines', type: 'application/pdf', size: 3820000, date: '2026-08-27', author: 'Prof. Rishabh Yadav' },
      { id: 'es-2', title: 'Environmental Pollution & Green Energy Case Studies', type: 'application/pdf', size: 2470000, date: '2026-08-31', author: 'Prof. Rishabh Yadav' },
    ],
  };

  return materialsMap[subjectId] || [
    { id: 'default-1', title: 'Course Syllabus and Learning Outcomes', type: 'application/pdf', size: 1200000, date: '2026-08-20', author: 'Department of ECE' },
    { id: 'default-2', title: 'Module 1 Lecture Slides', type: 'application/pdf', size: 2400000, date: '2026-08-25', author: 'Faculty In Charge' },
  ];
}

// Pre-seeded academic assignments for each subject
export function getSubjectAssignments(subjectId: string) {
  const assignmentsMap: Record<string, any[]> = {
    'math-1': [
      { id: 'as-m1', title: 'Assignment 1: Matrix Inversion & Cayley-Hamilton Theorem', dueDate: '2026-09-12T23:59:59Z', points: 20, status: 'pending', submissions: 42, totalStudents: 60 },
      { id: 'as-m2', title: 'Tutorial Sheet 2: Taylor Series & Maxima-Minima', dueDate: '2026-09-19T23:59:59Z', points: 15, status: 'upcoming', submissions: 10, totalStudents: 60 },
    ],
    'chemistry': [
      { id: 'as-ch1', title: 'Lab Assignment 1: Determination of Total Hardness in Water by EDTA Method', dueDate: '2026-09-10T23:59:59Z', points: 25, status: 'pending', submissions: 51, totalStudents: 60 },
      { id: 'as-ch2', title: 'Assignment 2: Polymers, Synthesis & Engineering Applications', dueDate: '2026-09-18T23:59:59Z', points: 20, status: 'upcoming', submissions: 4, totalStudents: 60 },
    ],
    'basic-electrical': [
      { id: 'as-be1', title: 'Assignment 1: Thevenin & Norton Theorem Numerical Analysis', dueDate: '2026-09-11T23:59:59Z', points: 20, status: 'pending', submissions: 48, totalStudents: 60 },
      { id: 'as-be2', title: 'Lab Sheet: Verification of KVL and KCL on Hardware Bench', dueDate: '2026-09-16T23:59:59Z', points: 25, status: 'upcoming', submissions: 22, totalStudents: 60 },
    ],
    'engineering-graphics': [
      { id: 'as-eg1', title: 'Drawing Sheet 1: Projection of Lines inclined to both HP & VP', dueDate: '2026-09-14T23:59:59Z', points: 30, status: 'pending', submissions: 35, totalStudents: 60 },
      { id: 'as-eg2', title: 'Drawing Sheet 2: Orthographic Projections of Machine Components', dueDate: '2026-09-22T23:59:59Z', points: 30, status: 'upcoming', submissions: 0, totalStudents: 60 },
    ],
    'pces-1': [
      { id: 'as-pc1', title: 'Task 1: Formal Executive Email & Resume Submission', dueDate: '2026-09-15T23:59:59Z', points: 20, status: 'pending', submissions: 54, totalStudents: 60 },
    ],
    'esdm': [
      { id: 'as-es1', title: 'Case Study: Local Flood Risk Assessment and Mitigation Plan', dueDate: '2026-09-17T23:59:59Z', points: 25, status: 'pending', submissions: 38, totalStudents: 60 },
    ],
  };

  return assignmentsMap[subjectId] || [
    { id: 'as-def', title: 'Coursework Assignment 1', dueDate: '2026-09-15T23:59:59Z', points: 20, status: 'pending', submissions: 40, totalStudents: 60 },
  ];
}

// Pre-seeded academic announcements specific to each subject
export function getSubjectAnnouncements(subjectId: string) {
  const announcementsMap: Record<string, any[]> = {
    'math-1': [
      { id: 'sa-m1', title: 'Extra Doubt Clearing Session on Linear Algebra', content: 'There will be an extra doubt-clearing session for Chapter 1 (Matrices & Eigenvalues) this Thursday during the 7th period in Room No. 03. Please bring your tutorial sheets.', date: '2026-09-02T10:30:00Z', author: 'Prof. Ruchi Shrivastava [RS]', isPinned: true },
      { id: 'sa-m2', title: 'Syllabus for Mid-Sem Examination - 1', content: 'Mid-Sem 1 will cover Unit-1 (Matrices, System of Linear Equations) and Unit-2 (Differential Calculus up to Maclaurin series). Practice all assigned tutorial problems.', date: '2026-08-30T14:15:00Z', author: 'Prof. Ruchi Shrivastava [RS]', isPinned: false },
    ],
    'chemistry': [
      { id: 'sa-ch1', title: 'Chemistry Lab File Submission & Viva Instructions', content: 'All students are required to submit their completed chemistry lab files for Experiments 1-3 before Friday 04:00 PM in CH Lab-I. Lab coats and safety goggles are strictly mandatory for viva.', date: '2026-09-02T11:00:00Z', author: 'Prof. Garima Pawar [GP]', isPinned: true },
      { id: 'sa-ch2', title: 'Reference Book Recommendation for Spectroscopy', content: 'Please refer to "Engineering Chemistry" by Jain & Jain (Chapter 4) for NMR and UV-Vis spectroscopy numericals discussed in class.', date: '2026-08-28T09:45:00Z', author: 'Prof. Garima Pawar [GP]', isPinned: false },
    ],
    'basic-electrical': [
      { id: 'sa-be1', title: 'Safety Guidelines for BE Lab-I Practical Sessions', content: 'Ensure all breadboards and multimeter connections are inspected by lab assistants before turning on the DC power supply bench. Late entry past 08:35 AM is not allowed.', date: '2026-09-01T08:20:00Z', author: 'Prof. Ranu Thakur [RT]', isPinned: true },
    ],
    'engineering-graphics': [
      { id: 'sa-eg1', title: 'Mandatory Drawing Sheet Materials for Thursday', content: 'Bring A2 size drawing sheets, mini-drafter, 2H/HB drawing pencils, compass, and roll-n-draw scale for the Orthographic Projection practical. Drawing boards are provided in Room No. 03.', date: '2026-09-01T15:00:00Z', author: 'Prof. Vikas Bakshi [VB]', isPinned: true },
    ],
    'pces-1': [
      { id: 'sa-pc1', title: 'Mock GD Groups Announcement', content: 'Group Discussion batch lists for next Tuesday have been finalized. Each group will have 8 students with 15 minutes of discussion on assigned current affairs topics.', date: '2026-08-31T12:00:00Z', author: 'Dr. Varun Parmal [VP]', isPinned: false },
    ],
    'esdm': [
      { id: 'sa-es1', title: 'Field Survey Notice for Environmental Assessment', content: 'Field observation forms for campus water harvesting and green belt survey will be distributed during Monday first period. Please bring clipboards.', date: '2026-08-29T16:00:00Z', author: 'Prof. Rishabh Yadav [RY]', isPinned: false },
    ],
  };

  return announcementsMap[subjectId] || [
    { id: 'sa-def', title: 'Subject Course Guidelines & Objectives', content: 'Welcome to this semester. Please check the materials tab for the syllabus and reference reading list.', date: '2026-08-20T10:00:00Z', author: 'Course Faculty', isPinned: true },
  ];
}
