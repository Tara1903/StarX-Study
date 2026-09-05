import { describe, it, expect } from 'vitest';
import { sanitizeFileName, isSafeUrl, validateAttachment, sanitizeInputText } from './security';
import { updateProfile } from '@/actions/profile';

describe('StudChat Production Security Hardening', () => {
  describe('Filename Sanitization', () => {
    it('strips directory traversal sequences', () => {
      expect(sanitizeFileName('../../etc/passwd')).not.toContain('..');
      expect(sanitizeFileName('../../etc/passwd')).toBe('etc_passwd');
      expect(sanitizeFileName('..\\..\\windows\\system32\\calc.exe')).not.toContain('..');
    });

    it('strips null bytes and control characters', () => {
      expect(sanitizeFileName('test\0file.pdf')).toBe('testfile.pdf');
      expect(sanitizeFileName('test\x01\x1f\x7f.png')).toBe('test.png');
    });

    it('handles whitespace and dangerous leading characters', () => {
      expect(sanitizeFileName('   .hidden.pdf   ')).toBe('hidden.pdf');
      expect(sanitizeFileName('---dashed.jpg---')).toBe('dashed.jpg');
    });

    it('truncates excessively long filenames while preserving the extension', () => {
      const longName = 'a'.repeat(150) + '.pdf';
      const sanitized = sanitizeFileName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(120);
      expect(sanitized.endsWith('.pdf')).toBe(true);
    });

    it('provides fallback for empty input', () => {
      expect(sanitizeFileName('')).toMatch(/\.(bin|dat)$/);
      expect(sanitizeFileName('   ')).toMatch(/\.(bin|dat)$/);
    });
  });

  describe('Safe URL Validation', () => {
    it('accepts legitimate http and https URLs', () => {
      expect(isSafeUrl('https://supabase.co/storage/v1/object/public/file.pdf')).toBe(true);
      expect(isSafeUrl('https://images.unsplash.com/photo-1')).toBe(true);
      expect(isSafeUrl('http://localhost:3000/auth/confirm')).toBe(true);
    });

    it('accepts safe relative internal paths', () => {
      expect(isSafeUrl('/dashboard')).toBe(true);
      expect(isSafeUrl('/chat/123')).toBe(true);
      expect(isSafeUrl('/subjects/math')).toBe(true);
    });

    it('rejects dangerous javascript: schemes', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
      expect(isSafeUrl('java\0script:alert(1)')).toBe(false);
    });

    it('rejects data: URIs that could contain malicious payload or HTML', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('data:application/javascript,alert(1)')).toBe(false);
    });

    it('rejects protocol-relative and filesystem schemes', () => {
      expect(isSafeUrl('//evil.com/phish')).toBe(false);
      expect(isSafeUrl('file:///C:/boot.ini')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    });
  });

  describe('Attachment Validation', () => {
    it('accepts valid academic attachments', () => {
      expect(validateAttachment({ name: 'lecture_notes.pdf', size: 1024 * 1024 }).valid).toBe(true);
      expect(validateAttachment({ name: 'diagram.png', size: 500 * 1024 }).valid).toBe(true);
      expect(validateAttachment({ name: 'research_paper.docx', size: 2 * 1024 * 1024 }).valid).toBe(true);
      expect(validateAttachment({ name: 'grades.xlsx', size: 100 * 1024 }).valid).toBe(true);
      expect(validateAttachment({ name: 'presentation.pptx', size: 4 * 1024 * 1024 }).valid).toBe(true);
    });

    it('rejects dangerous executable and script extensions', () => {
      expect(validateAttachment({ name: 'hack.exe' }).valid).toBe(false);
      expect(validateAttachment({ name: 'exploit.sh' }).valid).toBe(false);
      expect(validateAttachment({ name: 'payload.bat' }).valid).toBe(false);
      expect(validateAttachment({ name: 'webshell.php' }).valid).toBe(false);
      expect(validateAttachment({ name: 'bad.js' }).valid).toBe(false);
      expect(validateAttachment({ name: 'vector.svg' }).valid).toBe(false);
      expect(validateAttachment({ name: 'page.html' }).valid).toBe(false);
    });

    it('enforces maximum size limit', () => {
      const oversized = 20 * 1024 * 1024; // 20 MB
      const result = validateAttachment({ name: 'notes.pdf', size: oversized, maxSizeBytes: 15 * 1024 * 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('limit');
    });

    it('rejects files without an extension', () => {
      expect(validateAttachment({ name: 'unknown_file' }).valid).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('strips null bytes from text', () => {
      expect(sanitizeInputText('Hello\0World')).toBe('HelloWorld');
    });

    it('trims outer whitespace', () => {
      expect(sanitizeInputText('   clean message   ')).toBe('clean message');
    });
  });

  describe('Profile Privilege Escalation Protection', () => {
    it('rejects modification of role in updateProfile', async () => {
      const res = await updateProfile({ role: 'super_admin' });
      expect(res.error).toBeDefined();
      expect(res.error).toContain('role');
    });

    it('rejects modification of is_super_admin in updateProfile', async () => {
      const res = await updateProfile({ is_super_admin: true });
      expect(res.error).toBeDefined();
      expect(res.error).toContain('is_super_admin');
    });

    it('rejects modification of university_id in updateProfile', async () => {
      const res = await updateProfile({ university_id: '123' });
      expect(res.error).toBeDefined();
      expect(res.error).toContain('university_id');
    });
  });
});
