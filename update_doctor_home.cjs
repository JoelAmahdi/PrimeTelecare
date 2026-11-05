const fs = require('fs');
let content = fs.readFileSync('src/components/screens/DoctorHomeDashboard.tsx', 'utf8');

// onNavigate('settings')
content = content.replace("onClick={() => onNavigate('settings')}", "onClick={() => { triggerHaptic('selection'); onNavigate('settings'); }}");

// setIsQueueDrawerOpen(false)
content = content.replace("onClick={() => setIsQueueDrawerOpen(false)}", "onClick={() => { triggerHaptic('light'); setIsQueueDrawerOpen(false); }}");

// setActiveFilter('all')
content = content.replace("onClick={() => setActiveFilter('all')}", "onClick={() => { triggerHaptic('selection'); setActiveFilter('all'); }}");

fs.writeFileSync('src/components/screens/DoctorHomeDashboard.tsx', content);
