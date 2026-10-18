# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Single Church Registry Lock (`church_config/registry`)**:
   - Can only be created **once** when `registry` does not yet exist (`!exists(...)`), or by the bootstrapped admin (`cantordaipb@gmail.com`).
   - Prevents any second user from creating a duplicate church registration or overwriting `ownerUid`.
   - `ownerUid` is immutable once created.
2. **Manager Access & Anti-Duplication (`church_managers/{managerUid}`)**:
   - A new user signing up when `church_config/registry` does not exist becomes `role: 'owner'` and `status: 'approved'` atomically alongside creating `church_config/registry`.
   - Any subsequent user signing up when `church_config/registry` already exists can ONLY create their own `church_managers/{request.auth.uid}` document with `role: 'co_manager'` and `status: 'pending'`. They CANNOT self-approve (`status: 'approved'`) or claim `role: 'owner'`.
   - Only the Primary Owner (`registry.ownerUid`) or Bootstrapped Admin can update a manager's `status` to `'approved'` or `'revoked'`.
3. **Public Church Content (`church_data/{moduleId}`)**:
   - Publicly readable (`get`, `list`) by congregation members (USUÁRIO profile requires no login to view church info, bulletins, birthdays, deacon schedules, and banners).
   - Writable (`create`, `update`, `delete`) ONLY by an authenticated manager whose `church_managers/{request.auth.uid}` document has `status == 'approved'` (or the primary owner / bootstrapped admin).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write to Church Info**: `auth = null`, writing to `/church_data/info` -> `PERMISSION_DENIED`.
2. **Unverified Email Manager Signup**: `auth.token.email_verified = false`, creating `/church_managers/user2` -> `PERMISSION_DENIED`.
3. **Self-Approve as Second Manager**: `auth.uid = 'user2'` when `church_config/registry` already belongs to `'user1'`, attempting to create `/church_managers/user2` with `status: 'approved'` -> `PERMISSION_DENIED`.
4. **Hijack Primary Church Registry**: `auth.uid = 'user2'` attempting to overwrite `/church_config/registry` with `ownerUid: 'user2'` -> `PERMISSION_DENIED`.
5. **Pending Manager Writing Church Data**: `auth.uid = 'user2'` with `status: 'pending'` attempting to update `/church_data/deacons` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection on Registry**: Adding `"isSuperAdmin": true` to `/church_config/registry` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection on Manager**: Adding `"bypassApproval": true` to `/church_managers/user1` -> `PERMISSION_DENIED`.
8. **Identity Spoofing on Manager Creation**: `auth.uid = 'user2'` creating `/church_managers/user2` with `uid: 'user1'` -> `PERMISSION_DENIED`.
9. **Spoofing Client Timestamp**: Sending a forged past/future timestamp instead of `request.time` for `createdAt` or `updatedAt` -> `PERMISSION_DENIED`.
10. **Oversized String DoS**: Sending a 10,000-character `ownerName` in `/church_config/registry` -> `PERMISSION_DENIED`.
11. **Non-Owner Approving Pending Manager**: `co_manager` attempting to update another user's `status` to `'approved'` -> `PERMISSION_DENIED`.
12. **PII Leak to Anonymous User**: Unauthenticated user attempting `get` or `list` on `/church_managers` -> `PERMISSION_DENIED`.
