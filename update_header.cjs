const fs = require('fs');
let content = fs.readFileSync('src/components/common/Header.tsx', 'utf8');

if (!content.includes("import { triggerHaptic }")) {
    content = content.replace("import { ChevronLeft", "import { triggerHaptic } from '../../utils/haptics';\nimport { ChevronLeft");
}

content = content.replace(/onClick=\{onBack\}/g, "onClick={() => { triggerHaptic('selection'); onBack?.(); }}");
content = content.replace(/onClick=\{onBellClick\}/g, "onClick={() => { triggerHaptic('selection'); onBellClick?.(); }}");
content = content.replace(/onClick=\{onLikeToggle\}/g, "onClick={() => { triggerHaptic('selection'); onLikeToggle?.(); }}");
content = content.replace(/onClick=\{onShare\}/g, "onClick={() => { triggerHaptic('selection'); onShare?.(); }}");
content = content.replace(/onClick=\{onFilterClick\}/g, "onClick={() => { triggerHaptic('selection'); onFilterClick?.(); }}");

fs.writeFileSync('src/components/common/Header.tsx', content);
