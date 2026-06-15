# End-to-End Test Cases — Assessment → Booking → RMO → Doctor → Prescription

Source: manual E2E run on 12–13 Jun 2026 (local dev, seeded demo accounts).
Status column = observed result during that run.

**Demo accounts**
| Role | Email | Password |
|---|---|---|
| Admin | admin@vyara.local | Demo@123 |
| Doctor | dr.yuvraaj@example.com | Demo@123 |
| RMO | rmo.kavita@example.com | Demo@123 |

---

## Module A — Public site: quiz & booking

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| A-01 | Request Consultation entry | Open `/` → click "Request Consultation" (header) | Navigate to `/assessment` | ⚠️ Pass (coordinate click only — see ISS-04) |
| A-02 | Resume banner & Start over | With saved answers, open `/assessment` → click "Start over" | Saved answers cleared; quiz starts from Q1 | ✅ Pass |
| A-03 | Gender branch | Pick "Men — Begin Here" | Male question path; female-only questions skipped | ✅ Pass (see ISS-07 numbering) |
| A-04 | Quiz progression | Answer Q1–Q15 via option + Next | Level tabs 1→6 advance; URL `/assessment/q/N` increments | ✅ Pass |
| A-05 | Yes/No grid question | Q13 symptoms: set Yes/No per item | Toggles persist; Next advances | ✅ Pass |
| A-06 | Multi-select condition question | Q12 select a condition | Selection registers; Next advances | ✅ Pass |
| A-07 | Result page | Finish quiz ("See Results") | Score + band shown (e.g. 14/50 Mild Imbalance), focus areas, insight | ✅ Pass |
| A-08 | Booking form validation | "Book My Assessment" → fill name/email/phone | Required fields enforced; calendar blocks past dates & Sundays | ✅ Pass |
| A-09 | Slot selection | Pick date → pick time slot | Slots render for date; selected slot highlights | ✅ Pass |
| A-10 | Confirm booking | "Confirm Booking" | Success page with booking reference (BOOK-XXXX), date/time, patient details; confirmation email noted | ✅ Pass |
| A-11 | Booking lands in admin | Login RMO → Appointments | New appointment visible, status **Requested**, assigned staff, reason from assessment | ✅ Pass |
| A-12 | Quiz submission in admin | Admin/staff → Assessments | One row per attempt with score, band, preferred slot, booking ref | ✅ Pass |

## Module B — RMO flow

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| B-01 | RMO login | Login rmo.kavita@example.com | Dashboard with role "Rmo" | ✅ Pass |
| B-02 | Accept appointment | Appointments → row kebab → Accept | Toast "Appointment accepted"; status Requested → **Confirmed** | ✅ Pass |
| B-03 | Start appointment (RMO) | Kebab → Start appointment | RMO Consultation workspace; tabs RMO Consultation / Vitals / Summary; 6 sections | ✅ Pass |
| B-04 | RMO form save + hydrate | Fill all sections → Save consultation → reload | Toast "RMO consultation saved"; values hydrate on revisit | ✅ Pass |
| B-05 | Record vitals | Vitals tab → fill BP/HR/weight/temp/SpO₂ → Save vitals | Toast "Vitals recorded"; "Latest reading" card updates with recorder + date | ✅ Pass |
| B-06 | Book with Dr. Yuvraaj | Footer "Book with Dr. Yuvraaj Singh" | RMO notes saved, then Add-Appointment wizard with patient + doctor prefilled | ✅ Pass |
| B-07 | Doctor booking wizard | Pick date → slot → details → review → Book Appointment | Slots per duration; review shows patient/doctor/date/time; new appointment created **Requested** | ✅ Pass |

## Module C — Doctor flow

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| C-01 | Doctor login | Login dr.yuvraaj@example.com | Dashboard with role "Doctor" | ✅ Pass |
| C-02 | Accept own appointment | Appointments → kebab → Accept | Status → Confirmed | ✅ Pass |
| C-03 | View appointment summary | Kebab → View | Overview (patient, doctor, date/time, reason, notes), status history, Mark completed / Reschedule / Cancel | ✅ Pass |
| C-04 | View quiz assessment (kebab) | Kebab → View quiz Assessment | Navigate to quiz detail for that appointment | ❌ Fail — click no-ops (ISS-01); workaround via Assessments page works |
| C-05 | Start appointment (doctor) | Kebab → Start appointment | Doctor Consultation: Patient Detail / Infusion, Rehab & Aesthetic / Test / Final Prescription; View RMO Summary + Print prescription buttons | ✅ Pass |
| C-06 | Full data capture | Fill all groups incl. demographics, consultation details (date/duration/mode), preliminary RMO summary, family history, RR, anthropometrics (BMI/body-fat/waist/hip/WHR), systemic exam (CVS/RS/P/A/CNS), clinical impression → Save → reload | All values persist & hydrate | ✅ Pass |
| C-07 | Supplements / infusion tables | Add rows in both tables → Save → reload | Rows persist (product/dose/timing/duration; therapy/dose/schedule/purpose) | ✅ Pass |
| C-08 | Auto-complete on prescription | With Final Prescription data, Save consultation (appointment Confirmed) | Toasts "Consultation saved" + "Appointment marked completed"; status → **Completed** | ✅ Pass |
| C-09 | No premature completion | Save consultation with empty Final Prescription | No COMPLETED transition fired | ✅ Pass (by design check) |
| C-10 | Prescription sheet content | Open Print prescription | Sheet shows sections 1,2,3,5,6,7,8,9 (no section 4 / photo / program) with header meta box, signature block, footer; all saved data present | ✅ Pass |
| C-11 | Print output | Click "Print prescription" → browser dialog | Only the sheet prints (no admin chrome), A4, colors preserved, fits page width | ◻️ Not fully verified (visual dialog not automated) |
| C-12 | Prescription guard | Open `/prescription` for appointment without MAIN consult | Friendly error: "no doctor (MAIN) consultation to print" | ◻️ Not run |
| C-13 | View prescription in kebab | List → kebab on **Completed** row | "View prescription" item shown; navigates to sheet | ✅ Pass |
| C-14 | Kebab hidden when not completed | Kebab on Requested/Confirmed row | No "View prescription" item | ✅ Pass |

## Module D — Access control

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| D-01 | Doctor scoped list | Login doctor → Appointments | Only appointments where staff = own profile (1 of 2 in seed run) | ✅ Pass |
| D-02 | RMO scoped list | Login RMO → Appointments | Only own-assigned appointments | ✅ Pass (same code path as D-01) |
| D-03 | Admin sees all | Login admin → Appointments | Full book (2 of 2) | ✅ Pass |
| D-04 | staffId override blocked | As doctor, `GET /api/appointments?staffId=<other>` | Returns only own appointments (param overridden) | ◻️ Not run (code-enforced) |
| D-05 | Non-staff non-admin | Login account with no staff profile | Empty appointment list | ◻️ Not run |
| D-06 | Logout / re-login | Sign out → login other role | Session switches cleanly; scoping follows new role | ✅ Pass |

---

**Legend:** ✅ Pass ❌ Fail ⚠️ Pass with caveat ◻️ Not executed

See `appointment-flow-issues.md` for the full defect list referenced above.
