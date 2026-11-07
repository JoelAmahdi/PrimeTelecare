import { Router, Request, Response } from 'express';
import { store } from '../store';
import { DependentProfile } from '../../src/types';

export const dependentsRouter = Router();

// GET /api/dependents
dependentsRouter.get('/', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'pat-1';
  const list = store.getDependents(userId);
  return res.json({ success: true, count: list.length, dependents: list });
});

// POST /api/dependents
dependentsRouter.post('/', (req: Request, res: Response) => {
  const { userId = 'pat-1', name, relationship, dob, age, gender, allergies, existingConditions, bloodGroup, notes } = req.body;

  if (!name || !relationship) {
    return res.status(400).json({ success: false, error: 'Name and relationship are required' });
  }

  const created = store.addDependent(userId, {
    name,
    relationship,
    dob: dob || '2020-01-01',
    age: Number(age) || 5,
    gender: gender || 'Female',
    allergies: allergies || [],
    existingConditions: existingConditions || [],
    bloodGroup: bloodGroup || 'O+',
    isMinor: Number(age) < 18,
    guardianConsent: true,
    accessLevel: 'Full Authority',
    clinicalRecordsConsent: true,
    notes: notes || '',
    avatarUrl: `https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150`,
  });

  const userObj = store.getUserById(userId);
  store.createAuditLog({
    accessedBy: userObj?.name || 'Primary Account Holder',
    accessorRole: 'Patient / Guardian',
    recordAccessed: `Family Dependent Profile (${created.name} - ${created.relationship})`,
    accessReason: 'New family member enrolled under primary patient account with guardian consent',
    actionType: 'Updated',
    ipAddress: req.ip,
    accessLocation: 'Family Account Hub',
  });

  return res.status(201).json({ success: true, dependent: created });
});

// DELETE /api/dependents/:id
dependentsRouter.delete('/:id', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'pat-1';
  const deleted = store.deleteDependent(userId, req.params.id);

  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Dependent not found' });
  }

  return res.json({ success: true, message: 'Dependent removed successfully' });
});

