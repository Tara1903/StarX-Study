import { describe, it, expect } from 'vitest';
import { getGroupInfo, getEligibleUsersToAdd } from './group-info-data';

describe('Group Info Data Module', () => {
  it('retrieves group info for subject group with teachers and student cohort', () => {
    const mathGroup = getGroupInfo('math-1');
    expect(mathGroup).not.toBeNull();
    expect(mathGroup?.name).toBe('Mathematics-I');
    expect(mathGroup?.type).toBe('subject');
    expect(mathGroup?.memberCount).toBeGreaterThanOrEqual(10);
    expect(mathGroup?.teacherCount).toBeGreaterThanOrEqual(1);

    // Verify primary teacher is flagged as admin
    const teachers = mathGroup?.members.filter((m) => m.role === 'teacher');
    expect(teachers?.length).toBeGreaterThanOrEqual(1);
    expect(teachers?.[0].isAdmin).toBe(true);

    // Verify students exist in member list
    const students = mathGroup?.members.filter((m) => m.role === 'student');
    expect(students?.length).toBeGreaterThan(5);
  });

  it('retrieves media, docs, and links for subject group', () => {
    const chemGroup = getGroupInfo('chemistry');
    expect(chemGroup).not.toBeNull();
    expect(chemGroup?.media.length).toBeGreaterThan(0);

    const hasImages = chemGroup?.media.some((m) => m.type === 'image');
    const hasDocs = chemGroup?.media.some((m) => m.type === 'document');
    const hasLinks = chemGroup?.media.some((m) => m.type === 'link');

    expect(hasImages).toBe(true);
    expect(hasDocs).toBe(true);
    expect(hasLinks).toBe(true);
  });

  it('retrieves chat info for personal chat', () => {
    const aaravChat = getGroupInfo('p-aarav');
    expect(aaravChat).not.toBeNull();
    expect(aaravChat?.name).toBe('Aarav Sharma');
    expect(aaravChat?.type).toBe('personal');
    expect(aaravChat?.memberCount).toBe(2);
  });

  it('filters candidates for adding members', () => {
    const currentMemberIds = ['user-aarav', 'user-priya'];
    const candidates = getEligibleUsersToAdd('math-1', currentMemberIds);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((c) => !currentMemberIds.includes(c.id))).toBe(true);
  });
});
