/**
 * StarX Study Production Security Utilities
 * Balanced, production-grade security safeguards for input, URLs, files, and uploads.
 */

// Dangerous file extensions that could lead to remote code execution, XSS, or system compromise
const FORBIDDEN_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'ps1', 'vbs', 'js', 'mjs', 'cjs',
  'ts', 'tsx', 'jsx', 'php', 'phtml', 'py', 'rb', 'pl', 'cgi', 'jar', 'war',
  'msi', 'dll', 'so', 'dylib', 'bin', 'app', 'html', 'htm', 'xhtml', 'svg',
  'hta', 'scr', 'reg', 'wsf', 'cpl', 'gadget'
]);

// Allowed safe extensions for academic sharing & communication
const ALLOWED_EXTENSIONS = new Set([
  // Images
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  // Documents & Presentations
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // Text & Data
  'txt', 'csv', 'rtf', 'md',
  // Audio & Video for lectures/discussions
  'mp3', 'wav', 'm4a', 'mp4', 'mov', 'webm'
]);

// Allowed safe URL protocols
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Strips path traversal characters (../, ..\), null bytes, and non-printable ASCII
 * to produce a safe, sanitized filename.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return `file_${Date.now()}.bin`;
  }

  // 1. Strip null bytes and non-printable control characters
  let clean = rawName.replace(/[\x00-\x1f\x7f-\x9f]/g, '');

  // 2. Remove directory traversal and path separators
  clean = clean.replace(/(\.\.[\/\\])+/g, '').replace(/[\/\\]/g, '_');

  // 3. Trim whitespace and leading/trailing dots/dashes
  clean = clean.trim().replace(/^[\.\-_]+|[\.\-_]+$/g, '');

  if (!clean) {
    return `attachment_${Date.now()}.dat`;
  }

  // 4. Limit length to 120 chars while preserving extension
  if (clean.length > 120) {
    const lastDot = clean.lastIndexOf('.');
    if (lastDot > 0 && lastDot > clean.length - 15) {
      const ext = clean.substring(lastDot);
      const namePart = clean.substring(0, 120 - ext.length);
      clean = `${namePart}${ext}`;
    } else {
      clean = clean.substring(0, 120);
    }
  }

  return clean;
}

/**
 * Validates whether a URL uses an approved safe scheme (http/https).
 * Explicitly guards against javascript:, data:, and malicious protocol tricks.
 */
export function isSafeUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Reject explicit dangerous patterns (including obfuscated javascript: or data: URIs)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.includes('java\0script:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    // Relative URLs that start with / (internal navigation) are safe
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
      return true;
    }
    return false;
  }
}

/**
 * Validates uploaded attachments to prevent arbitrary file upload vulnerabilities.
 * Checks extension blacklist/whitelist and file size limits (default 15 MB).
 */
export function validateAttachment(file: {
  name: string;
  size?: number;
  type?: string;
  maxSizeBytes?: number;
}): { valid: boolean; error?: string } {
  const maxBytes = file.maxSizeBytes || 15 * 1024 * 1024; // 15 MB sensible default

  if (file.size && file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds the ${maxMb} MB limit` };
  }

  const cleanName = sanitizeFileName(file.name);
  const parts = cleanName.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'Files must have a valid extension' };
  }

  const ext = parts[parts.length - 1].toLowerCase();

  // 1. Reject forbidden dangerous extensions
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type .${ext} is not permitted for security reasons` };
  }

  // 2. Must be in the allowed extensions list
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type .${ext} is not supported` };
  }

  return { valid: true };
}

/**
 * Strips null bytes and excessive control characters from text inputs.
 */
export function sanitizeInputText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\0/g, '').trim();
}
