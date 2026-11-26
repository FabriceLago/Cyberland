# Security Summary

**Reviewed Files**: 14
**Issues Resolved**: 9

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| JWT Key Lookup & Error Handling | `server.ts` | 162 | Firebase JWT verification looked up `certs[header.kid]` directly without own-property or key-format checks, allowing keys such as `toString` or `constructor` to hit inherited object properties and leak raw internal errors. | High | Fixed | Stored certificates in a null-prototype map, validated `header.kid` against a strict regex and forbidden-key list, checked `hasOwnProperty` + string type, and mapped auth errors to an explicit allowlist. |
| Missing Upstream Fetch Timeout | `server.ts` | 103 | Fetching Google Firebase public signing certificates had no timeout, risking hung server connections during upstream slowdowns. | Medium | Fixed | Added a 5-second `AbortSignal.timeout(5000)` and strict response shape validation when fetching certificates. |
| Missing API Rate Limiting & Audit Flooding | `server.ts` | 580 | API routes (including unauthenticated transfer-code verification) had no request throttling, allowing bursts to exhaust CPU or evict entries from the 60-event server audit log. | High | Fixed | Added bounded per-IP in-memory rate limiting (`120 req/min` across `/api/*` and `30 req/min` on sensitive routes) returning HTTP `429` with `Retry-After`. |
| Non-Expiring Transfer Codes | `server.ts` | 501 | Signed `GEM2` transfer codes never expired and did not enforce version or future-timestamp checks, leaving leaked codes valid indefinitely. | Medium | Fixed | Enforced `v === 2`, finite positive `iat`, future-timestamp rejection (`+60s` skew), and a strict 30-day maximum lifetime (`TRANSFER_CODE_TTL_SEC`). |
| Sensitive API Caching & Browser Permissions | `server.ts` | 567 | Authenticated API responses lacked `Cache-Control: no-store` headers and global responses omitted a `Permissions-Policy` header. | Medium | Fixed | Applied `Cache-Control: no-store, max-age=0` and `Pragma: no-cache` to all `/api/*` responses and added `Permissions-Policy: camera=(), microphone=(), geolocation=()` globally (while keeping iframe embedding intact). |
| Role Registry Bounds & Self-Modification | `server.ts` | 834 | The admin role override map had no maximum size bound and allowed an admin to target their own UID or reserved object keys. | Medium | Fixed | Added a 200-entry capacity cap, blocked forbidden keys, and rejected self-role modifications (`CANNOT_MODIFY_SELF_ROLE`). |
| CSV Formula Injection | `src/components/TransferAndClassModal.tsx`, `src/components/QuizAndSheetsView.tsx` | 215, 151 | Student display names and quiz strings were exported into `.csv` files without neutralizing leading spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`). | High | Fixed | Created `sanitizeCsvCell` in `src/utils/safeExport.ts` to strip control/newline characters, prefix dangerous formula triggers with `'`, and safely quote CSV cells. |
| Incomplete SVG/XML Escaping & Filename Slugs | `src/components/CertificateModal.tsx` | 70, 129 | Certificate SVG generation omitted single-quote escaping (`'`) and illegal XML control-character filtering, and download filenames could collapse to trailing dashes. | Medium | Fixed | Replaced inline escaping with `sanitizeXmlText` (escapes `&`, `<`, `>`, `"`, `'` and strips XML-illegal control characters) and `sanitizeFilenameSlug` with a safe fallback. |
| Unbounded Leaderboard Query & Client Storage Hardening | `firestore.rules`, `src/components/LeaderboardView.tsx`, `src/App.tsx` | 226, 307, 125 | The public leaderboard rule allowed unbounded list queries without a limit cap, `completedIslands[0]` lacked range validation, and browser `localStorage` hydration accepted raw maps without filtering `__proto__`/`constructor` keys or clamping numeric bounds. | Medium | Fixed | Enforced `request.query.limit <= 50` in `firestore.rules` alongside `limit(50)` in `LeaderboardView.tsx`, added island ID bounds (`1..35`) in `firestore.rules`, and added strict key-filtering and range-clamping helpers in `src/App.tsx`. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| Cryptographic Token Verification | `server.ts` | Verifies Firebase ID tokens with RS256 against official Google X.509 certificates, enforcing `iss`, `aud`, `exp`, `iat`, `auth_time`, `sub`/`user_id` consistency, and `email_verified === true`. |
| Role-Based & Ownership Access Control | `server.ts`, `firestore.rules` | Ignores client-supplied role headers (`X-User-Role`, `X-Admin`, query flags), logs spoofing attempts, enforces UID ownership on `/api/user/profile/:targetUid`, and restricts `/roles`, `/protected_admin_vault`, and `/security_audit_logs` to verified admins in Firestore. |
| Transfer Code Integrity | `server.ts`, `.env.example` | Signs progress codes server-side with HMAC-SHA256 using an environment secret (`TRANSFER_SIGNING_SECRET`, documented in `.env.example`) or ephemeral CSPRNG fallback and validates signatures using `crypto.timingSafeEqual`. |
| Safe DOM Rendering | `src/**` | Uses React declarative JSX rendering throughout without raw HTML injection sinks (`dangerouslySetInnerHTML`, `eval`, or `innerHTML`). |
| Dependency Audit | `package.json`, `bun.lock` | Upgraded `firebase` to latest (`^13.4.0`). The remaining transitive advisory in `@grpc/grpc-js` affects Node gRPC server usage only; `server.ts` does not import the Firebase SDK and the browser bundle uses HTTPS/WebChannel transport rather than Node gRPC. |

## PoC Verification

### 1. JWT `kid` Prototype Property Lookup
#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsafe Object Key Lookup & Error Leakage in Token Verification |
| Impact | High |
| Affected File | `server.ts:162-182` |
| Test Scenario | `GET /api/auth/whoami` with a forged JWT header `{"alg":"RS256","kid":"toString"}` in `Authorization: Bearer <token>` |

#### How It Was Fixed
Certificates fetched from Google are copied into an `Object.create(null)` dictionary, `header.kid` is validated against `KID_REGEX` and `FORBIDDEN_OBJECT_KEYS`, own-property string checks are enforced before RSA verification, and only allowlisted error codes are returned.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Request with crafted `kid: "toString"` enters `requireFirebaseAuth` (`server.ts:250`) | Token passed to `verifyFirebaseIdToken` |
| 2 | `verifyFirebaseIdToken` checks `KID_REGEX`, `FORBIDDEN_OBJECT_KEYS`, and `Object.prototype.hasOwnProperty.call(certs, header.kid)` (`server.ts:162-177`) | Lookup fails safely instead of resolving `Object.prototype.toString` |
| 3 | Catch block maps error against `SAFE_AUTH_ERROR_CODES` (`server.ts:310-314`) and responds HTTP `401` with `UNKNOWN_KEY_ID` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Crafted `kid` values referencing inherited JavaScript properties are rejected cleanly with HTTP `401` and cannot trigger unhandled type errors or leak internal messages.

---

### 2. API Flooding & Expired Transfer Code Replay
#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Rate Limiting & Indefinite Transfer Code Validity |
| Impact | High |
| Affected File | `server.ts:501-516, 580-622` |
| Test Scenario | Burst of >30 rapid `POST /api/transfer/verify` requests from one IP, and submission of a transfer payload whose `iat` is older than 30 days |

#### How It Was Fixed
Added a bounded per-IP sliding-window rate limiter on `/api/*` (`30 req/min` on `/api/transfer/verify` and `/api/admin/roles`, `120 req/min` globally) and enforced `v === 2` plus a 30-day maximum lifetime on verified `GEM2` codes.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Burst requests hit `POST /api/transfer/verify` (`server.ts:873`) | `sensitiveRouteLimiter` increments per-IP counter |
| 2 | Request #31 within 60 seconds exceeds `maxRequests` (`server.ts:606`) | Middleware sets `Retry-After` and returns HTTP `429 RATE_LIMIT_EXCEEDED` before crypto verification or audit logging |
| 3 | Signed code with `iat` older than 30 days reaches `verifySignedTransferCode` (`server.ts:514`) | Rejected with `TRANSFER_CODE_EXPIRED` (HTTP `403`) |

#### Conclusion
**Fix Verified** - Rapid floods are throttled with HTTP `429` before evicting audit logs, and stale transfer codes expire automatically after 30 days.

---

### 3. CSV Formula Injection in Class & Quiz Exports
#### Summary
| Field | Value |
|---|---|
| Issue Type | Spreadsheet Formula Injection |
| Impact | High |
| Affected File | `src/utils/safeExport.ts:9-16`, `src/components/TransferAndClassModal.tsx:215`, `src/components/QuizAndSheetsView.tsx:151` |
| Test Scenario | Exporting a student record whose name is `=HYPERLINK("https://example.test","Ouvrir")` |

#### How It Was Fixed
Routed CSV cell serialization through `sanitizeCsvCell`, which strips control/newline characters and prefixes values starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a leading single quote (`'`) inside escaped CSV quotes.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Instructor clicks "Exporter le suivi de classe (.csv)" (`TransferAndClassModal.tsx:211`) | Student name enters `sanitizeCsvCell(s.name)` |
| 2 | `CSV_FORMULA_TRIGGER.test(normalized)` matches the leading `=` (`src/utils/safeExport.ts:14`) | Value is prefixed with `'` and internal quotes are doubled |
| 3 | Output cell becomes `"'=HYPERLINK(""https://example.test"",""Ouvrir"")"` | **Handled Safely** (treated as plain text by Excel/LibreOffice) |

#### Conclusion
**Fix Verified** - User-controlled names and quiz text exported to CSV can no longer execute formulas when opened in spreadsheet software.

---

### 4. Unbounded Firestore Leaderboard List Query & Client Hydration
#### Summary
| Field | Value |
|---|---|
| Issue Type | Unbounded Collection Read & Unsafe Client Storage Hydration |
| Impact | Medium |
| Affected File | `firestore.rules:57-64, 226`, `src/components/LeaderboardView.tsx:307-311`, `src/App.tsx:125-248` |
| Test Scenario | Direct Firestore SDK query `getDocs(query(collection(db, 'leaderboard'), where('isPublic', '==', true)))` without a limit, and tampered `localStorage` JSON containing `"__proto__"` keys or `quizBonusXp: 9999999` |

#### How It Was Fixed
Added `request.query.limit <= 50` to the `leaderboard` `allow list` rule (and updated `LeaderboardView.tsx` to include `limit(50)`), bounded `completedIslands[0]` to `1..35` in `firestore.rules`, and filtered forbidden keys while clamping all numeric ranges during `localStorage` hydration in `src/App.tsx`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unbounded Firestore list query arrives at `/leaderboard` (`firestore.rules:226`) | `request.query.limit <= 50` evaluates to false and Firestore returns `PERMISSION_DENIED` |
| 2 | Legitimate `LeaderboardView` query passes `where('isPublic', '==', true)` + `limit(50)` (`LeaderboardView.tsx:307-311`) | Rule evaluates to true (up to 50 public rows returned) |
| 3 | Tampered `localStorage` object enters `loadProgress()` (`src/App.tsx:180`) | `FORBIDDEN_KEYS` strips `__proto__`/`constructor`/`prototype` and `clampInt` clamps XP/counts to valid limits |

#### Conclusion
**Fix Verified** - Public leaderboard queries are strictly capped server-side in Firestore and client-side state hydration safely discards malicious keys and out-of-range values.
