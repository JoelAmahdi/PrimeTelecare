export interface BloodPressureReading {
  id: string;
  date: string;
  shortDate: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
  category: 'Optimal' | 'Normal' | 'Elevated' | 'Stage 1 HTN' | 'Stage 2 HTN';
}

export interface GlucoseReading {
  id: string;
  date: string;
  shortDate: string;
  glucose: number; // mg/dL
  type: 'Fasting' | 'Post-Prandial' | 'Random';
  status: 'Normal' | 'Prediabetic' | 'High';
}

export interface OxygenPulseReading {
  id: string;
  date: string;
  shortDate: string;
  spo2: number; // %
  pulse: number; // bpm
}

export const mockBloodPressureData: BloodPressureReading[] = [
  {
    id: 'bp-1',
    date: '2026-06-15',
    shortDate: 'Jun 15',
    systolic: 138,
    diastolic: 88,
    heartRate: 78,
    category: 'Stage 1 HTN',
    notes: 'Morning measurement before medication',
  },
  {
    id: 'bp-2',
    date: '2026-07-01',
    shortDate: 'Jul 01',
    systolic: 132,
    diastolic: 85,
    heartRate: 75,
    category: 'Stage 1 HTN',
    notes: 'After starting Amlodipine 5mg',
  },
  {
    id: 'bp-3',
    date: '2026-07-15',
    shortDate: 'Jul 15',
    systolic: 126,
    diastolic: 82,
    heartRate: 72,
    category: 'Elevated',
    notes: 'Post evening walk',
  },
  {
    id: 'bp-4',
    date: '2026-08-01',
    shortDate: 'Aug 01',
    systolic: 122,
    diastolic: 80,
    heartRate: 70,
    category: 'Elevated',
  },
  {
    id: 'bp-5',
    date: '2026-08-15',
    shortDate: 'Aug 15',
    systolic: 118,
    diastolic: 78,
    heartRate: 68,
    category: 'Optimal',
    notes: 'Consistent daily adherence',
  },
  {
    id: 'bp-6',
    date: '2026-09-01',
    shortDate: 'Sep 01',
    systolic: 120,
    diastolic: 79,
    heartRate: 72,
    category: 'Optimal',
  },
  {
    id: 'bp-7',
    date: '2026-09-15',
    shortDate: 'Sep 15',
    systolic: 116,
    diastolic: 76,
    heartRate: 69,
    category: 'Optimal',
    notes: 'Latest routine screening',
  },
];

export const mockGlucoseData: GlucoseReading[] = [
  {
    id: 'glu-1',
    date: '2026-06-15',
    shortDate: 'Jun 15',
    glucose: 118,
    type: 'Fasting',
    status: 'Prediabetic',
  },
  {
    id: 'glu-2',
    date: '2026-07-01',
    shortDate: 'Jul 01',
    glucose: 112,
    type: 'Fasting',
    status: 'Prediabetic',
  },
  {
    id: 'glu-3',
    date: '2026-07-15',
    shortDate: 'Jul 15',
    glucose: 105,
    type: 'Fasting',
    status: 'Prediabetic',
  },
  {
    id: 'glu-4',
    date: '2026-08-01',
    shortDate: 'Aug 01',
    glucose: 98,
    type: 'Fasting',
    status: 'Normal',
  },
  {
    id: 'glu-5',
    date: '2026-08-15',
    shortDate: 'Aug 15',
    glucose: 94,
    type: 'Fasting',
    status: 'Normal',
  },
  {
    id: 'glu-6',
    date: '2026-09-01',
    shortDate: 'Sep 01',
    glucose: 92,
    type: 'Fasting',
    status: 'Normal',
  },
  {
    id: 'glu-7',
    date: '2026-09-15',
    shortDate: 'Sep 15',
    glucose: 90,
    type: 'Fasting',
    status: 'Normal',
  },
];

export const mockOxygenPulseData: OxygenPulseReading[] = [
  { id: 'spo2-1', date: '2026-06-15', shortDate: 'Jun 15', spo2: 96, pulse: 78 },
  { id: 'spo2-2', date: '2026-07-01', shortDate: 'Jul 01', spo2: 97, pulse: 75 },
  { id: 'spo2-3', date: '2026-07-15', shortDate: 'Jul 15', spo2: 98, pulse: 72 },
  { id: 'spo2-4', date: '2026-08-01', shortDate: 'Aug 01', spo2: 98, pulse: 70 },
  { id: 'spo2-5', date: '2026-08-15', shortDate: 'Aug 15', spo2: 99, pulse: 68 },
  { id: 'spo2-6', date: '2026-09-01', shortDate: 'Sep 01', spo2: 98, pulse: 72 },
  { id: 'spo2-7', date: '2026-09-15', shortDate: 'Sep 15', spo2: 99, pulse: 69 },
];
