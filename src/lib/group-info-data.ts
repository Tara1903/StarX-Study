import { ECE_SUBJECTS } from '@/lib/ece-data';
import { getConversationById, type ChatConversation } from '@/lib/conversations';
import { getStoredMedia, type StoredMediaItem } from '@/lib/stored-media';

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  isAdmin: boolean;
  avatarUrl?: string | null;
  avatarType?: 'uploaded' | 'preset' | 'emoji' | 'initials';
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  subtitle: string;
  bio?: string;
  joinedAt: string;
  phone?: string;
}

export interface SharedMediaItem {
  id: string;
  conversationId: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  size?: string;
  sharedBy: string;
  sharedAt: string;
  domain?: string;
  thumbnailUrl?: string;
}

export interface GroupInfoData {
  id: string;
  type: 'subject' | 'personal';
  name: string;
  description: string;
  avatarUrl?: string | null;
  avatarType?: 'uploaded' | 'preset' | 'emoji' | 'initials';
  avatarPresetId?: string | null;
  avatarEmoji?: string | null;
  color?: string;
  facultyAbb?: string;
  room?: string;
  code?: string;
  memberCount: number;
  teacherCount: number;
  members: GroupMember[];
  media: SharedMediaItem[];
  pinnedMessages: {
    id: string;
    content: string;
    senderName: string;
    pinnedAt: string;
  }[];
  isMuted?: boolean;
}

// -------------------------------------------------------------
// Realistic ECE Cohort Student & Faculty Member Roster
// -------------------------------------------------------------
const COHORT_STUDENTS: Omit<GroupMember, 'isAdmin' | 'role'>[] = [
  {
    id: 'user-aarav',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 01',
    bio: 'B.Tech ECE 1st Year • Robotics & Embedded Systems.',
    avatarType: 'preset',
    avatarPresetId: 'tech_coder',
    avatarEmoji: '🚀',
    joinedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'user-priya',
    name: 'Priya Patel',
    email: 'priya.patel@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 02',
    bio: 'B.Tech ECE 1st Year • VLSI & Circuit Design.',
    avatarType: 'preset',
    avatarPresetId: 'creative_mind',
    avatarEmoji: '⚡',
    joinedAt: '2026-08-10T09:15:00Z',
  },
  {
    id: 'user-rahul',
    name: 'Rahul Verma',
    email: 'rahul.verma@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 03',
    bio: 'SAGE Student Council • Signal Processing.',
    avatarType: 'preset',
    avatarPresetId: 'sports_star',
    avatarEmoji: '🎯',
    joinedAt: '2026-08-11T10:00:00Z',
  },
  {
    id: 'user-sneha',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 04',
    bio: 'Academic Prefect • Applied Mathematics Enthusiast.',
    avatarType: 'preset',
    avatarPresetId: 'scholastic',
    avatarEmoji: '📚',
    joinedAt: '2026-08-11T10:30:00Z',
  },
  {
    id: 'user-rohan',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 05',
    bio: 'Microcontroller Hobbyist • IoT club member.',
    avatarType: 'preset',
    avatarPresetId: 'tech_coder',
    avatarEmoji: '💡',
    joinedAt: '2026-08-12T11:00:00Z',
  },
  {
    id: 'user-ananya',
    name: 'Ananya Joshi',
    email: 'ananya.joshi@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 06',
    bio: 'ECE Section A • Creative designer & coder.',
    avatarType: 'preset',
    avatarPresetId: 'creative_mind',
    avatarEmoji: '🎨',
    joinedAt: '2026-08-12T11:45:00Z',
  },
  {
    id: 'user-vikram',
    name: 'Vikram Rathore',
    email: 'vikram.rathore@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 07',
    bio: 'Hardware labs & sports captain.',
    avatarType: 'preset',
    avatarPresetId: 'sports_star',
    avatarEmoji: '🏆',
    joinedAt: '2026-08-13T09:20:00Z',
  },
  {
    id: 'user-divya',
    name: 'Divya Nair',
    email: 'divya.nair@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 08',
    bio: 'Telecommunications & Antenna Theory interest.',
    avatarType: 'preset',
    avatarPresetId: 'scholastic',
    avatarEmoji: '🔬',
    joinedAt: '2026-08-13T10:10:00Z',
  },
  {
    id: 'user-aditya',
    name: 'Aditya Singh',
    email: 'aditya.singh@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 09',
    bio: 'Python programmer & competitive coder.',
    avatarType: 'preset',
    avatarPresetId: 'tech_coder',
    avatarEmoji: '💻',
    joinedAt: '2026-08-14T14:00:00Z',
  },
  {
    id: 'user-neha',
    name: 'Neha Mishra',
    email: 'neha.mishra@sageuniversity.edu.in',
    subtitle: 'B.Tech ECE • Roll No. 10',
    bio: 'Circuits, Analog electronics & Optics.',
    avatarType: 'preset',
    avatarPresetId: 'scholastic',
    avatarEmoji: '📖',
    joinedAt: '2026-08-14T14:30:00Z',
  },
];

// -------------------------------------------------------------
// Curated Shared Media, Docs, and Links Dataset
// -------------------------------------------------------------
const SHARED_MEDIA_SEEDS: Record<string, SharedMediaItem[]> = {
  'math-1': [
    {
      id: 'media-m1-1',
      conversationId: 'math-1',
      type: 'image',
      name: 'Eigenvalues_Diagonalization_Chart.png',
      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
      size: '2.1 MB',
      sharedBy: 'Prof. Ruchi Shrivastava',
      sharedAt: 'Sep 2',
    },
    {
      id: 'media-m1-2',
      conversationId: 'math-1',
      type: 'document',
      name: 'Tutorial_Sheet_4_Linear_Algebra_Solutions.pdf',
      url: '#',
      size: '3.4 MB',
      sharedBy: 'Prof. Ruchi Shrivastava',
      sharedAt: 'Sep 1',
    },
    {
      id: 'media-m1-3',
      conversationId: 'math-1',
      type: 'document',
      name: 'Unit_1_Calculus_Formula_Reference.pdf',
      url: '#',
      size: '1.8 MB',
      sharedBy: 'Sneha Kulkarni',
      sharedAt: 'Aug 29',
    },
    {
      id: 'media-m1-4',
      conversationId: 'math-1',
      type: 'image',
      name: 'Matrix_Rank_Proof_Whiteboard.jpg',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      size: '1.9 MB',
      sharedBy: 'Aarav Sharma',
      sharedAt: 'Aug 28',
    },
    {
      id: 'media-m1-5',
      conversationId: 'math-1',
      type: 'link',
      name: 'MIT OpenCourseWare: 18.06 Linear Algebra Lectures',
      url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
      domain: 'ocw.mit.edu',
      sharedBy: 'Prof. Ruchi Shrivastava',
      sharedAt: 'Aug 25',
    },
    {
      id: 'media-m1-6',
      conversationId: 'math-1',
      type: 'link',
      name: 'Desmos 3D Matrix Visualization Tool',
      url: 'https://www.desmos.com/matrix',
      domain: 'desmos.com',
      sharedBy: 'Rahul Verma',
      sharedAt: 'Aug 22',
    },
  ],
  'chemistry': [
    {
      id: 'media-ch-1',
      conversationId: 'chemistry',
      type: 'image',
      name: 'Water_Hardness_EDTA_Titration_Apparatus.jpg',
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      size: '2.5 MB',
      sharedBy: 'Prof. Garima Pawar',
      sharedAt: 'Sep 3',
    },
    {
      id: 'media-ch-2',
      conversationId: 'chemistry',
      type: 'document',
      name: 'Water_Technology_Lab_Manual_Exp3.pdf',
      url: '#',
      size: '4.2 MB',
      sharedBy: 'Prof. Garima Pawar',
      sharedAt: 'Sep 2',
    },
    {
      id: 'media-ch-3',
      conversationId: 'chemistry',
      type: 'document',
      name: 'Spectroscopy_UV_Vis_NMR_Notes.pdf',
      url: '#',
      size: '5.1 MB',
      sharedBy: 'Prof. Garima Pawar',
      sharedAt: 'Aug 30',
    },
    {
      id: 'media-ch-4',
      conversationId: 'chemistry',
      type: 'image',
      name: 'Phase_Rule_One_Component_Water_Diagram.png',
      url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
      size: '1.6 MB',
      sharedBy: 'Priya Patel',
      sharedAt: 'Aug 27',
    },
    {
      id: 'media-ch-5',
      conversationId: 'chemistry',
      type: 'link',
      name: 'Virtual Chemistry Lab: EDTA Titration Simulation',
      url: 'https://vlab.amrita.edu/?sub=2&brch=193&sim=350&cnt=1',
      domain: 'vlab.amrita.edu',
      sharedBy: 'Prof. Garima Pawar',
      sharedAt: 'Aug 26',
    },
  ],
};

export function getGroupInfo(conversationId: string): GroupInfoData | null {
  if (!conversationId) return null;
  let conv = getConversationById(conversationId);
  if (!conv) {
    const eceMatch = ECE_SUBJECTS.find(
      (s) => s.id.toLowerCase() === conversationId.toLowerCase() || s.code.toLowerCase() === conversationId.toLowerCase()
    );
    if (eceMatch) {
      conv = {
        id: eceMatch.id,
        type: 'subject',
        name: eceMatch.name,
        subtitle: `${eceMatch.facultyAbb} • ${eceMatch.facultyName}`,
        color: eceMatch.color,
        avatarType: 'initials',
        lastActivityTimestamp: new Date().toISOString(),
        unreadCount: 0,
        facultyName: eceMatch.facultyName,
        facultyAbb: eceMatch.facultyAbb,
        room: eceMatch.room,
        code: eceMatch.code,
      };
    }
  }
  if (!conv) return null;

  const isSubject = conv.type === 'subject';

  // Find corresponding ECE subject metadata if applicable
  const ece = ECE_SUBJECTS.find(
    (s) => s.id.toLowerCase() === conversationId.toLowerCase() || s.code.toLowerCase() === conversationId.toLowerCase()
  );

  // 1. Members assembly
  let members: GroupMember[] = [];
  let teacherCount = 0;

  if (isSubject) {
    // Primary Teacher
    const teacherName = ece?.facultyName || conv.facultyName || 'Prof. Ruchi Shrivastava';
    const teacherAbb = ece?.facultyAbb || conv.facultyAbb || 'Faculty';
    members.push({
      id: `teacher-${conv.id}`,
      name: teacherName,
      email: `${teacherAbb.toLowerCase()}@sageuniversity.edu.in`,
      role: 'teacher',
      isAdmin: true,
      subtitle: `Faculty • ${ece?.shortName || conv.name} Course Coordinator`,
      bio: `Faculty In-charge for ${conv.name} • Department of Electronics & Communication Engineering.`,
      avatarType: 'preset',
      avatarPresetId: 'scholastic',
      avatarEmoji: '🎓',
      joinedAt: '2026-07-15T09:00:00Z',
    });
    teacherCount++;

    // HOD / Mentor Teacher
    members.push({
      id: 'teacher-hod',
      name: 'Dr. Shivangini Morya',
      email: 'hod.ece@sageuniversity.edu.in',
      role: 'teacher',
      isAdmin: true,
      subtitle: 'Head of Department • ECE',
      bio: 'Head of Department, Electronics and Communication Engineering, IET SAGE University.',
      avatarType: 'preset',
      avatarPresetId: 'scholastic',
      avatarEmoji: '🏛️',
      joinedAt: '2026-07-01T09:00:00Z',
    });
    teacherCount++;

    // Add Cohort Students
    COHORT_STUDENTS.forEach((st) => {
      members.push({
        ...st,
        role: 'student',
        isAdmin: false,
      });
    });
  } else {
    // Personal Chat Info: 2 members (Current User + Contact)
    members.push({
      id: 'current-user-demo',
      name: 'You (Aarav Sharma)',
      email: 'aarav.sharma@sageuniversity.edu.in',
      role: 'student',
      isAdmin: false,
      subtitle: 'B.Tech ECE 1st Year',
      avatarType: 'preset',
      avatarPresetId: 'tech_coder',
      avatarEmoji: '🚀',
      joinedAt: '2026-08-01T00:00:00Z',
    });

    members.push({
      id: conv.id,
      name: conv.name,
      email: `${conv.id}@sageuniversity.edu.in`,
      role: conv.role === 'teacher' ? 'teacher' : 'student',
      isAdmin: conv.role === 'teacher',
      subtitle: conv.subtitle,
      bio: conv.bio,
      avatarUrl: conv.avatarUrl,
      avatarType: conv.avatarType,
      avatarPresetId: conv.avatarPresetId,
      avatarEmoji: conv.avatarEmoji,
      joinedAt: '2026-08-01T00:00:00Z',
    });

    teacherCount = conv.role === 'teacher' ? 1 : 0;
  }

  // 2. Media items: combine pre-seeded items with any user-saved media
  const baseMedia = SHARED_MEDIA_SEEDS[conv.id] || [
    {
      id: `media-${conv.id}-default`,
      conversationId: conv.id,
      type: 'document',
      name: `${conv.name.replace(/\s+/g, '_')}_Syllabus_Scheme.pdf`,
      url: '#',
      size: '2.1 MB',
      sharedBy: conv.facultyName || 'Faculty',
      sharedAt: 'Aug 20',
    },
  ];

  // 3. Pinned messages
  const pinnedMessages = [
    {
      id: `pin-${conv.id}-1`,
      content: isSubject
        ? `Reminder: Mid-Semester exam syllabus covers Units 1, 2, and 3. Practical file submissions are mandatory before signing hall tickets.`
        : `Class meeting at Room No. 03 at 10:45 AM.`,
      senderName: conv.facultyName || 'Faculty',
      pinnedAt: 'Yesterday',
    },
  ];

  const defaultDescription = isSubject
    ? (ece?.description || `Official cohort discussion group for ${conv.name}. Students and faculty share lecture slides, problem sets, timetable alerts, and academic clarifications here.`)
    : (conv.bio || `1-on-1 direct conversation with ${conv.name}.`);

  return {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    description: defaultDescription,
    avatarUrl: conv.avatarUrl,
    avatarType: conv.avatarType,
    avatarPresetId: conv.avatarPresetId,
    avatarEmoji: conv.avatarEmoji,
    color: conv.color || '#3B82F6',
    facultyAbb: conv.facultyAbb,
    room: conv.room || 'Room No. 03',
    code: conv.code,
    memberCount: members.length,
    teacherCount,
    members,
    media: baseMedia,
    pinnedMessages,
    isMuted: conv.isMuted,
  };
}

/**
 * Returns eligible students/faculty in the department who can be added.
 */
export function getEligibleUsersToAdd(conversationId: string, currentMemberIds: string[]): GroupMember[] {
  const allCandidates: GroupMember[] = [
    {
      id: 'cand-1',
      name: 'Kavita Deshmukh',
      email: 'kavita.deshmukh@sageuniversity.edu.in',
      role: 'student',
      isAdmin: false,
      subtitle: 'B.Tech ECE • Section A • Roll No. 11',
      bio: 'Enthusiastic about Signal Processing and Microcontrollers.',
      avatarType: 'preset',
      avatarPresetId: 'scholastic',
      avatarEmoji: '🌟',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'cand-2',
      name: 'Harshvardhan Rao',
      email: 'harsh.rao@sageuniversity.edu.in',
      role: 'student',
      isAdmin: false,
      subtitle: 'B.Tech ECE • Section A • Roll No. 12',
      bio: 'Analog circuit design & robotics team member.',
      avatarType: 'preset',
      avatarPresetId: 'tech_coder',
      avatarEmoji: '⚡',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'cand-3',
      name: 'Prof. Vikas Bakshi',
      email: 'vikas.bakshi@sageuniversity.edu.in',
      role: 'teacher',
      isAdmin: true,
      subtitle: 'Faculty • Engineering Graphics',
      bio: 'Assistant Professor, Department of Mechanical & Allied Engineering.',
      avatarType: 'preset',
      avatarPresetId: 'scholastic',
      avatarEmoji: '📐',
      joinedAt: new Date().toISOString(),
    },
  ];

  return allCandidates.filter((c) => !currentMemberIds.includes(c.id));
}
