# Third-Party Vendor Costs

Costs for SaaS / API vendors that Vyara depends on, separate from AWS. Calculated at MVP scale: **~100 patients/month, ~500 SMS sends/month, ~200 WhatsApp conversations/month, ~50 payment transactions/month**.

**Account ownership:** Most patient-facing vendor accounts (MSG91, Brevo, Interakt, Razorpay) are **owned by Dr. Yuvraaj's clinic** — billing goes directly to the clinic, sender identities are in the clinic's name. Algoborne integrates via API keys the clinic shares with us. Only Algoborne-internal tools (Resend for dev-ops email, GitHub, Sentry, UptimeRobot, Anthropic) are owned by Algoborne.

## Summary — who pays what per month

| Bucket | Phase 1A (dev) | Phase 1B (dev + prod, MVP) | Steady state (Year 1) | Paid by |
|---|---|---|---|---|
| AWS (infra) | ~₹2,000 | ~₹4,500 | ~₹6,000 | **Client** (Dr. Yuvraaj's AWS account) |
| Vendor fixed (Interakt + DLT) | ₹0 | ₹1,400 | ₹3,650 | **Client** (clinic-named accounts) |
| Vendor variable (SMS + WA templates) | ₹0 | ~₹200 | ~₹670 | **Client** (clinic-named accounts) |
| Razorpay fees (2.36% per txn) | ₹0 | ~₹2,360 | ~₹7,080 | **Client** (clinic merchant account, deducted from settlements) |
| Domain | ₹0 (vyara.algoborne.com) | ₹35 | ₹35 | Algoborne (dev) / Client (prod) |
| **Client total** | **~₹2,000** | **~₹8,495** | **~₹17,435** | |
| **Algoborne total (Vyara-specific)** | **₹0** | **₹35** | **₹35** | Plus existing Anthropic/GitHub plans |

Algoborne's ongoing cost exposure for Vyara is effectively zero — we use free-tier tools (Resend, Sentry, UptimeRobot, GitHub) and our existing Anthropic plan. The client pays for everything that scales with their business.

## Fixed monthly vendor costs

| Vendor | Service | Plan | Phase 1A | Phase 1B | Notes |
|---|---|---|---|---|---|
| **MSG91** | OTP / transactional SMS | Pay-as-you-go (no base) | ₹0 | ₹0 | **Account in clinic's name** (clinic is sender). Algoborne integrates via clinic's API key. Charges only per SMS — see variable section. |
| **Brevo** | Patient transactional email + future marketing | Free tier 300/day, 9,000/mo | ₹0 | ₹0 | **Account in clinic's name** (clinic is sender). Sufficient for MVP free tier. Upgrade to "Starter" (₹1,650/mo, 20k/mo) when volume exceeds. |
| **Interakt** | WhatsApp Business API | Starter plan | ₹0 (not signed up yet) | **₹999** | **Account in clinic's name**, WABA approved for clinic's number. Mandatory for WA Business API access. |
| **Resend** | Internal dev-ops email (assignments, reports) | Free tier 3,000/mo | ₹0 | ₹0 | **Algoborne-owned** (sends from `hello@algoborne.com`). Internal team comms only — no patient data. |
| **Razorpay** | Payment gateway | No monthly fee | ₹0 | ₹0 | **Merchant account is in Dr. Yuvraaj's clinic name** — clinic collects directly, Algoborne integrates via API key. We never hold patient funds. |
| **Sentry** | Error monitoring | Developer (free) | ₹0 | ₹0 | **Algoborne-owned** (engineering visibility). Free tier 5,000 errors/mo. |
| **UptimeRobot** | Uptime monitoring | Free tier (50 monitors, 5-min checks) | ₹0 | ₹0 | **Algoborne-owned** (Cloud Engineer agent + Kunal get alerts; clinic Cc'd). Free tier sufficient. |
| **GitHub** | Code hosting | Free (private repos) | ₹0 | ₹0 | **Algoborne-owned**. Already using. |
| **Anthropic Claude** | AI agents (PM, Dev, Cloud Engineer, etc.) | Existing Anthropic plan | covered by plan | covered by plan | **Algoborne-owned**. Token-cost bundled in existing plan. |
| **Dev domain** | (deferred — Phase 1A access via EC2 elastic IP, no domain) | n/a | ₹0 | ₹0 | Skipped per CEO direction. |
| **Prod domain** (Phase 1B) | clinic picks at Phase 1B kickoff | Annual | ₹0 | **₹35** (₹400/year amortized) | **Client decides + owns**. May use clinic's existing domain. |
| **DLT base fee** (TRAI registration) | Sender ID + template registration | One-time + nominal annual | ₹0 | **~₹400/mo amortized over 12 mo from a ~₹4,500 one-time fee** | **Clinic-name registration** (sender ID is clinic). Required by law for SMS in India. ~7-15 days to approve. Recurring annual renewal ~₹1,500. |
| **Total fixed** |  |  | **₹0** | **~₹1,434/mo** | |

## Variable per-message / per-transaction costs

| Vendor | Unit | Rate | Phase 1B (MVP, ~100 patients/mo) | Steady state (~300 patients/mo) |
|---|---|---|---|---|
| MSG91 SMS | per SMS | ₹0.15 | ~500 SMS/mo × ₹0.15 = **₹75** | ~1,500 SMS/mo = **₹225** |
| MSG91 OTP | per OTP send | ₹0.20 (slightly higher than transactional) | ~300/mo × ₹0.20 = **₹60** | ~900/mo = **₹180** |
| Interakt WA — Marketing template | per message | ₹0.78 (Meta rate, ap-south) | ~50/mo = **₹39** | ~200/mo = **₹156** |
| Interakt WA — Utility template | per message | ₹0.18 | ~150/mo = **₹27** | ~600/mo = **₹108** |
| Interakt WA — Service window (24-hr reply) | per session | ₹0 | unlimited | unlimited |
| Razorpay | per transaction | 2% + 18% GST = 2.36% | ~50 txns/mo × avg ₹2,000 = ~₹100,000 GMV → ₹2,360 → **but typically passed to client** | ~150 txns → ₹7,080 → passed to client |
| Brevo email | per email beyond free | ₹0 (free tier covers MVP) | ₹0 | ~₹0 if <9,000/mo |
| **Total variable (Algoborne pays)** | | | **~₹201/mo** | **~₹669/mo** |
| **Razorpay passed to client** | | | (₹2,360) | (₹7,080) |

Razorpay fees go directly against Dr. Yuvraaj's clinic merchant account — they never hit Algoborne's books. Algoborne integrates via the clinic's Razorpay API key. Marked separately so the total reflects what Algoborne actually pays.

## One-time setup costs (amortize over Year 1)

| Item | Cost | When |
|---|---|---|
| DLT entity registration with TRAI | ~₹2,500 | Before MSG91 KYC completes |
| DLT template approval (×~10 templates) | ~₹150 × 10 = ₹1,500 | Same as above |
| Facebook Business Manager verification (for Interakt) | ₹0 | During Interakt onboarding |
| Interakt onboarding fee (one-time setup) | ₹0–₹5,000 depending on plan | At signup |
| Razorpay merchant onboarding | ₹0 | Self-service |
| Domain registration (Phase 1B) | ₹400 | At Phase 1B kickoff |
| **Total one-time** | **~₹4,400–9,400** | Phase 1A → Phase 1B kickoff |
| Amortized over 12 mo | **~₹400/mo** | included in Phase 1B numbers above |

## Sequencing — vendor onboarding (parallel to AWS work)

These all have 5-15 day SLAs and don't block AWS provisioning. Kunal owns kicking them off:

| Vendor | Lead time | Owner | Status |
|---|---|---|---|
| MSG91 KYC + DLT registration | 7-15 business days | Kunal | Not started |
| Interakt + WhatsApp Business approval | 5-10 business days | Kunal | Not started |
| Brevo signup | <1 hour | Kunal | Not started |
| Razorpay merchant signup | 1-3 business days | **Dr. Yuvraaj** (account in clinic's name); Kunal coordinates handover of API key to Algoborne | Not started |
| Sentry + UptimeRobot | <30 min each | Anyone | Not started |

Start MSG91 + Interakt **this week** — they're the longest poles. Brevo / Sentry / UptimeRobot can wait until first deploy.

## What changes the cost story

| Trigger | Impact |
|---|---|
| Patient volume × 3 | Variable cost × 3 (~₹600/mo more) |
| Patient volume × 10 (multi-clinic) | Brevo Starter (~₹1,650/mo), MSG91 volume discount, Interakt Growth plan (~₹2,499/mo) |
| Marketing campaigns to past patients | WhatsApp marketing templates @ ₹0.78 each — careful, this scales fast |
| Add HIPAA-tier vendors (post BAA decision) | MSG91 → Twilio HIPAA-eligible (~5× cost), Brevo → SendGrid HIPAA tier (~$50/mo base) |
| Anthropic plan exhaustion (rare at current agent volume) | Upgrade to Anthropic Team or Enterprise — affects Algoborne globally, not just Vyara |

## Cost-control safeguards built in

- **MSG91 DLT-only sending** — templates pre-approved, no rogue ad-hoc sends.
- **Resend daily cap (90 sends/day)** — already enforced in `scripts/send_email.sh`. Prevents runaway dev-ops emails.
- **WhatsApp template approval** — Meta gates this, can't accidentally blast marketing templates without category-approval.
- **Razorpay test mode for dev** — no real payments charged during development.
- **Anthropic agent SLAs** — each scheduled task has a `≤N tool uses` ceiling to prevent token blow-ups.

These keep variable spend predictable and within the cost forecast above.
