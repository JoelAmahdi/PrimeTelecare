const fs = require('fs');
let content = fs.readFileSync('src/components/common/ClinicalDocumentationModal.tsx', 'utf8');

content = content.replace(
  "import {",
  "import Markdown from 'react-markdown';\nimport {"
);

// We will replace the whole state logic with a single markdown state
const replacementState = `
  const [markdownNotes, setMarkdownNotes] = useState(
\`# Chief Complaint
High fever (38.8°C), body aches, chills, and fatigue for 2 days.

# Relevant History
No prior hospital admissions. Known allergy to Penicillin. Seasonal asthma history.

# Observations
Patient alert and oriented. Mild pharyngeal redness observed via tele-examination. Skin clear.

# Assessment & Diagnosis
**Assessment**: Acute viral upper respiratory tract infection.
**Provisional Diagnosis**: Viral Rhinopharyngitis

# Care Plan
- Steam inhalation
- Warm saline gargles
- High vitamin C intake
- Rest

# Medications
- Paracetamol 500mg, 2 tablets, 3 times daily, 3 days
- Vitamin C 1000mg Effervescent, 1 tablet, Once daily, 7 days

# Tests Requested
- Malaria RDT / Blood Smear
- Full Blood Count (FBC)

# Warning Signs (Red Flags)
Seek emergency care if experiencing difficulty breathing, chest pain, or persistent fever above 39.5°C.
\`
  );
  
  const [isPreview, setIsPreview] = useState(false);
`;

const stateStart = content.indexOf("  // 12 Structured Clinical Documentation State Fields");
const stateEnd = content.indexOf("  // Handle Quick Templates");

content = content.substring(0, stateStart) + replacementState + content.substring(stateEnd);

const templateStart = content.indexOf("  // Handle Quick Templates");
const templateEnd = content.indexOf("  // Save Record");

const replacementTemplate = `
  // Handle Quick Templates
  const handleApplyTemplate = (type: string) => {
    triggerHaptic('selection');
    if (type === 'fever') {
      setMarkdownNotes(
\`# Chief Complaint
Low grade fever, sore throat, sneezing, and runny nose for 24 hours.

# Assessment & Diagnosis
**Assessment**: Acute viral upper respiratory tract infection.
**Diagnosis**: Provisional: Viral Rhinopharyngitis

# Care Plan
Steam inhalation, warm saline gargles, high vitamin C intake, and rest.

# Medications
- Paracetamol 500mg, 2 tablets, 3 times daily, 3 days
- Vitamin C 1000mg Effervescent, 1 tablet, Once daily, 7 days
\`
      );
    } else if (type === 'hypertension') {
      setMarkdownNotes(
\`# Chief Complaint
Routine blood pressure follow-up. Occasional morning headache.

# Assessment & Diagnosis
**Assessment**: Essential hypertension under steady outpatient monitoring.
**Diagnosis**: Confirmed: Primary Essential Hypertension

# Care Plan
Salt intake reduction (<2g/day), 30 mins daily brisk walk, daily BP logging.

# Medications
- Amlodipine 5mg, 1 tablet, Once daily (Morning), 30 days

# Tests Requested
- Serum Electrolytes, Urea & Creatinine (E/U/Cr)
- Lipid Profile

# Follow-up
Next checkup: 2026-10-15
\`
      );
    }
  };
`;

content = content.substring(0, templateStart) + replacementTemplate + content.substring(templateEnd);

const saveStart = content.indexOf("    const newRecord: StructuredClinicalRecord = {");
const saveEnd = content.indexOf("    // Save to Local Storage for Persistence");

const replacementSave = `
    const newRecord: StructuredClinicalRecord = {
      id: \`CR-\${Date.now()}\`,
      patientId,
      patientName,
      patientAgeGender,
      doctorName: doctorUser.name.startsWith('Dr.') ? doctorUser.name : \`Dr. \${doctorUser.name}\`,
      doctorSpecialty: doctorUser.doctorSpecialty || 'Telemedicine Specialist',
      doctorLicense: doctorUser.doctorLicenseNo || 'MDCN/2018/74920',
      dateStr: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      markdownNotes,
    };
`;

content = content.substring(0, saveStart) + replacementSave + content.substring(saveEnd);

const formStart = content.indexOf("        {/* Modal Scrollable Form Body */}");
const formEnd = content.indexOf("        {/* Modal Bottom Action Bar */}");

const replacementForm = `
        {/* Modal Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold font-outfit text-sm text-[#022434] uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Clinical Notes (Markdown)</span>
            </h3>
            <div className="flex bg-slate-200 rounded-lg p-1">
              <button
                onClick={() => setIsPreview(false)}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-all \${!isPreview ? 'bg-white shadow-xs text-[#022434]' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                Edit
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={\`px-4 py-1.5 rounded-md text-xs font-bold transition-all \${isPreview ? 'bg-white shadow-xs text-[#022434]' : 'text-slate-500 hover:text-slate-700'}\`}
              >
                Preview
              </button>
            </div>
          </div>
          
          {!isPreview ? (
            <textarea
              value={markdownNotes}
              onChange={(e) => setMarkdownNotes(e.target.value)}
              className="w-full h-[400px] bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 font-nunito focus:ring-2 focus:ring-[#77daa4] focus:outline-none transition-all resize-none shadow-inner"
              placeholder="Type clinical notes here using markdown (# Heading, **bold**, - list)..."
            />
          ) : (
            <div className="w-full h-[400px] overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-800 shadow-inner prose prose-sm prose-emerald max-w-none">
              <Markdown>{markdownNotes}</Markdown>
            </div>
          )}
        </div>
`;

content = content.substring(0, formStart) + replacementForm + content.substring(formEnd);

fs.writeFileSync('src/components/common/ClinicalDocumentationModal.tsx', content);
