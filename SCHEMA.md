# Database Schema Documentation
## Alumni Influencer Platform — `alumni_api_cw1`

---

## Overview

The database consists of 15 tables organised around three core domains: user identity and authentication, alumni profile data, and the bidding and API platform. All tables use `InnoDB` with `utf8mb4` character encoding. Cascading deletes are enforced via foreign key constraints — deleting a user removes all associated records across every table.

---

## Entity Relationships

```
users ──── (1:1) ────  profiles
users ──── (1:N) ────  email_verification_tokens
users ──── (1:N) ────  password_reset_tokens
users ──── (1:N) ────  degrees
users ──── (1:N) ────  certifications
users ──── (1:N) ────  licences
users ──── (1:N) ────  professional_courses
users ──── (1:N) ────  employment_history
users ──── (1:N) ────  bids
users ──── (1:N) ────  appearance_history
users ──── (1:N) ────  alumni_event_bonus
users ──── (1:N) ────  api_clients
api_clients ── (1:N) ── api_keys
api_keys ──── (1:N) ── api_usage_logs
bids ─────── (1:1) ── appearance_history (via won_by_bid_id)
```

---

## Tables

---

### `users`

Central identity table. Every other table references this via `user_id`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `university_email` | varchar(255) | NOT NULL, UNIQUE | University domain email, validated at API level |
| `password_hash` | varchar(255) | NOT NULL | bcrypt hash, salt rounds 10 |
| `role` | enum | NOT NULL, DEFAULT `alumnus` | One of: `alumnus`, `developer`, `admin` |
| `email_verified` | tinyint(1) | NOT NULL, DEFAULT 0 | 0 = unverified, 1 = verified. Login is blocked if 0 |
| `created_at` | timestamp | DEFAULT current_timestamp | |
| `updated_at` | timestamp | ON UPDATE current_timestamp | |

**Indexes:** PRIMARY (`id`), UNIQUE (`university_email`)

---

### `email_verification_tokens`

Single-use hashed tokens sent to users to verify their email after registration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning user |
| `token_hash` | varchar(255) | NOT NULL | SHA-256 hash of the raw token emailed to the user |
| `expires_at` | datetime | NOT NULL | 24 hours from creation |
| `used_at` | datetime | DEFAULT NULL | Set on first use. Non-null tokens are rejected |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `password_reset_tokens`

Single-use hashed tokens for the password reset flow. Same structure as `email_verification_tokens` but with a 1-hour expiry.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning user |
| `token_hash` | varchar(255) | NOT NULL | SHA-256 hash of the raw token emailed to the user |
| `expires_at` | datetime | NOT NULL | 1 hour from creation |
| `used_at` | datetime | DEFAULT NULL | Set on first use. Non-null tokens are rejected |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `profiles`

One-to-one extension of `users` for personal and professional display data. `completion_status` is recomputed after every profile mutation and gates bid eligibility.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, UNIQUE, FK → users(id) | One profile per user |
| `first_name` | varchar(100) | NOT NULL | |
| `last_name` | varchar(100) | NOT NULL | |
| `biography` | text | DEFAULT NULL | |
| `linkedin_url` | varchar(500) | DEFAULT NULL | |
| `profile_image_path` | varchar(500) | DEFAULT NULL | Relative path to uploaded image |
| `completion_status` | tinyint(1) | NOT NULL, DEFAULT 0 | 1 = complete (all core fields + at least one professional entry) |
| `created_at` | timestamp | DEFAULT current_timestamp | |
| `updated_at` | timestamp | ON UPDATE current_timestamp | |

**Indexes:** PRIMARY (`id`), UNIQUE (`user_id`)  
**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `degrees`

Alumni degree records. Multiple degrees per user are supported.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning alumni |
| `degree_name` | varchar(255) | NOT NULL | e.g. BSc Computer Science |
| `institution_name` | varchar(255) | NOT NULL | |
| `official_url` | varchar(500) | DEFAULT NULL | Link to official degree page |
| `completion_date` | date | DEFAULT NULL | |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `certifications`

Professional certifications obtained post-graduation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning alumni |
| `certification_name` | varchar(255) | NOT NULL | e.g. AWS Certified Developer |
| `provider_name` | varchar(255) | NOT NULL | e.g. Amazon Web Services |
| `official_url` | varchar(500) | DEFAULT NULL | Link to certification page |
| `completion_date` | date | DEFAULT NULL | |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `licences`

Professional licences with awarding body details.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning alumni |
| `licence_name` | varchar(255) | NOT NULL | |
| `awarding_body` | varchar(255) | NOT NULL | |
| `official_url` | varchar(500) | DEFAULT NULL | Link to awarding body |
| `completion_date` | date | DEFAULT NULL | |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `professional_courses`

Short professional courses completed post-graduation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning alumni |
| `course_name` | varchar(255) | NOT NULL | |
| `provider_name` | varchar(255) | NOT NULL | e.g. Coursera, Udemy |
| `official_url` | varchar(500) | DEFAULT NULL | Link to course page |
| `completion_date` | date | DEFAULT NULL | |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `employment_history`

Work history records. Multiple entries per user. Includes industry sector and location for analytics queries.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning alumni |
| `company_name` | varchar(255) | NOT NULL | |
| `job_title` | varchar(255) | NOT NULL | |
| `start_date` | date | DEFAULT NULL | |
| `end_date` | date | DEFAULT NULL | NULL if `is_current` is 1 |
| `is_current` | tinyint(1) | NOT NULL, DEFAULT 0 | 1 = current role. Validated: cannot have end_date if is_current = 1 |
| `industry_sector` | varchar(100) | DEFAULT NULL | Used for analytics filtering |
| `location` | varchar(100) | DEFAULT NULL | Used for geographic distribution analytics |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `bids`

Records every bid placed by alumni for a featured date slot.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Bidding alumni |
| `bid_date` | date | NOT NULL | The date being bid for. One bid per user per date |
| `amount` | decimal(10,2) | NOT NULL | Bid amount in currency units |
| `status` | enum | NOT NULL, DEFAULT `losing` | One of: `winning`, `losing`, `won`, `lost`, `cancelled` |
| `created_at` | timestamp | DEFAULT current_timestamp | Used as tiebreaker — earlier bid wins on equal amounts |
| `updated_at` | timestamp | ON UPDATE current_timestamp | |

**Notes:**
- `winning` / `losing` = active bid, result not yet finalized
- `won` / `lost` = finalized by the scheduler or admin
- `cancelled` = withdrawn by the alumni before finalization
- The highest non-cancelled bid per date becomes `won` at finalization; all others become `lost`

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `appearance_history`

Records the winning alumni for each featured date. One record per date enforced by the UNIQUE constraint on `featured_date`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | The winning alumni |
| `featured_date` | date | NOT NULL, UNIQUE | The date of feature. Uniqueness prevents double finalization |
| `won_by_bid_id` | int(11) | NOT NULL, FK → bids(id) | Reference to the winning bid record |
| `event_bonus_used` | tinyint(1) | NOT NULL, DEFAULT 0 | 1 if the 4th-win event bonus was consumed for this win |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Indexes:** PRIMARY (`id`), UNIQUE (`featured_date`)  
**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE, `won_by_bid_id` → `bids(id)` ON DELETE CASCADE

---

### `alumni_event_bonus`

Tracks event attendance bonuses that allow an alumnus to bid for a 4th featured slot in a calendar month.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Benefiting alumni |
| `event_month` | int(11) | NOT NULL | Calendar month the bonus applies to (1–12) |
| `event_year` | int(11) | NOT NULL | Calendar year the bonus applies to |
| `bonus_granted` | tinyint(1) | NOT NULL, DEFAULT 1 | 1 = bonus is active |
| `bonus_used` | tinyint(1) | NOT NULL, DEFAULT 0 | 1 = bonus has been consumed at finalization |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `api_clients`

Named client applications registered by users to obtain API keys.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `user_id` | int(11) | NOT NULL, FK → users(id) | Owning user |
| `client_name` | varchar(255) | NOT NULL | e.g. `Analytics Dashboard`, `Mobile AR App` |
| `status` | enum | NOT NULL, DEFAULT `active` | One of: `active`, `revoked` |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Foreign Keys:** `user_id` → `users(id)` ON DELETE CASCADE

---

### `api_keys`

Scoped API keys belonging to a client. Keys are stored as SHA-256 hashes — the raw key is shown only once at generation and never persisted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `client_id` | int(11) | NOT NULL, FK → api_clients(id) | Owning client |
| `key_hash` | varchar(255) | NOT NULL | SHA-256 hash of the raw 64-character hex key |
| `scopes` | text | DEFAULT NULL | JSON array of permissions e.g. `["read:alumni","read:analytics"]` |
| `expires_at` | datetime | DEFAULT NULL | NULL = no expiry |
| `revoked_at` | datetime | DEFAULT NULL | NULL = active. Non-null = revoked, all requests rejected |
| `created_at` | timestamp | DEFAULT current_timestamp | |

**Scope values:**

| Scope | Grants Access To |
|---|---|
| `read:alumni` | `GET /api/alumni` |
| `read:analytics` | All `/analytics/*` endpoints |
| `featured:read` | `GET /api/alumni-of-the-day` |

**Foreign Keys:** `client_id` → `api_clients(id)` ON DELETE CASCADE

---

### `api_usage_logs`

Append-only log of every request made using an API key. Used for usage statistics and audit trails.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | int(11) | PRIMARY KEY, AUTO_INCREMENT | |
| `api_key_id` | int(11) | NOT NULL, FK → api_keys(id) | The key used |
| `endpoint` | varchar(255) | NOT NULL | Full request path e.g. `/analytics/industry-distribution` |
| `method` | varchar(20) | NOT NULL | HTTP method e.g. `GET` |
| `ip_address` | varchar(45) | DEFAULT NULL | Client IP, supports IPv6 |
| `used_at` | timestamp | DEFAULT current_timestamp | Request timestamp |

**Foreign Keys:** `api_key_id` → `api_keys(id)` ON DELETE CASCADE

---

## Normalisation

The schema is in **Third Normal Form (3NF)**:

- Every table has a single-column primary key with no composite keys
- All non-key attributes depend directly and only on the primary key in their table
- No transitive dependencies — for example, industry sector is stored with the employment record rather than derived from another table, and certification provider details live in `certifications` rather than being duplicated in `profiles`
- Repeating groups are eliminated — degrees, certifications, licences, courses, and employment are each in their own table rather than stored as arrays or delimited strings

## Cascade Behaviour

All foreign keys use `ON DELETE CASCADE`. Deleting a user record will automatically remove their profile, all professional entries, all bids, appearance history, event bonuses, API clients, API keys, and usage logs. This ensures referential integrity without orphaned records.