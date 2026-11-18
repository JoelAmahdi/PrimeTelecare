import { DependentProfile, User } from '../types';
import { primeApi } from '../services/apiClient';

const DEPENDENTS_KEY_PREFIX = 'prime_telecare_dependents_';
const ACTIVE_DEPENDENT_KEY_PREFIX = 'prime_telecare_active_dep_';

export const initialMockDependents: DependentProfile[] = [];

export function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem('prime_telecare_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return u.id;
    }
  } catch {}
  return 'current-user';
}

/**
 * Returns dependents stored for the specific user.
 * Every user starts with a clean empty list until they add real dependents.
 */
export function getStoredDependents(userId?: string): DependentProfile[] {
  try {
    const currentUserId = userId || getCurrentUserId();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('prime_telecare_dependents_v1');
    }

    const key = `${DEPENDENTS_KEY_PREFIX}${currentUserId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((d: DependentProfile) => d.id !== 'dep-kofi' && d.id !== 'dep-mama')
      : [];
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
