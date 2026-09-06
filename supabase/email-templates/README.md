# StarX Study — Supabase Auth + SMTP + Passkeys Configuration Guide

This guide details how Supabase Auth, Custom SMTP, and WebAuthn Passkeys are configured for StarX Study.

---

## 1. Custom SMTP in Supabase

Supabase Auth uses custom SMTP email delivery:

```
STARX STUDY  ──>  SUPABASE AUTH  ──>  SMTP SENDER  ──>  USER INBOX
```

### Configuration Steps in Supabase Dashboard:

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings** → **Authentication** → **SMTP Settings**.
3. Enable **Enable Custom SMTP**:
   - **Sender Email**: `starxstudy.support@gmail.com`
   - **Sender Name**: `StarX Study`
   - **Host**: `smtp.gmail.com`
   - **Port**: `587` (TLS) or `465` (SSL)
4. Save changes.

---

## 2. Supabase Auth URL Configuration

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**.
2. **Site URL**:
   - Local: `http://localhost:3000`
   - Production: `https://student-star-6966.vercel.app`
3. **Redirect URLs** (Add all):
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - `https://student-star-6966.vercel.app/auth/confirm`
   - `https://student-star-6966.vercel.app/auth/callback`
   - `https://student-star-6966.vercel.app/reset-password`

---

## 3. Email Templates Setup

In Supabase Dashboard, navigate to **Authentication** → **Email Templates**:

### 1. Confirm signup (Email Verification)
- **Subject**: `Confirm your StarX Study account`
- **Body**: Copy and paste the contents of [`verify-email.html`](./verify-email.html).

### 2. Reset password
- **Subject**: `Reset your StarX Study password`
- **Body**: Copy and paste the contents of [`reset-password.html`](./reset-password.html).

### 3. Change email address
- **Subject**: `Confirm your new StarX Study email`
- **Body**: Copy and paste the contents of [`change-email.html`](./change-email.html).

---

## 4. WebAuthn Passkeys Setup

1. In Supabase Dashboard, navigate to **Authentication** → **Sign In / Up** → **Passkeys**.
2. Enable **Allow passkey sign-in**.
3. Configure **Relying Party ID**:
   - For local development: `localhost`
   - For production: Your domain (e.g. `student-star-6966.vercel.app`)
   - **Relying Party Display Name**: `StarX Study`
   - **Relying Party ID**: `student-star-6966.vercel.app` *(Note: do NOT include `https://` in RP ID)*
   - **Relying Party Origin**: `https://student-star-6966.vercel.app`
   *(For local testing, RP ID is `localhost` and Origin is `http://localhost:3000`)*.

---

## 5. Security Principles Followed

- Passwords are never stored in custom application tables, local storage, or application cookies.
- Resend API keys are kept strictly in Supabase server SMTP config and never exposed to the frontend browser (`NEXT_PUBLIC_*`).
- Passkeys use standard WebAuthn public-key cryptography; private keys never leave user devices.
- Canonical auth routes:
  - `/login`: Email + Password or "Continue with passkey"
  - `/register` & `/signup`: Multi-step interactive onboarding
  - `/verify-email`: Verification status with 30s resend cooldown
  - `/forgot-password`: Recovery request
  - `/reset-password`: Set new password
  - `/auth/confirm`: Token hash and OTP verification handler
  - `/auth/callback`: PKCE code exchange handler
  - `/profile` (Security tab): Change password, change email, and passkey management (register, list, rename, delete).
