import { DependentProfile, User } from '../types';

const DEPENDENTS_KEY = 'prime_telecare_dependents_v1';
const ACTIVE_DEPENDENT_KEY = 'prime_telecare_active_dependent_id_v1';

export const initialMockDependents: DependentProfile[] = [
  {
    id: 'dep-kofi',
    name: 'Kofi Okonkwo',
    relationship: 'Child',
    dob: '2020-08-12',
    age: 6,
    gender: 'Male',
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=200',
    allergies: ['Amoxicillin', 'Dust Mites'],
    existingConditions: ['Mild Asthma / Wheezing'],
    bloodGroup: 'O+',
    isMinor: true,
    guardianConsent: true,
    notes: 'Pediatric patient under parent Ada Okonkwo guardianship',
  },
  {
    id: 'dep-mama',
    name: 'Mama Comfort Okonkwo',
    relationship: 'Parent',
    dob: '1954-03-20',
    age: 72,
    gender: 'Female',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    allergies: ['NSAIDs / Ibuprofen'],
    existingConditions: ['Hypertension', 'Type 2 Diabetes'],
    bloodGroup: 'B+',
    isMinor: false,
    guardianConsent: true,
    notes: 'Elderly dependent managed by daughter Ada Okonkwo',
  },
];

export function getStoredDependents(): DependentProfile[] {
  try {
    const raw = localStorage.getItem(DEPENDENTS_KEY);
    if (!raw) {
      localStorage.setItem(DEPENDENTS_KEY, JSON.stringify(initialMockDependents));
      return initialMockDependents;
    }
    return JSON.parse(raw);
  } catch {
    return initialMockDependents;
  }
}

export function saveDependents(deps: DependentProfile[]): void {
  try {
    localStorage.setItem(DEPENDENTS_KEY, JSON.stringify(deps));
    window.dispatchEvent(new Event('dependents-updated'));
  } catch (e) {
    console.error('Failed to save dependents', e);
  }
}

export function getActiveDependentId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DEPENDENT_KEY);
  } catch {
    return null;
  }
}

export function setActiveDependentId(id: string | null): void {
  try {
    if (id === null || id === '') {
      localStorage.removeItem(ACTIVE_DEPENDENT_KEY);
    } else {
      localStorage.setItem(ACTIVE_DEPENDENT_KEY, id);
    }
    window.dispatchEvent(new Event('active-dependent-changed'));
  } catch (e) {
    console.error('Failed to set active dependent id', e);
  }
}

export function addDependentProfile(dep: Omit<DependentProfile, 'id'>): DependentProfile {
  const deps = getStoredDependents();
  const newDep: DependentProfile = {
    ...dep,
    id: `dep-${Date.now()}`,
  };
  const updated = [...deps, newDep];
  saveDependents(updated);
  return newDep;
}

export function updateDependentProfile(dep: DependentProfile): void {
  const deps = getStoredDependents();
  const updated = deps.map((d) => (d.id === dep.id ? dep : d));
  saveDependents(updated);
}

export function deleteDependentProfile(id: string): void {
  const deps = getStoredDependents();
  const updated = deps.filter((d) => d.id !== id);
  saveDependents(updated);

  if (getActiveDependentId() === id) {
    setActiveDependentId(null);
  }
}

export interface ActiveProfileInfo {
  isDependent: boolean;
  dependentProfile?: DependentProfile;
  displayName: string;
  relationshipLabel: string;
  avatarUrl: string;
  ageGenderLabel: string;
  allergies: string[];
  existingConditions: string[];
  isMinor: boolean;
}

export function getActiveProfileInfo(mainUser: User): ActiveProfileInfo {
  const activeId = getActiveDependentId();
  if (!activeId) {
    return {
      isDependent: false,
      displayName: mainUser.name,
      relationshipLabel: 'Primary Account Holder (Self)',
      avatarUrl: mainUser.avatarUrl,
      ageGenderLabel: `${mainUser.age || 28} yrs • ${mainUser.gender || 'Female'}`,
      allergies: mainUser.allergies || [],
      existingConditions: mainUser.existingConditions || [],
      isMinor: !!mainUser.isMinor,
    };
  }

  const deps = getStoredDependents();
  const found = deps.find((d) => d.id === activeId);

  if (!found) {
    return {
      isDependent: false,
      displayName: mainUser.name,
      relationshipLabel: 'Primary Account Holder (Self)',
      avatarUrl: mainUser.avatarUrl,
      ageGenderLabel: `${mainUser.age || 28} yrs • ${mainUser.gender || 'Female'}`,
      allergies: mainUser.allergies || [],
      existingConditions: mainUser.existingConditions || [],
      isMinor: !!mainUser.isMinor,
    };
  }

  return {
    isDependent: true,
    dependentProfile: found,
    displayName: found.name,
    relationshipLabel: `${found.relationship}${found.isMinor ? ' • Minor' : ' • Managed Dependent'}`,
    avatarUrl: found.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    ageGenderLabel: `${found.age} yrs • ${found.gender}`,
    allergies: found.allergies || [],
    existingConditions: found.existingConditions || [],
    isMinor: !!found.isMinor,
  };
}
