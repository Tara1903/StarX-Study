# StudChat — Supabase Auth + Resend SMTP + Passkeys Configuration Guide

This guide details how Supabase Auth, Resend SMTP, and WebAuthn Passkeys are configured for StudChat.

---

## 1. Resend Custom SMTP in Supabase

Supabase Auth uses Resend as its custom SMTP email delivery provider:

```
STUDCHAT  ──>  SUPABASE AUTH  ──>  RESEND SMTP  ──>  USER INBOX
```

### Configuration Steps in Supabase Dashboard:

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Project Settings** → **Authentication** → **SMTP Settings**.
3. Enable **Enable Custom SMTP**:
   - **Sender Email**: `onboarding@resend.dev` (for initial testing/dev) or your verified domain sender (e.g. `no-reply@studchat.com`).
   - **Sender Name**: `studchat`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: Your Resend API Key (`re_...`)
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
- **Subject**: `Verify your studchat email`
- **Body**: Copy and paste the contents of [`verify-email.html`](./verify-email.html).

### 2. Reset password
- **Subject**: `Reset your studchat password`
- **Body**: Copy and paste the contents of [`reset-password.html`](./reset-password.html).

### 3. Change email address
- **Subject**: `Confirm your new studchat email`
- **Body**: Copy and paste the contents of [`change-email.html`](./change-email.html).

---

## 4. WebAuthn Passkey Configuration

Passkeys enable passwordless biometric sign-in (Face ID, Touch ID, Windows Hello, device PIN):

1. In Supabase Dashboard, navigate to **Authentication** → **Passkeys**.
2. Enable **Allow passkey sign-in**.
3. Configure Relying Party (RP) settings:
   - **Relying Party Display Name**: `studchat`
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
