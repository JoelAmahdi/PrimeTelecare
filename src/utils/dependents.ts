import { DependentProfile, User } from '../types';
import { primeApi } from '../services/apiClient';

const DEPENDENTS_KEY_PREFIX = 'prime_telecare_dependents_';
const ACTIVE_DEPENDENT_KEY_PREFIX = 'prime_telecare_active_dep_';

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

export function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('prime_telecare_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return u.id;
    }
  } catch {}
  return 'pat-1';
}

/**
 * Returns dependents stored for the specific user.
 * Real users (Google/registered) start with a clean empty list.
 * Demo patient ('pat-1') retains the seed mock dependents.
 */
export function getStoredDependents(userId?: string): DependentProfile[] {
  try {
    const currentUserId = userId || getCurrentUserId();

    // Clean up any old global un-scoped key
    if (typeof window !== 'undefined' && currentUserId !== 'pat-1') {
      localStorage.removeItem('prime_telecare_dependents_v1');
    }

    const key = `${DEPENDENTS_KEY_PREFIX}${currentUserId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (currentUserId === 'pat-1') {
        localStorage.setItem(key, JSON.stringify(initialMockDependents));
        return initialMockDependents;
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDependents(deps: DependentProfile[], userId?: string): void {
  try {
    const currentUserId = userId || getCurrentUserId();
    const key = `${DEPENDENTS_KEY_PREFIX}${currentUserId}`;
    localStorage.setItem(key, JSON.stringify(deps));
    window.dispatchEvent(new Event('dependents-updated'));
  } catch (e) {
    console.error('Failed to save dependents', e);
  }
}

export function getActiveDependentId(userId?: string): string | null {
  try {
    const currentUserId = userId || getCurrentUserId();
    return localStorage.getItem(`${ACTIVE_DEPENDENT_KEY_PREFIX}${currentUserId}`);
  } catch {
    return null;
  }
}

export function setActiveDependentId(id: string | null, userId?: string): void {
  try {
    const currentUserId = userId || getCurrentUserId();
    const key = `${ACTIVE_DEPENDENT_KEY_PREFIX}${currentUserId}`;
    if (id === null || id === '') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, id);
    }
    window.dispatchEvent(new Event('active-dependent-changed'));
  } catch (e) {
    console.error('Failed to set active dependent id', e);
  }
}

export function addDependentProfile(dep: Omit<DependentProfile, 'id'>, userId?: string): DependentProfile {
  const currentUserId = userId || getCurrentUserId();
  const deps = getStoredDependents(currentUserId);
  const newDep: DependentProfile = {
    ...dep,
    id: `dep-${Date.now()}`,
  };
  const updated = [...deps, newDep];
  saveDependents(updated, currentUserId);
  primeApi.addDependent(newDep, currentUserId).catch(() => {});
  return newDep;
}

export function updateDependentProfile(dep: DependentProfile, userId?: string): void {
  const currentUserId = userId || getCurrentUserId();
  const deps = getStoredDependents(currentUserId);
  const updated = deps.map((d) => (d.id === dep.id ? dep : d));
  saveDependents(updated, currentUserId);
}

export function deleteDependentProfile(id: string, userId?: string): void {
  const currentUserId = userId || getCurrentUserId();
  const deps = getStoredDependents(currentUserId);
  const updated = deps.filter((d) => d.id !== id);
  saveDependents(updated, currentUserId);
  primeApi.deleteDependent(currentUserId, id).catch(() => {});

  if (getActiveDependentId(currentUserId) === id) {
    setActiveDependentId(null, currentUserId);
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
  const activeId = getActiveDependentId(mainUser.id);
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

  const deps = getStoredDependents(mainUser.id);
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
    avatarUrl:
      found.avatarUrl ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    ageGenderLabel: `${found.age} yrs • ${found.gender}`,
    allergies: found.allergies || [],
    existingConditions: found.existingConditions || [],
    isMinor: !!found.isMinor,
  };
}
