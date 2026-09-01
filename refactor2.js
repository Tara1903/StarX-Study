const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (file.includes('node_modules') || file.includes('.next') || file.includes('.git')) return;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  newContent = newContent.replace(/ADMIN_CLASSES/g, 'ADMIN_DEPARTMENTS');
  newContent = newContent.replace(/ADMIN_SCHOOLS/g, 'ADMIN_UNIVERSITIES'); // Just in case
  newContent = newContent.replace(/Schools/g, 'Universities');
  newContent = newContent.replace(/Classes/g, 'Departments');
  newContent = newContent.replace(/Sections/g, 'Semesters');
  newContent = newContent.replace(/Class /g, 'Department ');
  newContent = newContent.replace(/Section /g, 'Semester ');
  newContent = newContent.replace(/School /g, 'University ');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log("Changed files:", changedCount);
