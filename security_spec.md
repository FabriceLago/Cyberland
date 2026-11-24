# Cyberland Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Owner Isolation (`user_progress/{userId}`)**: Only the verified authenticated owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) can read, create, update, or delete their own progress document. No `list` access is granted on `user_progress`.
2. **PII Isolation (`leaderboard/{userId}`)**: Leaderboard documents contain strictly public pseudonym, XP, island count, rank title, and best Speedrun time — never email, phone, or private account data.
3. **Rule-Enforced List Queries**: `allow list` on `leaderboard` explicitly enforces `resource.data.isPublic == true` so private/opt-out entries can never be scraped regardless of client queries.
4. **Strict Schema & Immutability**: Every create enforces exact `hasAll` + `hasOnly`, valid ID regex, bounded numbers/strings/arrays, and `createdAt == request.time && updatedAt == request.time`. Every update enforces `isValid*(incoming())`, immutable `userId` and `createdAt`, `updatedAt == request.time`, and explicit `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must ALL fail with PERMISSION_DENIED)
1. **Cross-user read**: User B attempts `get` on `/user_progress/userA`.
2. **Collection scrape**: User A attempts `list` on `/user_progress`.
3. **Identity spoofing on create**: User A creates `/leaderboard/userA` with `userId: "userB"`.
4. **Unverified email write**: User with `email_verified: false` attempts write on `/user_progress/userA`.
5. **Shadow field injection**: User A creates `/leaderboard/userA` with extra ghost field `isAdmin: true`.
6. **Value poisoning (XP overflow)**: User A sets `totalXp: 99999999` (above max bound 50000).
7. **String DoS**: User A sets `displayName` to a 5000-character string (above maxLength 48).
8. **Array flooding**: User A sets `completedIslands` to 100 items (above max 25).
9. **ID poisoning**: Attacker attempts write to `/leaderboard/../../../etc` (fails `isValidId`).
10. **Immutable field tampering**: User A updates `createdAt` or `userId` on existing `/user_progress/userA`.
11. **Client timestamp forgery**: User A sends a backdated `updatedAt` instead of `request.time`.
12. **Private leaderboard scraping**: Attacker lists `/leaderboard` without filtering `isPublic == true` or reads an entry where `isPublic == false` owned by another user.
