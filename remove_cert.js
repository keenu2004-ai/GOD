
const fs = require('fs');
let c = fs.readFileSync('src/pages/EmployeePayrollPortalPage.tsx', 'utf8');

c = c.replace(/const \[tab, setTab\] = useState\<'portal' \| 'certificates'\>\('portal'\);/, 'const [tab, setTab] = useState<\'portal\'>(\'portal\');');
c = c.replace(/const \[certificates, setCertificates\] = useState\<any\[\]\>\(\[\]\);\r?\n/, '');
c = c.replace(/const \[showCertModal, setShowCertModal\] = useState\(false\);\r?\n/, '');
c = c.replace(/const \[certForm, setCertForm\] = useState\(\{[\s\S]*?\}\);\r?\n/, '');

c = c.replace(/apiClient\.get\('\/payroll\/certificates'\)\.catch\(\(\) => \(\{ data: \{ data: \[\] \} \}\)\),/, '');
c = c.replace(/const \[myPayslipsRes, myTaxRes, certRes\] = await Promise\.all\(\[/, 'const [myPayslipsRes, myTaxRes] = await Promise.all([');
c = c.replace(/setCertificates\(certRes\.data\?\.data \|\| \[\]\);\r?\n/, '');

c = c.replace(/• Salary Certificates /, '');

let lines = c.split('\n');
let newLines = [];
let skip = false;
for(let line of lines) {
  if(line.includes('const handleRequestCertificate')) skip = true;
  if(skip && line.includes('const handleDownloadPayslip')) skip = false;
  
  if(line.includes('<button onClick={() => setTab(\\''certificates\\'')}')) skip = true;
  if(skip && line.includes('Salary Certificates Center')) {
     skip = false;
     continue;
  }
  
  if(line.includes('{/* --- CERTIFICATES TAB')) skip = true;
  if(skip && line.includes('</form>')) {
     skip = false;
     continue;
  }
  if(skip && line.includes(')}')) {
     skip = false;
     continue;
  }
  
  if(!skip) newLines.push(line);
}
fs.writeFileSync('src/pages/EmployeePayrollPortalPage.tsx', newLines.join('\n'));

