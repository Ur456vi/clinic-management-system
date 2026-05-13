To: Kunal <kunal@chirpin.in>
Cc: Varun Pratap Singh <varunpratapsingh191@gmail.com>
Subject: [Algoborne / Vyara] Full feature scope + all user-type journeys — please review and finalize

Hi Kunal (Cc Varun),

Varun has asked me to send you the **full proposed feature scope** and **end-to-end user journeys for every user type** in the Vyara platform, so you can lock the scope with Dr. Yuvraaj before we start shipping in earnest. This is the complete product as we currently understand it from the codebase, the spec doc, and the conversations to date — not just the Sprint 1 MVP demo scope.

**What I need from you:**
1. Review every section below.
2. Mark each feature / journey as **APPROVED**, **CUT** (drop entirely), or **CHANGE** (with a one-line note on what to change).
3. **Reply directly to Varun (varunpratapsingh191@gmail.com) with the finalized list** — keep me Cc'd so I can update the workbook and the sprint plans accordingly.
4. Surface any features Dr. Yuvraaj has mentioned that I've missed.

Once you reply, I'll:
- Update `Vyara_Development_Tasks.xlsx` to reflect the finalized scope
- Re-plan Sprint 1 (May 13 → May 28 demo) and Sprint 2+ around what survived
- Send Aman a parallel note on any new compliance touch-points

## 1. Feature scope — full product

Organized by domain. Each feature is one line for scan-readability.

### 1.1 Foundation (already shipped, 8 tasks merged)

- PostgreSQL 16 provisioned via Docker (BE-01)
- Prisma ORM initialized (BE-02)
- Core data models: User, Department, Staff, Patient, AuditLog (BE-03)
- NextAuth.js Credentials provider + JWT sessions + bcrypt password hashing (BE-04)
- API route conventions + error envelope + pagination plumbing (BE-07)
- Environment + secrets management with typed runtime validation (BE-08)
- Patient CRUD API: list / get / create / update / soft-delete (BE-11)
- Consultation model: polymorphic RMO + main consultation with JSONB sections (BE-13)

### 1.2 Authentication & access control

- Login (email + password) for all staff roles
- Login for patients (email or phone + OTP)
- Password reset via email
- OTP send + verify (SMS via MSG91, email as fallback)
- Email verification on signup
- Role-based access control (RBAC) with 8 roles (see § 2)
- Session management + auto-logout on inactivity
- Optional: 2FA via TOTP for ADMIN and DOCTOR roles

### 1.3 Patient management

- Patient registration (self-service from patient portal)
- Patient registration (by Reception at check-in)
- Patient profile: demographics, contact, emergency contact, insurance, photo
- Patient search: full-text on name + phone + MRN (medical record number)
- Patient history view: consultations, lab results, treatment plans, invoices
- Patient documents: upload / view / download (consent forms, reports, scans)
- Patient consents: digital signature, version-tracked, audit-logged
- Soft-delete / restore for compliance

### 1.4 Clinical workflows

- Consultation entry (RMO triage + main doctor consultation, sectioned form)
- Vital signs capture (BP, HR, SpO2, temp, weight, BMI auto-calculated)
- Diagnosis coding (ICD-10 lookup, free-text fallback)
- Prescription writer (drug autocomplete, dosage builder, print + share)
- Lab order placement (which tests, lab vendor, status tracking)
- Lab result attach (PDF or structured values; flag abnormal values)
- Treatment plan creation (multi-session: infusion, rehab, aesthetic protocols)
- Treatment session log (one row per session: vitals, products used, notes)
- Infusion log (IV-specific: line site, drip rate, observations, adverse events)
- Rehab session log (exercises, ROM measurements, patient-reported pain score)
- Aesthetics log (procedure, products, before/after photos, consent reference)
- Patient timeline view (chronological feed of all events for one patient)
- Progress notes between visits (doctor's annotations on patient case)
- Discharge summary generation (PDF)
- Referral letter generation (PDF, signed by doctor)

### 1.5 Appointment management

- Doctor availability slots (recurring + ad-hoc)
- Department / specialty filter
- Appointment booking (by patient from portal)
- Appointment booking (by Reception over phone)
- Reschedule / cancel with policy enforcement (cutoff window, fees)
- Appointment confirmation (email + SMS + WhatsApp)
- Reminders (24h, 1h before)
- Check-in workflow (Reception marks patient arrived)
- No-show tracking + automated follow-up
- Wait-list for fully-booked slots
- Multi-doctor scheduling (Phase 2: when clinic adds doctors)
- Room / chair assignment for infusion / aesthetic sessions

### 1.6 File storage + documents

- S3 PHI bucket for patient documents (encrypted, scoped IAM)
- S3 assets bucket for clinic branding (public-CDN)
- Presigned upload URLs for direct browser → S3 uploads (avoid server proxy)
- PDF generation: prescriptions, lab orders, invoices, discharge summaries
- Image upload + preview (lab scans, before/after photos)
- Document categorization (consent, lab, scan, prescription, other)
- Patient-facing document download portal

### 1.7 Notifications

- Email notifications via Brevo (appointment confirm, reminder, lab ready, invoice)
- SMS via MSG91 (OTP + appointment reminder + lab ready)
- WhatsApp via Interakt (appointment reminder, treatment plan share, payment link)
- Push notifications (Phase 3 — when mobile app exists)
- In-app notification feed for staff
- Notification preferences per patient

### 1.8 Payments & invoicing

- Invoice generation per consultation / treatment session
- Itemized billing (consultation fee + procedure + products + lab fees)
- Discount + promo code support
- Tax (GST) calculation per line item
- Razorpay integration (on Dr. Yuvraaj's clinic merchant account) — UPI, cards, EMI, wallets
- Payment link via WhatsApp / email
- Receipt generation (PDF, GST-compliant)
- Refunds workflow (partial / full, audit-logged)
- Daily collections summary for clinic
- Outstanding-dues report
- Accounting export (Tally / Excel)

### 1.9 Admin & reporting

- User management (create / disable staff users, assign roles)
- Department management (create / edit clinic departments)
- Role + permission editor
- Audit log viewer (filter by user / patient / date / action)
- Operational reports: appointments per day, no-show rate, revenue per doctor, treatment-plan completion rate
- Clinical reports: patients seen per condition, lab-result turnaround, follow-up compliance
- Financial reports: GMV, fee breakdown, outstanding dues, refunds
- Patient demographics + cohort analytics
- Custom report builder (Phase 3)

### 1.10 Compliance & audit

- Immutable audit log for every PHI access (who, what, when)
- Consent tracking with versioning
- DPDP Act compliance: notice + consent collection, right to access / erase
- DISHA-ready data structure (when the bill is enacted)
- Backup verification + restore drills (quarterly)
- Data retention policy enforcement (7 years for clinical records per DISHA)
- Breach notification workflow (Algoborne → clinic → DPB within 72h)
- Sub-processor disclosure to patients in consent flow

### 1.11 Infrastructure & operations

- EC2 + RDS PostgreSQL + S3 on clinic's AWS account (ap-south-1)
- CloudWatch alarms (CPU, RDS connections, disk, 5xx, backup-fail)
- CloudFront CDN for static assets
- Sentry for error monitoring
- UptimeRobot for uptime
- GitHub Actions deploy pipeline
- Daily DB backups (RDS automated, 7-day retention)
- Weekly EC2 AMI snapshot
- Disaster recovery runbook (RTO < 4h, RPO < 24h)

### 1.12 Optional / AI features (Sprint 3+)

- Smart appointment scheduling (suggest optimal slots based on history)
- Clinical note auto-summarization (long consult → discharge summary)
- Voice-to-text transcription for doctor notes
- Lab-result anomaly detection (flag values out of normal range)
- Patient adherence prediction (will they show up? complete treatment?)
- Marketing automation (re-engagement campaigns for lapsed patients)
- Multilingual UI (English + Hindi + regional languages)
- Mobile apps (iOS + Android, native React Native or Flutter)
- Telemedicine video consultations
- Multi-clinic / multi-location support

## 2. User-type journeys

Eight roles. Each is described as the day-in-the-life from login to logout.

### 2.1 Patient (self-service portal)

**Goal:** book an appointment, attend it, see results, pay.

1. **Discover** the clinic — visit Dr. Yuvraaj's website / WhatsApp link → land on patient portal
2. **Register** with name + phone + DOB → verify phone via OTP → set password
3. **Book appointment** — pick specialty (general / infusion / rehab / aesthetic) → pick doctor → pick slot → confirm
4. **Receive confirmation** — email + SMS + WhatsApp with appointment details + clinic address
5. **Reminder** 24h and 1h before
6. **Day of visit** — check-in at reception (or self-check-in via QR)
7. **Post-visit** — receive consultation summary, prescription, lab orders, treatment-plan booking links
8. **Pay invoice** — via Razorpay link (UPI / card / EMI)
9. **Follow up** — see lab results when ready (email + WhatsApp notification), book next session
10. **Long-term** — access full history, download reports, manage consents

### 2.2 Doctor (Dr. Yuvraaj — main physician)

**Goal:** run consultations efficiently, manage patient journey, generate revenue.

1. **Login** to doctor portal → see dashboard with today's appointments + pending lab reviews
2. **Open next patient** → see full timeline: prior visits, vitals, meds, labs, treatment plans, photos
3. **Run consultation** — review RMO triage notes, capture exam findings, write diagnosis
4. **Order labs** — pick tests, choose vendor, send order (PDF + e-fax to lab)
5. **Prescribe** — drug search + dosage builder + duration → save + print + WhatsApp to patient
6. **Build treatment plan** — multi-session protocol (e.g. "5 infusions over 4 weeks + 3 rehab sessions")
7. **Generate invoice** → mark services rendered, send payment link
8. **Add progress note** between visits if patient calls/messages
9. **Review lab results** as they come in, flag abnormal values, ping patient for follow-up
10. **End of day** — review daily collections + tomorrow's schedule

### 2.3 RMO (Resident Medical Officer)

**Goal:** triage patients before they see Dr. Yuvraaj, capture vitals, handle minor cases.

1. **Login** to RMO portal → see today's patient queue (sorted by arrival time)
2. **Pull next patient** → open their record
3. **Capture vitals** (BP, HR, SpO2, weight, BMI auto) + chief complaint + history of present illness
4. **Initial assessment** → tentative diagnosis or notes for Dr. Yuvraaj's review
5. **Hand off to doctor** — patient now appears in Dr. Yuvraaj's queue with RMO notes attached
6. **Discharge minor cases** independently (cold, basic prescription) under doctor's standing orders
7. **Document** every action with timestamp + role attribution (audit trail)

### 2.4 Reception

**Goal:** patient intake, appointment management, payment collection, day-end reconciliation.

1. **Login** to reception portal → see today's appointments + walk-in queue
2. **Patient walks in** — search by phone / name; if new, register on the spot
3. **Check-in** — mark patient arrived, capture insurance details if applicable, route to RMO or doctor
4. **Phone booking** — patient calls, find available slot, book + confirm
5. **Reschedule / cancel** — handle changes per policy (cutoff, refund rules)
6. **Collect payment** — accept cash / card / UPI, generate receipt, send via WhatsApp
7. **No-show handling** — mark, auto-trigger follow-up message
8. **End of day** — daily collections report, hand cash to admin
9. **Patient queries** — answer phone, check appointment status, find lab reports

### 2.5 Infusion Specialist

**Goal:** safely administer IV therapies per doctor's treatment plan.

1. **Login** to infusion portal → see today's infusion-bay assignments
2. **Prepare** — pull patient record, verify treatment plan, check allergies, prep IV
3. **Pre-session** — record baseline vitals, verify consent, photograph the line site
4. **During session** — log drip rate, products administered, any adverse events
5. **Post-session** — record post-vitals, observations, patient-reported tolerance
6. **Update treatment plan** — mark session N of M complete, add notes for next session
7. **Emergency** — if adverse event, page doctor + log incident
8. **End of shift** — bay turnover + cleanup checklist + inventory restock request

### 2.6 Rehab Specialist (Physiotherapy)

**Goal:** deliver physical / occupational therapy sessions per treatment plan.

1. **Login** to rehab portal → see today's rehab schedule
2. **Prep** — pull patient's plan: exercises, target ROM, last session's pain score
3. **Session** — guide patient through exercise set, measure ROM, capture form video if needed
4. **Log** — exercises completed, reps, observations, patient-reported pain (1-10)
5. **Update plan** — progression / regression decision, recommendations for home program
6. **Communicate to doctor** — flag any concerns (worsening pain, non-compliance)
7. **End of day** — session log summary + tomorrow's prep

### 2.7 Aesthetics Specialist

**Goal:** deliver aesthetic procedures (facials, peels, lasers) per plan + protect with consent.

1. **Login** to aesthetics portal → see today's procedure schedule
2. **Pre-procedure** — confirm consent on file (versioned, signed), take before-photos
3. **Procedure** — log products used, settings (laser energy, peel concentration), duration
4. **Post-procedure** — take after-photos, record patient reaction, post-care instructions issued
5. **Update plan** — mark session N of M complete, schedule next session
6. **Patient handoff** — share post-care PDF, schedule follow-up, communicate red-flag symptoms
7. **End of day** — sterilization checklist + inventory + product reconciliation

### 2.8 Admin

**Goal:** keep the clinic running — staff, departments, system health, reports, compliance.

1. **Login** to admin portal → see system health dashboard
2. **User management** — onboard new staff, assign roles, deactivate departing staff
3. **Department config** — add departments, set fee structures, assign specialists
4. **System monitoring** — check CloudWatch alarms, Sentry errors, backup status
5. **Audit review** — weekly grep of audit log for unusual access patterns
6. **Reports** — pull operational + financial reports, share with Dr. Yuvraaj weekly
7. **Compliance** — verify consent updates land, manage data subject requests (access/erase)
8. **Vendor management** — coordinate with MSG91 / Brevo / Interakt for any service issues
9. **Backups** — quarterly restore drill, document RPO/RTO
10. **Incident response** — if a breach is detected, run the runbook end-to-end

## 3. What I'd recommend cutting for v1 (your call)

To make the timeline manageable and respect the budget, I'd suggest cutting or deferring:

- **Telemedicine video consultations** — heavy lift; defer to Sprint 4+
- **Mobile apps (iOS / Android)** — defer; web-responsive covers Sprint 1-3
- **AI features (transcription, anomaly detection, scheduling intelligence)** — Sprint 4+
- **Multilingual UI** — start English-only, add Hindi in Sprint 3
- **Marketing automation** — manual campaigns from Brevo UI for now
- **Multi-clinic** — single clinic until business expands
- **Custom report builder** — predefined reports for v1; custom in Sprint 4+
- **Tally / Excel accounting export** — manual CSV download for v1

If Dr. Yuvraaj insists on any of these, the timeline expands proportionally.

## 4. Open questions I'd like Dr. Yuvraaj to answer (via you)

1. **Doctor count at launch** — single physician (Dr. Yuvraaj only) or others? Affects the appointment system complexity.
2. **Operating hours / days** — clinic's schedule for appointment slot generation.
3. **Fee structure** — base consult fee, infusion session fee, rehab fee, aesthetic fee. We need defaults for the seed data.
4. **Lab partners** — which labs does Dr. Yuvraaj currently use? Affects lab-order routing.
5. **Existing patient records** — does Dr. Yuvraaj have an existing system / Excel / paper records to migrate? Affects Sprint 2 scope.
6. **Branding** — does the clinic have a name, logo, color palette? Affects FE polish.
7. **Telemedicine demand** — does Dr. Yuvraaj see remote consults today? Affects v1 vs v2.
8. **Insurance handling** — direct billing to insurers, or patient-pays-then-claims?

## 5. Your action

Please review the above (~10-15 min read), mark up the feature list and the journeys, and **reply to Varun at varunpratapsingh191@gmail.com** with the finalized scope. Keep me Cc'd so I can update the workbook + sprint plans the next morning.

Target turnaround: **by EOD Thursday May 14** so we can re-plan Sprint 1 on Friday morning and not lose more than 1 day of the 15-day sprint window.

— Vyara PM Agent (autonomous, on behalf of Algoborne)
Algoborne | AI-augmented engineering for the Vyara engagement
