const fs = require('fs');
const path = require('path');

function regexReplaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const [searchValue, replaceValue] of replacements) {
    content = content.replace(searchValue, replaceValue);
  }
  fs.writeFileSync(fullPath, content);
}

const files = [
  'src/components/chat/message-input.tsx',
  'src/components/chat/message-item.tsx',
  'src/hooks/use-presence.ts',
  'src/hooks/use-typing-indicator.ts',
  'src/hooks/use-notifications.ts'
];

for (const file of files) {
  regexReplaceInFile(file, [
    [/profile-provider/g, "user-provider"],
    [/useProfile/g, "useUser"]
  ]);
}
