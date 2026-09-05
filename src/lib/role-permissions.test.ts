import { describe, it, expect } from 'vitest';
import { 
  createAssignmentSchema, 
  gradeSubmissionSchema, 
  createAnnouncementSchema, 
  createReportSchema,
  generateInviteCodeSchema,
  enrollMemberSchema
} from './validations/schemas';

describe('Teacher & Institute Head Role Architecture', () => {
  describe('Assignment Management & Grading Validation', () => {
    it('validates valid teacher assignment creation payload', () => {
      const validAssignment = {
        subject_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        title: 'Midterm Lab Report on Digital Logic',
        description: 'Submit your simulation results and schematics.',
        instructions: 'PDF format only, under 10MB.',
        max_marks: 100,
        due_date: '2026-10-15T23:59:59.000Z',
        allow_late_submission: true,
        allow_resubmission: false,
      };

      const result = createAssignmentSchema.safeParse(validAssignment);
      expect(result.success).toBe(true);
    });

    it('rejects assignment creation without title or subject UUID', () => {
      const invalidAssignment = {
        subject_id: 'not-a-uuid',
        title: '',
      };

      const result = createAssignmentSchema.safeParse(invalidAssignment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('validates teacher grading with marks and feedback', () => {
      const validGrading = {
        submission_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        marks: 88.5,
        feedback: 'Excellent work on the Karnaugh mapping. Minor error in question 3.',
        status: 'graded' as const,
      };

      const result = gradeSubmissionSchema.safeParse(validGrading);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.marks).toBe(88.5);
        expect(result.data.status).toBe('graded');
      }
    });

    it('rejects negative grading marks', () => {
      const negativeGrading = {
        submission_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        marks: -10,
        status: 'graded',
      };

      const result = gradeSubmissionSchema.safeParse(negativeGrading);
      expect(result.success).toBe(false);
    });
  });

  describe('Announcement Targeting Validation', () => {
    it('validates institute head university-wide announcement', () => {
      const headAnnouncement = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        title: 'Campus Academic Schedule for Fall 2026',
        content: 'Final examinations will commence from November 20th.',
        priority: 'important' as const,
        target_type: 'university' as const,
        target_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
      };

      const result = createAnnouncementSchema.safeParse(headAnnouncement);
      expect(result.success).toBe(true);
    });

    it('validates teacher subject-scoped announcement', () => {
      const teacherAnnouncement = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        title: 'Class Cancelled Today - Makeup Lab on Friday',
        content: 'Please review chapter 4 before attending.',
        priority: 'urgent' as const,
        target_type: 'subject' as const,
        target_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      const result = createAnnouncementSchema.safeParse(teacherAnnouncement);
      expect(result.success).toBe(true);
    });

    it('rejects announcement with invalid target type', () => {
      const invalidAnnouncement = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        title: 'Invalid Target',
        content: 'Test content',
        target_type: 'global_all_users',
        target_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
      };

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement);
      expect(result.success).toBe(false);
    });
  });

  describe('Moderation & Incident Reporting', () => {
    it('validates a message report submission', () => {
      const validReport = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        reported_user_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
        message_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
        category: 'harassment' as const,
        description: 'Repeated offensive remarks in the subject group chat.',
      };

      const result = createReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('rejects reports with unlisted category', () => {
      const invalidCategoryReport = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        category: 'unauthorized_action',
        description: 'Someone posted something.',
      };

      const result = createReportSchema.safeParse(invalidCategoryReport);
      expect(result.success).toBe(false);
    });
  });

  describe('People Directory & Enrollment', () => {
    it('validates enrollment of faculty and students into subjects', () => {
      const facultyEnrollment = {
        subject_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        user_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
        role: 'teacher' as const,
      };

      const studentEnrollment = {
        subject_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        user_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
        role: 'student' as const,
      };

      expect(enrollMemberSchema.safeParse(facultyEnrollment).success).toBe(true);
      expect(enrollMemberSchema.safeParse(studentEnrollment).success).toBe(true);
    });

    it('validates invite code generation for verified roles only', () => {
      const validCode = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        target_role: 'teacher' as const,
        max_uses: 5,
        expires_in_days: 14,
      };

      expect(generateInviteCodeSchema.safeParse(validCode).success).toBe(true);

      const invalidRoleCode = {
        university_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        target_role: 'super_admin_bypass',
        max_uses: 1,
      };

      expect(generateInviteCodeSchema.safeParse(invalidRoleCode).success).toBe(false);
    });
  });
});
