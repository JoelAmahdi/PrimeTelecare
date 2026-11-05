const fs = require('fs');

// CorporateHomeDashboard
let corp = fs.readFileSync('src/components/screens/CorporateHomeDashboard.tsx', 'utf8');
corp = corp.replace("onClick={() => setIsStaffExpanded(!isStaffExpanded)}", "onClick={() => { triggerHaptic('light'); setIsStaffExpanded(!isStaffExpanded); }}");
corp = corp.replace("onClick={() => setShowAddStaffModal(false)}", "onClick={() => { triggerHaptic('light'); setShowAddStaffModal(false); }}");
fs.writeFileSync('src/components/screens/CorporateHomeDashboard.tsx', corp);

// AdminDashboardScreen
let admin = fs.readFileSync('src/components/screens/AdminDashboardScreen.tsx', 'utf8');
if (!admin.includes("import { triggerHaptic }")) {
    admin = admin.replace("import { AdminData,", "import { triggerHaptic } from '../../utils/haptics';\nimport { AdminData,");
}
admin = admin.replace("onClick={() => onNavigate('corporate-home')}", "onClick={() => { triggerHaptic('selection'); onNavigate('corporate-home'); }}");
admin = admin.replace("onClick={() => setActiveTab('live-sessions')}", "onClick={() => { triggerHaptic('selection'); setActiveTab('live-sessions'); }}");
admin = admin.replace("onClick={() => setActiveTab('doctors')}", "onClick={() => { triggerHaptic('selection'); setActiveTab('doctors'); }}");
admin = admin.replace(/onClick=\{\(\) => handleToggleDoctorStatus\((.*?), '(.*?)'\)\}/g, "onClick={() => { triggerHaptic('selection'); handleToggleDoctorStatus($1, '$2'); }}");
admin = admin.replace(/onClick=\{\(\) => handleApprovePayout\((.*?)\)\}/g, "onClick={() => { triggerHaptic('success'); handleApprovePayout($1); }}");
admin = admin.replace(/onClick=\{\(\) => handleRejectPayout\((.*?)\)\}/g, "onClick={() => { triggerHaptic('heavy'); handleRejectPayout($1); }}");
fs.writeFileSync('src/components/screens/AdminDashboardScreen.tsx', admin);

