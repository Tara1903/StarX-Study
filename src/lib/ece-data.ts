// =======================================================
// ECE Branch (Electronics & Communication Engineering) Data
// SAGE University, Indore — IET — Session July-Dec 2026
// =======================================================

export interface ECESubject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  facultyName: string;
  facultyAbb: string;
  credits: number;
  color: string;
  description: string;
  room: string;
  icon: string;
  type: 'theory' | 'lab' | 'hybrid';
}

export const ECE_SUBJECTS: ECESubject[] = [
  {
    id: 'math-1',
    code: 'IETBSNMT101T',
    name: 'Mathematics-I',
    shortName: 'M-I',
    facultyName: 'Prof. Ruchi Shrivastava',
    facultyAbb: 'RS',
    credits: 4,
    color: '#3B82F6', // Blue
    description: 'Calculus, differential equations, linear algebra, matrices, and applied analytical techniques for engineering systems.',
    room: 'Room No. 03',
    icon: 'Calculator',
    type: 'theory',
  },
  {
    id: 'chemistry',
    code: 'IETBSNCH202T',
    name: 'Chemistry',
    shortName: 'CH',
    facultyName: 'Prof. Garima Pawar',
    facultyAbb: 'GP',
    credits: 4,
    color: '#10B981', // Emerald
    description: 'Applied engineering chemistry, molecular structure, spectroscopy, polymers, phase rule, water technology, and electrochemistry.',
    room: 'Room No. 03 / CH Lab-I',
    icon: 'FlaskConical',
    type: 'hybrid',
  },
  {
    id: 'basic-electrical',
    code: 'EECESNBE103T',
    name: 'Basic Electrical',
    shortName: 'BE',
    facultyName: 'Prof. Ranu Thakur',
    facultyAbb: 'RT',
    credits: 4,
    color: '#F59E0B', // Amber
    description: 'DC circuit analysis, single & three-phase AC systems, magnetic circuits, transformers, electrical machines, and safety.',
    room: 'Room No. 03 / BE Lab-I',
    icon: 'Zap',
    type: 'hybrid',
  },
  {
    id: 'engineering-graphics',
    code: 'EECESNEG104T',
    name: 'Engineering Graphics',
    shortName: 'EG',
    facultyName: 'Prof. Vikas Bakshi',
    facultyAbb: 'VB',
    credits: 4,
    color: '#8B5CF6', // Purple
    description: 'Principles of engineering drawing, orthographic projections, isometric views, projection of solids, sections, and CAD tools.',
    room: 'Drawing Hall / Room No. 03',
    icon: 'PenTool',
    type: 'lab',
  },
  {
    id: 'pces-1',
    code: 'IETHSNPE105T',
    name: 'Professional Communication & Employability Skills-I',
    shortName: 'PCES',
    facultyName: 'Dr. Varun Parmal / Prof. Shubham',
    facultyAbb: 'VP',
    credits: 3,
    color: '#EC4899', // Pink
    description: 'Business communication, technical report writing, group discussion, personality grooming, spoken English, and quantitative aptitude.',
    room: 'Room No. 03 / PCES Lab',
    icon: 'MessageSquare',
    type: 'hybrid',
  },
  {
    id: 'esdm',
    code: 'VACVCNES001N',
    name: 'Environmental Science and Disaster Management',
    shortName: 'ESDM',
    facultyName: 'Prof. Rishabh Yadav',
    facultyAbb: 'RY',
    credits: 3,
    color: '#06B6D4', // Cyan
    description: 'Ecology, natural resources, environmental pollution, green technology, disaster risk reduction, and disaster management protocols.',
    room: 'Room No. 03',
    icon: 'Leaf',
    type: 'theory',
  },
];

export interface TimeSlot {
  slot: number;
  time: string;
  label: string;
  isBreak?: boolean;
}

export const TIME_SLOTS: TimeSlot[] = [
  { slot: 1, time: '08:30 - 09:20', label: '1 Lecture' },
  { slot: 2, time: '09:20 - 10:10', label: '2 Lecture' },
  { slot: 3, time: '10:10 - 11:00', label: '3 Lecture' },
  { slot: 4, time: '11:00 - 11:50', label: '4 Lecture' },
  { slot: 5, time: '11:50 - 12:20', label: 'LUNCH BREAK', isBreak: true },
  { slot: 6, time: '12:20 - 13:10', label: '5 Lecture' },
  { slot: 7, time: '13:10 - 14:00', label: '6 Lecture' },
  { slot: 8, time: '14:00 - 14:50', label: '7 Lecture' },
  { slot: 9, time: '14:50 - 15:40', label: '8 Lecture' },
  { slot: 10, time: '15:40 - 16:30', label: '9 Lecture' },
];

export interface ClassPeriod {
  slot: number;
  slotsSpan?: number; // default 1
  subjectCode?: string;
  subjectName: string;
  shortName: string;
  facultyName?: string;
  facultyAbb?: string;
  room?: string;
  type?: 'lecture' | 'lab' | 'tutorial' | 'lunch' | 'library' | 'sports' | 'activity';
  color?: string;
}

export interface DaySchedule {
  day: string;
  shortDay: string;
  periods: ClassPeriod[];
}

export const ECE_TIMETABLE_METADATA = {
  university: 'SAGE University, Indore',
  institute: 'IET (Institute of Engineering & Technology)',
  department: 'Electronics and Communication Engineering (ECE)',
  program: 'B.Tech',
  semester: 'I Sem',
  section: 'A',
  room: 'Room No. 03',
  session: 'July-Dec 2026',
  shift: 'SHIFT- FIRST',
  effectiveDate: '19/08/2026',
  preparedBy: 'Ms. Madhvi S Bhanwar',
  checkedBy: 'Dr. Shivangini Morya',
  verifiedBy: 'Dr. Shivangini Morya',
  hod: 'Dr. Shivangini Morya (Head of Department - ECE)',
};

export const ECE_WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    day: 'Monday',
    shortDay: 'MON',
    periods: [
      {
        slot: 1,
        subjectName: 'Engineering Graphics',
        shortName: 'EG',
        facultyName: 'Prof. Vikas Bakshi',
        facultyAbb: 'VB',
        room: 'Room 03',
        type: 'lecture',
        color: '#8B5CF6',
      },
      {
        slot: 2,
        subjectName: 'PCES Lab / Aptitude',
        shortName: 'PCES Lab',
        facultyName: 'Dr. Varun Parmal',
        facultyAbb: 'VP',
        room: 'PCES Lab',
        type: 'lab',
        color: '#EC4899',
      },
      {
        slot: 3,
        subjectName: 'Mathematics-I',
        shortName: 'M-I',
        facultyName: 'Prof. Ruchi Shrivastava',
        facultyAbb: 'RS',
        room: 'Room 03',
        type: 'lecture',
        color: '#3B82F6',
      },
      {
        slot: 4,
        subjectName: 'Chemistry',
        shortName: 'CH',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Room 03',
        type: 'lecture',
        color: '#10B981',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'Basic Electrical',
        shortName: 'BE',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Room 03',
        type: 'lecture',
        color: '#F59E0B',
      },
      {
        slot: 7,
        subjectName: 'Teacher Guardian Lecture',
        shortName: 'TG Lecture',
        room: 'Room 03',
        type: 'activity',
        color: '#06B6D4',
      },
      {
        slot: 8,
        subjectName: 'Lab Work',
        shortName: 'LAB WORK',
        room: 'IET Labs',
        type: 'lab',
        color: '#6366F1',
      },
    ],
  },
  {
    day: 'Tuesday',
    shortDay: 'TUE',
    periods: [
      {
        slot: 1,
        slotsSpan: 2,
        subjectName: 'Engineering Graphics',
        shortName: 'EG',
        facultyName: 'Prof. Vikas Bakshi',
        facultyAbb: 'VB',
        room: 'Drawing Hall',
        type: 'lab',
        color: '#8B5CF6',
      },
      {
        slot: 3,
        subjectName: 'Mathematics-I',
        shortName: 'M-I',
        facultyName: 'Prof. Ruchi Shrivastava',
        facultyAbb: 'RS',
        room: 'Room 03',
        type: 'lecture',
        color: '#3B82F6',
      },
      {
        slot: 4,
        subjectName: 'Environmental Science and Disaster Management',
        shortName: 'ESDM',
        facultyName: 'Prof. Rishabh Yadav',
        facultyAbb: 'RY',
        room: 'Room 03',
        type: 'lecture',
        color: '#06B6D4',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'PCES Lab / Aptitude',
        shortName: 'PCES Lab',
        facultyName: 'Dr. Varun Parmal',
        facultyAbb: 'VP',
        room: 'PCES Lab',
        type: 'lab',
        color: '#EC4899',
      },
      {
        slot: 7,
        subjectName: 'Lab Work',
        shortName: 'LAB WORK',
        room: 'IET Labs',
        type: 'lab',
        color: '#6366F1',
      },
      {
        slot: 8,
        subjectName: 'Professional Communication',
        shortName: 'PCES',
        facultyName: 'Prof. Shubham Sir',
        room: 'Room 03',
        type: 'lecture',
        color: '#EC4899',
      },
    ],
  },
  {
    day: 'Wednesday',
    shortDay: 'WED',
    periods: [
      {
        slot: 1,
        subjectName: 'Basic Electrical',
        shortName: 'BE',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Room 03',
        type: 'lecture',
        color: '#F59E0B',
      },
      {
        slot: 2,
        subjectName: 'Mathematics-I',
        shortName: 'M-I',
        facultyName: 'Prof. Ruchi Shrivastava',
        facultyAbb: 'RS',
        room: 'Room 03',
        type: 'lecture',
        color: '#3B82F6',
      },
      {
        slot: 3,
        subjectName: 'Professional Communication',
        shortName: 'PCES',
        facultyName: 'Prof. Shubham Sir',
        room: 'Room 03',
        type: 'lecture',
        color: '#EC4899',
      },
      {
        slot: 4,
        subjectName: 'Chemistry',
        shortName: 'CH',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Room 03',
        type: 'lecture',
        color: '#10B981',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'Environmental Science and Disaster Management',
        shortName: 'ESDM',
        facultyName: 'Prof. Rishabh Yadav',
        facultyAbb: 'RY',
        room: 'Room 03',
        type: 'lecture',
        color: '#06B6D4',
      },
      {
        slot: 7,
        slotsSpan: 2,
        subjectName: 'Chemistry Lab-I / Library-I',
        shortName: 'CH Lab-I / LIB',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Chemistry Lab / Central Library',
        type: 'lab',
        color: '#10B981',
      },
    ],
  },
  {
    day: 'Thursday',
    shortDay: 'THU',
    periods: [
      {
        slot: 1,
        subjectName: 'Self Study / Prep',
        shortName: 'Free',
        type: 'activity',
        color: '#64748B',
      },
      {
        slot: 2,
        subjectName: 'Engineering Graphics',
        shortName: 'EG',
        facultyName: 'Prof. Vikas Bakshi',
        facultyAbb: 'VB',
        room: 'Room 03',
        type: 'lecture',
        color: '#8B5CF6',
      },
      {
        slot: 3,
        subjectName: 'Basic Electrical',
        shortName: 'BE',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Room 03',
        type: 'lecture',
        color: '#F59E0B',
      },
      {
        slot: 4,
        subjectName: 'Chemistry Lab-I / Library-II',
        shortName: 'CH Lab / LIB',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Chemistry Lab / Library',
        type: 'lab',
        color: '#10B981',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'BE Lab-I / Library-II',
        shortName: 'BE Lab / LIB',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Electrical Lab / Library',
        type: 'lab',
        color: '#F59E0B',
      },
      {
        slot: 7,
        subjectName: 'Mathematics-I Tutorial',
        shortName: 'M-I T',
        facultyName: 'Prof. Ruchi Shrivastava',
        facultyAbb: 'RS',
        room: 'Room 03',
        type: 'tutorial',
        color: '#3B82F6',
      },
    ],
  },
  {
    day: 'Friday',
    shortDay: 'FRI',
    periods: [
      {
        slot: 1,
        slotsSpan: 2,
        subjectName: 'Engineering Graphics',
        shortName: 'EG',
        facultyName: 'Prof. Vikas Bakshi',
        facultyAbb: 'VB',
        room: 'Drawing Hall',
        type: 'lab',
        color: '#8B5CF6',
      },
      {
        slot: 3,
        subjectName: 'Chemistry',
        shortName: 'CH',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Room 03',
        type: 'lecture',
        color: '#10B981',
      },
      {
        slot: 4,
        subjectName: 'Lab Work',
        shortName: 'LAB WORK',
        room: 'IET Labs',
        type: 'lab',
        color: '#6366F1',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'Lab Work',
        shortName: 'LAB WORK',
        room: 'IET Labs',
        type: 'lab',
        color: '#6366F1',
      },
      {
        slot: 7,
        subjectName: 'BE Lab-II / Library-I',
        shortName: 'BE Lab / LIB',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Electrical Lab / Library',
        type: 'lab',
        color: '#F59E0B',
      },
    ],
  },
  {
    day: 'Saturday',
    shortDay: 'SAT',
    periods: [
      {
        slot: 1,
        subjectName: 'Environmental Science and Disaster Management',
        shortName: 'ESDM',
        facultyName: 'Prof. Rishabh Yadav',
        facultyAbb: 'RY',
        room: 'Room 03',
        type: 'lecture',
        color: '#06B6D4',
      },
      {
        slot: 2,
        subjectName: 'Basic Electrical',
        shortName: 'BE',
        facultyName: 'Prof. Ranu Thakur',
        facultyAbb: 'RT',
        room: 'Room 03',
        type: 'lecture',
        color: '#F59E0B',
      },
      {
        slot: 3,
        subjectName: 'Engineering Graphics',
        shortName: 'EG',
        facultyName: 'Prof. Vikas Bakshi',
        facultyAbb: 'VB',
        room: 'Room 03',
        type: 'lecture',
        color: '#8B5CF6',
      },
      {
        slot: 4,
        subjectName: 'Library Session',
        shortName: 'LIBRARY',
        room: 'Central Library',
        type: 'library',
        color: '#14B8A6',
      },
      {
        slot: 5,
        subjectName: 'LUNCH BREAK',
        shortName: 'LUNCH',
        type: 'lunch',
        color: '#64748B',
      },
      {
        slot: 6,
        subjectName: 'Chemistry',
        shortName: 'CH',
        facultyName: 'Prof. Garima Pawar',
        facultyAbb: 'GP',
        room: 'Room 03',
        type: 'lecture',
        color: '#10B981',
      },
      {
        slot: 7,
        slotsSpan: 2,
        subjectName: 'Sports & Extra-Curricular',
        shortName: 'Sports',
        room: 'University Sports Complex',
        type: 'sports',
        color: '#F97316',
      },
    ],
  },
];
