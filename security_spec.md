# Cyberland Server & Firestore Security Specification (Phase 0 TDD)

## 1. Data & Authorization Invariants (Database + Backend)
1. **Zero Frontend Trust**: Hiding UI controls in React never constitutes authorization. Every sensitive action is enforced independently by Express server middleware (`requireFirebaseAuth`, `requireRole`, ownership checks) AND Firestore Security Rules.
2. **Owner Isolation (`user_progress/{userId}`)**: Only the verified authenticated owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) or a verified Admin (`isAdmin()`) can `get` a progress record. Only the verified owner can create, update, or delete their own progress. `list` is strictly denied (`allow list: if false`).
3. **PII Isolation (`leaderboard/{userId}`)**: Leaderboard documents contain only public pseudonym, XP, island count, rank title, and best Speedrun time — never emails or PII. `allow list` strictly enforces `resource.data.isPublic == true`.
4. **Anti-Privilege-Escalation RBAC (`roles/{userId}`)**: Users can `get` their own role document (`isOwner(userId) || isAdmin()`), `list` is denied, and ONLY verified Admins (`isAdmin()`) can create, update, or delete role assignments. Self-assignment of `admin` or `instructor` is mathematically impossible at the database layer.
5. **Protected Administrative Vault (`protected_admin_vault/{docId}`)**: Sensitive grading policies and exam keys live in a dedicated admin-only collection (`allow get, create, update, delete: if isValidId(docId) && isAdmin(); allow list: if false;`). Non-admins attempting direct SDK reads receive `PERMISSION_DENIED`.
6. **Immutable Security Audit Journal (`security_audit_logs/{logId}`)**: Append-only audit records writable and readable only by verified Admins (`allow update, delete: if false; allow list: if false;`).
7. **Strict Schema, Bounded Payloads & Server Timestamps**: Every create enforces `hasAll` + `hasOnly`, `isValidId()`, strict `.size()` bounds on every string and list, and `createdAt == request.time && updatedAt == request.time`. Every update validates with `isValid*(incoming())`, enforces immutable IDs/`createdAt`, `updatedAt == request.time`, and explicit `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must ALL fail with PERMISSION_DENIED)
1. **Cross-user IDOR read**: Learner B attempts `get` on `/user_progress/userA`.
2. **Collection scrape**: Learner A attempts `list` on `/user_progress`, `/roles`, or `/protected_admin_vault`.
3. **Self-privilege escalation**: Learner A attempts `create` or `update` on `/roles/userA` with `{ role: "admin" }`.
4. **Admin vault direct SDK bypass**: Unauthenticated visitor or Learner A attempts `get` on `/protected_admin_vault/exam_policy`.
5. **Unverified email spoofing**: Attacker with `email: "delapipen@gmail.com"` and `email_verified: false` attempts admin access.
6. **Shadow field injection**: Learner A creates `/leaderboard/userA` with ghost field `role: "admin"` or `isAdmin: true`.
7. **Identity spoofing on create**: Learner A creates `/user_progress/userA` with `userId: "userB"`.
8. **Value poisoning (XP overflow)**: Learner A writes `totalXp: 99999999` (above max bound `50000`).
9. **String DoS**: Learner A writes a 5000-character `displayName` (above maxLength `48`).
10. **Array flooding**: Learner A writes 100 items in `completedIslands` (above max `35`).
11. **ID poisoning**: Attacker targets `/protected_admin_vault/../../secret` (rejected by `isValidId`).
12. **Audit log tampering**: Any caller attempts `update` or `delete` on `/security_audit_logs/{logId}`, or backdates `createdAt`/`updatedAt` instead of `request.time`.
