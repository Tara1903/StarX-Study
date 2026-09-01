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

  // University replacements
  newContent = newContent.replace(/school_id/g, 'university_id');
  newContent = newContent.replace(/activeSchool/g, 'activeUniversity');
  newContent = newContent.replace(/school_memberships/g, 'university_memberships');
  newContent = newContent.replace(/schools/g, 'universities');
  newContent = newContent.replace(/School/g, 'University');
  newContent = newContent.replace(/school(?![_A-Za-z])/g, 'university'); // Match 'school' not followed by underscore or letter

  // Institute replacements
  newContent = newContent.replace(/academic_years/g, 'institutes');
  newContent = newContent.replace(/academic_year_id/g, 'institute_id');
  newContent = newContent.replace(/academic_year/g, 'institute');
  newContent = newContent.replace(/AcademicYear/g, 'Institute');

  // Department replacements
  newContent = newContent.replace(/classes/g, 'departments');
  newContent = newContent.replace(/class_id/g, 'department_id');
  // Avoid replacing CSS class or ES6 class
  newContent = newContent.replace(/class(?=\s*:|\s*=|\s*[\.\,\)])/g, 'department');

  // Semester replacements
  newContent = newContent.replace(/sections/g, 'semesters');
  newContent = newContent.replace(/section_id/g, 'semester_id');
  newContent = newContent.replace(/section/g, 'semester');
  newContent = newContent.replace(/Section/g, 'Semester');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log("Changed files:", changedCount);
