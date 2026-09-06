import { execSync } from 'node:child_process';

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nfihmauonzffjatpafzj';

function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  try {
    const psCommand = `
      Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      using System.Text;
      public class CredManager {
          [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
          public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
          [DllImport("advapi32.dll")]
          public static extern void CredFree(IntPtr credentialPtr);
          [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
          public struct CREDENTIAL {
              public int Flags, Type;
              public string TargetName, Comment;
              public long LastWritten;
              public int CredentialBlobSize;
              public IntPtr CredentialBlob;
              public int Persist, AttributeCount;
              public IntPtr Attributes;
          }
          public static string GetCredential(string target) {
              IntPtr credPtr;
              if (CredRead(target, 1, 0, out credPtr)) {
                  var cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                  byte[] bytes = new byte[cred.CredentialBlobSize];
                  Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
                  CredFree(credPtr);
                  return Encoding.UTF8.GetString(bytes);
              }
              return null;
          }
      }
'@
      $token = [CredManager]::GetCredential('LegacyGeneric:target=Supabase CLI:supabase')
      [Console]::Out.Write($token)
    `;
    const token = execSync('powershell -NoProfile -NonInteractive -Command -', {
      input: psCommand,
      encoding: 'utf-8',
    }).trim();
    if (token && token.startsWith('sbp_')) return token;
  } catch (err) {}
  throw new Error('Supabase Access Token not found.');
}

async function run() {
  const token = getAccessToken();
  const targetSenderEmail = process.argv[2];
  const targetSenderName = process.argv[3] || 'StudChat';

  console.log(`\n======================================================`);
  console.log(`StudChat Production SMTP & Resend Domain Manager`);
  console.log(`Target Supabase Project: ${projectRef}`);
  console.log(`======================================================\n`);

  // 1. Fetch current Auth Config
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch auth config (${res.status}): ${await res.text()}`);
  }

  const authConfig = await res.json();
  const currentSender = authConfig.smtp_admin_email || 'None';
  const currentHost = authConfig.smtp_host || 'None';

  console.log(`Current SMTP Provider:  ${currentHost}`);
  console.log(`Current Sender Email:   ${currentSender}`);
  console.log(`Current Sender Name:    ${authConfig.smtp_sender_name || 'None'}`);

  if (!targetSenderEmail) {
    console.log(`\n--- Production Deliverability Notice ---`);
    if (currentSender === 'onboarding@resend.dev') {
      console.log(`⚠️  Currently using 'onboarding@resend.dev' (Resend Sandbox).`);
      console.log(`   In this mode, verification emails can ONLY be sent to your registered developer email.`);
      console.log(`\nTo send emails to ANY student or teacher email address:`);
      console.log(`1. Go to https://resend.com/domains and click 'Add Domain' (e.g. 'studchat.in' or 'mail.yourdomain.com').`);
      console.log(`2. Add the DNS records provided by Resend to your domain registrar:`);
      console.log(`   - Type: TXT   | Name: resend._domainkey | Value: <DKIM-key>`);
      console.log(`   - Type: TXT   | Name: @ or subdomain   | Value: v=spf1 include:resend.com ~all`);
      console.log(`   - Type: MX    | Name: @ or subdomain   | Value: feedback-smtp.resend.com (Priority 10)`);
      console.log(`3. Once verified in Resend, run this command to update Supabase in 1 click:`);
      console.log(`   node scripts/update-smtp-domain.mjs noreply@yourdomain.com "StudChat"`);
    } else {
      console.log(`✅ Configured with custom sending email: ${currentSender}`);
    }
    return;
  }

  // Validate email format
  if (!targetSenderEmail.includes('@') || !targetSenderEmail.includes('.')) {
    console.error(`❌ Invalid email address: "${targetSenderEmail}". Please provide a valid email (e.g. noreply@studchat.in).`);
    process.exit(1);
  }

  console.log(`\nUpdating Supabase Auth SMTP sender to: ${targetSenderEmail} (${targetSenderName})...`);

  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      smtp_admin_email: targetSenderEmail,
      smtp_sender_name: targetSenderName,
    })
  });

  if (!patchRes.ok) {
    throw new Error(`Failed to update auth config (${patchRes.status}): ${await patchRes.text()}`);
  }

  console.log(`✅ Successfully updated remote Supabase Auth configuration!`);
  console.log(`New Sender Email: ${targetSenderEmail}`);
  console.log(`New Sender Name:  ${targetSenderName}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
