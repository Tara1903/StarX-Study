const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/app/(platform)/admin');
files.push('src/actions/admin.ts');
files.push('src/actions/announcements.ts');

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/\.eq\('role',\s*'student_admin'\)/g, `.in('role', ['teacher_admin', 'student_admin'])`);
  newContent = newContent.replace(/member\.role !== 'student_admin'/g, `(member.role !== 'student_admin' && member.role !== 'teacher_admin')`);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});
