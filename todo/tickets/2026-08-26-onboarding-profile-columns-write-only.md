# Decide fate of three write-only onboarding profile columns

## Background

Surfaced during the 2026-08-26 dead-code cleanup's database audit. `apps/web/app/api/onboarding/complete/route.ts:187-190` writes `profiles.company_size`, `profiles.role`, and `profiles.referral_source` for every user who completes onboarding (61 rows populated as of the audit). Nothing in the app reads any of the three back — no admin view, no segmentation, no analytics query.

This pairs with `apps/web/consts/onboarding.ts`: the underlying `COMPANY_SIZES`, `USER_ROLES`, `REFERRAL_SOURCES` const arrays still drive the onboarding form UI and stay in place, but the cleanup deleted the now-dead derived types `CompanySize`, `ReferralSource`, `UserRole` (zero references outside their own declaration) since nothing consumed the typed values downstream of collection.

## What's needed

Pick one:
1. **Build the reader** — surface this in an admin/segmentation view if it's meant to inform product or sales decisions.
2. **Stop collecting it** — if there's no plan to use it, drop the fields from the onboarding form and the three DB columns to stop accumulating write-only data.

Either way, worth checking whether this was meant to feed something that never got built, or was simply speculative collection from early onboarding design.
