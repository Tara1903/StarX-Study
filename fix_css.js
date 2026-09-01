const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace the entire section from /* ============================================ Light Mode to the end of .dark { ... }
const regex = /\/\* ============================================\s*Light Mode[\s\S]*?\.dark\s*\{[\s\S]*?\}/;

const newVars = `/* ============================================
   Dark Mode Only (studchat brand)
   ============================================ */
:root, .dark {
  --background: #050B16;
  --foreground: #F5F7FB;

  --card: #111D31;
  --card-foreground: #F5F7FB;

  --popover: #111D31;
  --popover-foreground: #F5F7FB;

  --primary: #168BFF;
  --primary-foreground: #ffffff;

  --secondary: #0C1628;
  --secondary-foreground: #F5F7FB;

  --muted: #16243B;
  --muted-foreground: #6F7B8E;

  --accent: #4936E8;
  --accent-foreground: #ffffff;

  --destructive: #dc2626;
  --destructive-foreground: #ffffff;

  --success: #059669;
  --success-foreground: #ffffff;

  --warning: #d97706;
  --warning-foreground: #ffffff;

  --border: rgba(255, 255, 255, 0.07);
  --input: rgba(255, 255, 255, 0.10);
  --ring: #168BFF;

  --radius: 0.6rem;

  --sidebar: #071735;
  --sidebar-foreground: #F5F7FB;
  --sidebar-accent: #111D31;
  --sidebar-accent-foreground: #F5F7FB;
  --sidebar-border: rgba(255, 255, 255, 0.07);
}`;

code = code.replace(regex, newVars);

// Strip out the dark mode comment before .dark
code = code.replace(/\/\* ============================================\s*Dark Mode[\s\S]*?\*\/\r?\n/, '');

fs.writeFileSync('src/app/globals.css', code);
