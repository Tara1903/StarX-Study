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

// Revert variables to what they were or fix their usages.
regexReplaceInFile('src/actions/announcements.ts', [
  [/\bschoolId\b/g, "school_id"]
]);

regexReplaceInFile('src/actions/assignments.ts', [
  [/\bsubjectId\b/g, "subject_id"],
  [/\bdueDate\b/g, "due_date"],
  [/\btotalMarks\b/g, "max_marks"],
  [/\bassignmentId\b/g, "assignment_id"],
  [/\bsubmissionId\b/g, "submission_id"]
]);

regexReplaceInFile('src/actions/messages.ts', [
  [/\bsubjectId\b/g, "subject_id"],
  [/\bparentId\b/g, "reply_to_id"],
  [/\bmodResult\.action\b/g, "modResult.decision"],
  [/const \{ status/g, "const { newStatus"],
  [/status: newStatus/g, "newStatus"], // fix double replace
  [/calculateEscalation\(profile\.active_strikes\)/g, 'calculateEscalation(profile.active_strikes, modResult.severity || "medium")']
]);

regexReplaceInFile('src/app/(auth)/login/page.tsx', [
  [/err\.errors/g, "err.issues"]
]);

regexReplaceInFile('src/app/(auth)/register/page.tsx', [
  [/err\.errors/g, "err.issues"]
]);

regexReplaceInFile('src/app/(auth)/forgot-password/page.tsx', [
  [/err\.errors/g, "err.issues"]
]);

regexReplaceInFile('src/components/chat/message-input.tsx', [
  [/\buser\b\.id/g, "profile.id"],
  [/\buser\b/g, "profile"],
  [/sendMessage\(subject_id, content, replyToId\)/g, "sendMessage({subject_id, content, reply_to_id: replyToId})"] // fix signature
]);

regexReplaceInFile('src/components/chat/message-item.tsx', [
  [/\buser\b\.id/g, "profile.id"],
  [/\buser\b/g, "profile"],
  [/toggleReaction\((message\.id),\s*(emoji)\)/g, "toggleReaction({message_id: $1, emoji: $2})"],
  [/pinMessage\((message\.id)\)/g, "pinMessage({message_id: $1})"],
  [/deleteMessage\((message\.id)\)/g, "deleteMessage({message_id: $1})"]
]);

regexReplaceInFile('src/hooks/use-notifications.ts', [
  [/\buser\b\.id/g, "profile.id"],
  [/\buser\b/g, "profile"],
  [/\bnotification\.content\b/g, "notification.body"],
  [/\bnotification\.read_at\b/g, "notification.is_read"],
  [/\bis_read:\s*new Date\(\)\.toISOString\(\)/g, "is_read: true"] // fix boolean error
]);

regexReplaceInFile('src/hooks/use-presence.ts', [
  [/\buser\b\.id/g, "profile.id"],
  [/\buser\b/g, "profile"],
  [/\bprofile_id\b/g, "user_id"] // revert back to user_id for presence
]);

regexReplaceInFile('src/hooks/use-typing-indicator.ts', [
  [/\buser\b\.id/g, "profile.id"],
  [/\buser\b\.full_name/g, "profile.full_name"],
  [/\buser\b/g, "profile"]
]);

console.log("Fixes applied phase 2");
