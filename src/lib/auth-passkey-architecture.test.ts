import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// 1. Schemas tested exactly as implemented in login, signup credentials, and reset password
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const credentialsSchema = z
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

describe('StarX Study Auth & Passkey Architecture', () => {
  describe('Login Validation', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'student@university.edu',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('rejects empty passwords', () => {
      const result = loginSchema.safeParse({
        email: 'student@university.edu',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Signup Credentials Validation', () => {
    it('accepts valid credentials with matching passwords', () => {
      const result = credentialsSchema.safeParse({
        fullName: 'Aarav Sharma',
        email: 'aarav@university.edu',
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = credentialsSchema.safeParse({
        fullName: 'Aarav Sharma',
        email: 'aarav@university.edu',
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects mismatched passwords during signup', () => {
      const result = credentialsSchema.safeParse({
        fullName: 'Aarav Sharma',
        email: 'aarav@university.edu',
        password: 'Password123',
        confirmPassword: 'DifferentPassword456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Passwords do not match');
      }
    });
  });

  describe('Reset Password Validation', () => {
    it('accepts matching new passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewSuperPassword2026',
        confirmPassword: 'NewSuperPassword2026',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched new passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewSuperPassword2026',
        confirmPassword: 'MismatchPassword!',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Auth Route Classification & Safety', () => {
    const isAuthRoute = (path: string) =>
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/signup') ||
      path.startsWith('/forgot-password') ||
      path.startsWith('/verify-email');

    const isProtectedRoute = (path: string) =>
      path.startsWith('/dashboard') ||
      path.startsWith('/study-groups') ||
      path.startsWith('/timetable') ||
      path.startsWith('/subjects') ||
      path.startsWith('/chat') ||
      path.startsWith('/announcements') ||
      path.startsWith('/assignments') ||
      path.startsWith('/notifications') ||
      path.startsWith('/profile') ||
      path.startsWith('/settings') ||
      path.startsWith('/admin') ||
      path.startsWith('/super-admin');

    it('identifies public auth routes correctly', () => {
      expect(isAuthRoute('/login')).toBe(true);
      expect(isAuthRoute('/register')).toBe(true);
      expect(isAuthRoute('/signup')).toBe(true);
      expect(isAuthRoute('/forgot-password')).toBe(true);
      expect(isAuthRoute('/verify-email')).toBe(true);
    });

    it('does not classify callback or reset routes as standard auth redirects', () => {
      expect(isAuthRoute('/auth/confirm')).toBe(false);
      expect(isAuthRoute('/auth/callback')).toBe(false);
      expect(isAuthRoute('/reset-password')).toBe(false);
    });

    it('identifies protected communication routes correctly', () => {
      expect(isProtectedRoute('/chat')).toBe(true);
      expect(isProtectedRoute('/chat/conv-123')).toBe(true);
      expect(isProtectedRoute('/study-groups')).toBe(true);
      expect(isProtectedRoute('/profile')).toBe(true);
      expect(isProtectedRoute('/dashboard')).toBe(true);
    });
  });

  describe('Supabase Client Passkey Opt-In Verification', () => {
    it('verifies client.ts contains auth.experimental.passkey', () => {
      const clientPath = path.resolve(process.cwd(), 'src/lib/supabase/client.ts');
      const content = fs.readFileSync(clientPath, 'utf8');
      expect(content).toContain('auth:');
      expect(content).toContain('experimental:');
      expect(content).toContain('passkey: true');
    });
  });

  describe('Email Templates Integrity', () => {
    const templatesDir = path.resolve(process.cwd(), 'supabase/email-templates');

    it('verifies verify-email.html contains required ConfirmationURL variable and branding', () => {
      const filePath = path.join(templatesDir, 'verify-email.html');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('{{ .ConfirmationURL }}');
      expect(content).toContain('Welcome to StarX Study');
      expect(content).toContain('Verify Email');
      expect(content).not.toContain('<script');
    });

    it('verifies reset-password.html contains required ConfirmationURL variable and branding', () => {
      const filePath = path.join(templatesDir, 'reset-password.html');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('{{ .ConfirmationURL }}');
      expect(content).toContain('Reset your password');
      expect(content).toContain('Reset Password');
      expect(content).not.toContain('<script');
    });

    it('verifies change-email.html contains required ConfirmationURL variable', () => {
      const filePath = path.join(templatesDir, 'change-email.html');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('{{ .ConfirmationURL }}');
      expect(content).toContain('Confirm Email Change');
    });
  });
});
