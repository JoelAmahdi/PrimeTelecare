# Security Specification: Prime Telecare Telehealth Platform

## 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be read or written by the authenticated user whose `request.auth.uid == userId` or a verified system administrator. No user can escalate their own role to `admin`.
2. **Clinical Record Confidentiality**: Medical clinical documentation at `/clinicalRecords/{recordId}` can only be created by licensed medical practitioners and read by the patient (`patientId == request.auth.uid`), the attending doctor, or an administrator.
3. **Prescription Integrity & Non-Tampering**: Electronic prescriptions at `/prescriptions/{prescriptionId}` must be digitally authored and signed by a licensed doctor. Once created, prescription medical fields cannot be altered or overwritten by patients.
4. **Appointment Synchronization**: Appointments at `/appointments/{appointmentId}` belong to both the booking patient and the scheduled doctor. Both parties can view their active appointments, but only the parties or admins can update status (e.g. `cancelled` or `completed`).
5. **Read-Only Audit Trail**: Audit logs at `/auditLogs/{logId}` are strictly append-only by authenticated sessions and cannot be deleted or modified, upholding NDPA regulatory compliance.
6. **Immutable Creation Timestamps**: All timestamps for creation (`createdAt`) must be evaluated with `request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Role Escalation Attack**: Attempting to set `role: "admin"` on self-profile during user registration.
   - *Expected Result*: PERMISSION_DENIED.
2. **Ghost Field Shadow Update**: Adding an arbitrary field `{ "isSuperAdmin": true }` to `/users/{userId}`.
   - *Expected Result*: PERMISSION_DENIED.
3. **Cross-Patient Health Record Peeking**: Patient B attempting `get` on `/clinicalRecords/{recordOfPatientA}`.
   - *Expected Result*: PERMISSION_DENIED.
4. **Prescription Alteration**: Patient attempting to modify medication dosage or instructions on `/prescriptions/{prescId}`.
   - *Expected Result*: PERMISSION_DENIED.
5. **Audit Log Deletion**: Attacker attempting `delete` on an NDPA audit log at `/auditLogs/{logId}`.
   - *Expected Result*: PERMISSION_DENIED.
6. **ID Injection & Denial of Wallet**: Passing a 2KB garbage string as `{appointmentId}` path parameter.
   - *Expected Result*: PERMISSION_DENIED via `isValidId()`.
7. **Client Timestamp Spoofing**: Submitting `createdAt: "2020-01-01T00:00:00Z"` instead of server `request.time`.
   - *Expected Result*: PERMISSION_DENIED.
8. **Orphaned Appointment**: Creating an appointment for a non-existent doctor ID.
   - *Expected Result*: PERMISSION_DENIED.
9. **Unauthenticated Doctor Profile Modification**: Modifying doctor credentials or ratings without authenticated doctor ownership or admin clearance.
   - *Expected Result*: PERMISSION_DENIED.
10. **Chat Impersonation**: Sending a chat message in `/consultationChats/{chatId}/messages/{msgId}` with `sender: "doctor"` while authenticated as a patient.
    - *Expected Result*: PERMISSION_DENIED.
11. **Blanket Query Scraping**: Attempting an unrestricted `list` query across `/users` without scoping to the caller's ID.
    - *Expected Result*: PERMISSION_DENIED.
12. **Unverified Email Access**: Writing sensitive health records when `request.auth.token.email_verified == false`.
    - *Expected Result*: PERMISSION_DENIED.

---

## 3. Test Runner Coverage

The automated rules test suite validates all 12 adversarial vectors against Firestore Security Rules using `@firebase/rules-unit-testing`, confirming zero update-gaps and zero orphaned writes across all platform routes.
