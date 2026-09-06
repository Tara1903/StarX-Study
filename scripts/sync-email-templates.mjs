import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'nfihmauonzffjatpafzj';

function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  // Windows Credential Manager fallback
  try {
    const psCommand = `
      Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      using System.Text;
      public class CredManager {
          [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
          public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
          [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
          public static extern void CredFree(IntPtr credentialPtr);
          [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
          public struct CREDENTIAL {
              public int Flags;
              public int Type;
              public string TargetName;
              public string Comment;
              public long LastWritten;
              public int CredentialBlobSize;
              public IntPtr CredentialBlob;
              public int Persist;
              public int AttributeCount;
              public IntPtr Attributes;
              public string TargetAlias;
              public string UserName;
          }
          public static string GetCredential(string target) {
              IntPtr credPtr;
              if (CredRead(target, 1, 0, out credPtr)) {
                  CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
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

    if (token && token.startsWith('sbp_')) {
      return token;
    }
  } catch (err) {
    // Ignore and proceed to validation
  }

  throw new Error('Supabase Access Token not found. Set SUPABASE_ACCESS_TOKEN env variable or login via `supabase login`.');
}

async function syncEmailTemplates() {
  console.log(`\n=== StarX Study Email Templates Sync ===`);
  console.log(`Target Project Ref: ${projectRef}`);

  const token = getAccessToken();
  console.log('Supabase access token retrieved successfully.');

  const verifyPath = resolve(projectRoot, 'supabase/email-templates/verify-email.html');
  const resetPath = resolve(projectRoot, 'supabase/email-templates/reset-password.html');
  const changePath = resolve(projectRoot, 'supabase/email-templates/change-email.html');

  if (!existsSync(verifyPath) || !existsSync(resetPath) || !existsSync(changePath)) {
    throw new Error('One or more email template HTML files are missing in supabase/email-templates/.');
  }

  const verifyHtml = readFileSync(verifyPath, 'utf-8');
  const resetHtml = readFileSync(resetPath, 'utf-8');
  const changeHtml = readFileSync(changePath, 'utf-8');

  console.log(`Loaded verify-email.html (${verifyHtml.length} bytes)`);
  console.log(`Loaded reset-password.html (${resetHtml.length} bytes)`);
  console.log(`Loaded change-email.html (${changeHtml.length} bytes)`);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Fetch current config
  const getRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!getRes.ok) {
    throw new Error(`Failed to fetch current auth config (${getRes.status}): ${await getRes.text()}`);
  }

  const currentConfig = await getRes.json();
  let allowList = currentConfig.uri_allow_list || '';
  if (!allowList.includes('localhost:3000')) {
    allowList += ',http://localhost:3000,http://localhost:3000/**';
  }

  const updates = [
    {
      name: 'Email Confirmation (verify-email.html)',
      payload: {
        mailer_subjects_confirmation: 'Confirm your StarX Study account',
        mailer_templates_confirmation_content: verifyHtml,
        smtp_sender_name: 'StarX Study',
      },
    },
    {
      name: 'Password Reset (reset-password.html)',
      payload: {
        mailer_subjects_recovery: 'Reset your StarX Study password',
        mailer_templates_recovery_content: resetHtml,
      },
    },
    {
      name: 'Email Change (change-email.html)',
      payload: {
        mailer_subjects_email_change: 'Confirm your new StarX Study email',
        mailer_templates_email_change_content: changeHtml,
      },
    },
    {
      name: 'Redirect URI Allow List',
      payload: {
        uri_allow_list: allowList,
      },
    },
  ];

  for (const update of updates) {
    process.stdout.write(`Syncing ${update.name}... `);
    const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(update.payload),
    });

    if (!patchRes.ok) {
      console.log('FAILED');
      throw new Error(`HTTP ${patchRes.status}: ${await patchRes.text()}`);
    }
    console.log('DONE');
  }

  // Verification
  const verifyRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const finalConfig = await verifyRes.json();

  console.log('\n--- Remote Status ---');
  console.log(`Confirmation: "${finalConfig.mailer_subjects_confirmation}" (${finalConfig.mailer_templates_confirmation_content?.length} bytes)`);
  console.log(`Recovery:     "${finalConfig.mailer_subjects_recovery}" (${finalConfig.mailer_templates_recovery_content?.length} bytes)`);
  console.log(`Email Change: "${finalConfig.mailer_subjects_email_change}" (${finalConfig.mailer_templates_email_change_content?.length} bytes)`);
  console.log(`Allow List:   ${finalConfig.uri_allow_list}`);
  console.log(`SMTP Sender:  ${finalConfig.smtp_sender_name} <${finalConfig.smtp_admin_email}> via ${finalConfig.smtp_host}`);
  console.log('\nAll templates are in sync with the remote Supabase project!\n');
}

syncEmailTemplates().catch((err) => {
  console.error('\nError syncing email templates:', err.message);
  process.exit(1);
});
