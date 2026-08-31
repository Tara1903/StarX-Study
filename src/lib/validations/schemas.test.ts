import { describe, it, expect } from 'vitest';
import { sendMessageSchema, createAssignmentSchema } from './schemas';

describe('Validation Schemas', () => {
  it('validates correct message data', () => {
    const result = sendMessageSchema.safeParse({
      subject_id: '123e4567-e89b-12d3-a456-426614174000',
      content: 'Valid message content'
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages', () => {
    const result = sendMessageSchema.safeParse({
      subject_id: '123e4567-e89b-12d3-a456-426614174000',
      content: ''
    });
    expect(result.success).toBe(false);
  });

  it('validates assignment data', () => {
    const result = createAssignmentSchema.safeParse({
      subject_id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Math Homework',
      max_marks: 100,
      allow_late_submission: true,
      allow_resubmission: false
    });
    expect(result.success).toBe(true);
  });
});
