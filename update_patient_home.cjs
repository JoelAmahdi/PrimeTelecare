const fs = require('fs');
let content = fs.readFileSync('src/components/screens/PatientHomeDashboard.tsx', 'utf8');

// onNavigate('settings') in header
content = content.replace("onClick={() => onNavigate('settings')}", "onClick={() => { triggerHaptic('selection'); onNavigate('settings'); }}");

// handleMarkTaken
content = content.replace(/onClick=\{\(\) => handleMarkTaken\((.*?)\)\}/g, "onClick={() => { triggerHaptic('success'); handleMarkTaken($1); }}");

// handleSnooze
content = content.replace(/onClick=\{\(\) => handleSnooze\((.*?)\)\}/g, "onClick={() => { triggerHaptic('light'); handleSnooze($1); }}");

// setActiveCategory
content = content.replace(/onClick=\{\(\) => setActiveCategory\(cat\)\}/g, "onClick={() => { triggerHaptic('selection'); setActiveCategory(cat); }}");

// onNavigate('doctor-discovery')
content = content.replace("onClick={() => onNavigate('doctor-discovery')}", "onClick={() => { triggerHaptic('selection'); onNavigate('doctor-discovery'); }}");

// setIsMedicationsExpanded
content = content.replace("onClick={() => setIsMedicationsExpanded(!isMedicationsExpanded)}", "onClick={() => { triggerHaptic('light'); setIsMedicationsExpanded(!isMedicationsExpanded); }}");

// setIsNotificationsOpen(false)
content = content.replace(/onClick=\{\(\) => setIsNotificationsOpen\(false\)\}/g, "onClick={() => { triggerHaptic('light'); setIsNotificationsOpen(false); }}");

// e.stopPropagation(); onNavigate('new-prescription');
content = content.replace("onClick={(e) => { e.stopPropagation(); onNavigate('new-prescription'); }}", "onClick={(e) => { e.stopPropagation(); triggerHaptic('selection'); onNavigate('new-prescription'); }}");

fs.writeFileSync('src/components/screens/PatientHomeDashboard.tsx', content);
