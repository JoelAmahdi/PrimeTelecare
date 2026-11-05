import { Medication, Prescription, PrescriptionChangeRecord, User } from '../types';

// Restricted controlled substances unsuitable for remote prescribing
export const RESTRICTED_CONTROLLED_MEDICATIONS = [
  { name: 'Tramadol', category: 'Opioid Analgesic', reason: 'Controlled Substance Schedule II. High risk of dependence and respiratory depression.' },
  { name: 'Morphine', category: 'Narcotic Opioid', reason: 'Schedule II Opioid. Strictly restricted from remote telemedicine prescribing.' },
  { name: 'Oxycodone', category: 'Narcotic Opioid', reason: 'Schedule II Opioid. Requires physical in-person pain specialist evaluation.' },
  { name: 'Fentanyl', category: 'Narcotic Opioid', reason: 'High-potency synthetic opioid. Unsuitable for remote prescribing.' },
  { name: 'Codeine Syrup', category: 'Narcotic Antitussive', reason: 'Controlled substance with high abuse potential.' },
  { name: 'Diazepam', category: 'Benzodiazepine', reason: 'Schedule IV Anxiolytic/Sedative. High addiction risk; restricted in telehealth.' },
  { name: 'Alprazolam', category: 'Benzodiazepine', reason: 'Schedule IV Anxiolytic (Xanax). Restricted under remote prescribing guidelines.' },
  { name: 'Clonazepam', category: 'Benzodiazepine', reason: 'Controlled substance. Requires physical neurological assessment.' },
  { name: 'Lorazepam', category: 'Benzodiazepine', reason: 'Schedule IV Sedative. Restricted from telehealth issuance.' },
  { name: 'Zolpidem', category: 'Non-Benzodiazepine Sedative', reason: 'Controlled sleep medication (Ambien). In-person consult mandatory.' },
  { name: 'Methylphenidate', category: 'Central Stimulant', reason: 'Schedule II Controlled Stimulant (Ritalin). Strict in-person restriction.' },
  { name: 'Adderall', category: 'Central Stimulant', reason: 'Controlled stimulant. Ineligible for remote tele-prescription.' },
  { name: 'Ketamine', category: 'Anesthetic / Dissociative', reason: 'Controlled clinical anesthetic. In-person hospital setting required.' },
  { name: 'Methotrexate', category: 'Cytotoxic / Immunosuppressant', reason: 'High-risk chemotherapy agent requiring in-person lab monitoring.' },
];

// Allergy cross-reactivity matrix
const ALLERGY_RULES: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'augumentin', 'augmentin', 'co-amoxiclav', 'penicillin', 'piperacillin', 'cloxacillin'],
  amoxicillin: ['amoxicillin', 'ampicillin', 'augumentin', 'augmentin', 'penicillin'],
  sulfa: ['sulfamethoxazole', 'bactrim', 'septrin', 'sulfasalazine', 'sulfa'],
  nsaid: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'ketoprofen', 'meloxicam', 'celecoxib'],
  ibuprofen: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin'],
  aspirin: ['aspirin', 'ibuprofen', 'diclofenac', 'naproxen'],
  ciprofloxacin: ['ciprofloxacin', 'levofloxacin', 'ofloxacin'],
};

// Known drug interaction pairs
export interface DrugInteractionAlert {
  severity: 'Severe' | 'Moderate';
  drugA: string;
  drugB: string;
  summary: string;
  clinicalRationale: string;
}

const DRUG_INTERACTION_DATABASE: DrugInteractionAlert[] = [
  {
    severity: 'Severe',
    drugA: 'Ibuprofen',
    drugB: 'Warfarin',
    summary: 'High GI Bleeding Risk',
    clinicalRationale: 'Concomitant use markedly increases risk of gastrointestinal ulceration and systemic major hemorrhage.',
  },
  {
    severity: 'Severe',
    drugA: 'Aspirin',
    drugB: 'Warfarin',
    summary: 'Major Hemorrhage Risk',
    clinicalRationale: 'Dual antiplatelet and anticoagulant effect severely impairs clot formation.',
  },
  {
    severity: 'Moderate',
    drugA: 'Amoxicillin',
    drugB: 'Allopurinol',
    summary: 'Severe Rash Risk',
    clinicalRationale: 'Co-administration significantly increases frequency of hypersensitivity skin rashes.',
  },
  {
    severity: 'Moderate',
    drugA: 'Ciprofloxacin',
    drugB: 'Antacids',
    summary: 'Reduced Bioavailability',
    clinicalRationale: 'Multivalent cations in antacids chelate Ciprofloxacin, reducing oral absorption by up to 90%.',
  },
  {
    severity: 'Severe',
    drugA: 'Lisinopril',
    drugB: 'Spironolactone',
    summary: 'Severe Hyperkalemia Risk',
    clinicalRationale: 'Synergistic potassium retention can cause cardiac arrhythmias due to high blood potassium.',
  },
  {
    severity: 'Severe',
    drugA: 'Clarithromycin',
    drugB: 'Simvastatin',
    summary: 'Severe Myopathy / Rhabdomyolysis',
    clinicalRationale: 'CYP3A4 inhibition by Clarithromycin dramatically raises Simvastatin levels.',
  },
];

/**
  Check if a drug name is restricted for remote prescribing
 */
export function checkMedicationRestriction(drugName: string) {
  if (!drugName || !drugName.trim()) return null;
  const clean = drugName.toLowerCase().trim();
  const found = RESTRICTED_CONTROLLED_MEDICATIONS.find((r) =>
    clean.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(clean)
  );
  if (found) {
    return {
      isRestricted: true,
      category: found.category,
      reason: found.reason,
    };
  }
  return null;
}

/**
  Check if drug triggers patient allergy warnings
 */
export function checkDrugAllergies(drugName: string, patientAllergies?: string[]): string | null {
  if (!drugName || !patientAllergies || patientAllergies.length === 0) return null;
  const cleanDrug = drugName.toLowerCase().trim();

  for (const allergy of patientAllergies) {
    const cleanAllergy = allergy.toLowerCase().trim();

    // Direct match
    if (cleanDrug.includes(cleanAllergy) || cleanAllergy.includes(cleanDrug)) {
      return `CRITICAL ALLERGY ALERT: Patient has documented allergy to "${allergy.toUpperCase()}". High risk of severe anaphylactic reaction!`;
    }

    // Cross-reactivity check
    for (const [allergyGroup, relatedMeds] of Object.entries(ALLERGY_RULES)) {
      if (cleanAllergy.includes(allergyGroup)) {
        if (relatedMeds.some((med) => cleanDrug.includes(med))) {
          return `CRITICAL CROSS-ALLERGY ALERT: Patient is allergic to "${allergy.toUpperCase()}". "${drugName}" belongs to the cross-reactive family and is contraindicated.`;
        }
      }
    }
  }

  return null;
}

/**
  Check drug interactions among a list of medications
 */
export function checkDrugInteractions(medications: Medication[]): DrugInteractionAlert[] {
  const alerts: DrugInteractionAlert[] = [];
  if (!medications || medications.length < 2) return alerts;

  const names = medications.map((m) => (m.drugName || '').toLowerCase().trim());

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const nameA = names[i];
      const nameB = names[j];

      for (const rule of DRUG_INTERACTION_DATABASE) {
        const ruleA = rule.drugA.toLowerCase();
        const ruleB = rule.drugB.toLowerCase();

        if (
          (nameA.includes(ruleA) && nameB.includes(ruleB)) ||
          (nameA.includes(ruleB) && nameB.includes(ruleA))
        ) {
          alerts.push({
            ...rule,
            drugA: medications[i].drugName || rule.drugA,
            drugB: medications[j].drugName || rule.drugB,
          });
        }
      }
    }
  }

  return alerts;
}

/**
  Check if a drug is a Prescription-Only Medicine (POM)
 */
export function isPrescriptionOnlyMedicine(drugName: string): boolean {
  if (!drugName) return true;
  const clean = drugName.toLowerCase();
  
  // Non-prescription / OTC items
  const otcItems = ['vitamin c', 'paracetamol', 'multivitamin', 'ors', 'oral rehydration', 'saline', 'zinc', 'plaster', 'bandage', 'antacid'];
  if (otcItems.some((otc) => clean.includes(otc))) {
    return false;
  }
  return true;
}

/**
  Generate Prescriber Authentication Token & Verification Metadata
 */
export function generatePrescriberAuthToken(doctorName: string, doctorLicense: string) {
  const dateStr = new Date().toISOString().split('T')[0];
  const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    authToken: `MDCN-SEAL-${doctorLicense.replace(/[^A-Z0-9]/gi, '')}-${dateStr}-${randomHash}`,
    verifiedBadge: 'MDCN Registered & Authenticated Prescriber',
    issuedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
