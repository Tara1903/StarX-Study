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

export async function executeSql(query) {
  const token = getAccessToken();
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`SQL Error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

// If run directly:
if (process.argv[1]?.endsWith('db-query.mjs')) {
  let sql = process.argv[2] || "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';";
  if (sql.endsWith('.sql')) {
    import('node:fs').then(async (fs) => {
      const filePath = sql;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      console.log(`Executing SQL file ${filePath} on ${projectRef}...`);
      try {
        const result = await executeSql(fileContent);
        console.log('SQL Execution Success!');
        if (result) console.log('Result:', JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('SQL Execution Failed:', err);
        process.exit(1);
      }
    });
  } else {
    console.log(`Executing query on ${projectRef}...`);
    try {
      const result = await executeSql(sql);
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

