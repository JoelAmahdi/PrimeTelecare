const fs = require('fs');
let content = fs.readFileSync('src/components/screens/DoctorProfileScreen.tsx', 'utf8');

content = content.replace("onClick={() => setShowFullAbout(!showFullAbout)}", "onClick={() => { triggerHaptic('light'); setShowFullAbout(!showFullAbout); }}");

fs.writeFileSync('src/components/screens/DoctorProfileScreen.tsx', content);
