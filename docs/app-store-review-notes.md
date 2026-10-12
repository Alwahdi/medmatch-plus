# App Store Review Notes — SyndeoCare

ملاحظات جاهزة للصق في App Store Connect (App Review Information) عند إرسال نسخة iOS.

## Review Accounts

### Clinic (منشأة)
- Username: `abdullahalwahdi464+applereviewclinic@gmail.com`
- Password: مخزنة كسر `APPLE_REVIEW_CLINIC_PASSWORD` (لا تُكتب نصًا في المستودع)
- Role: Verified clinic with completed onboarding. Can create and manage shifts, review applicants, search verified professionals, and use secure messaging.

### Healthcare Professional (مختص)
- Username: `ahmedalisalahs@gamil.com`
- Password: مخزنة كسر `APPLE_REVIEW_PRO_PASSWORD`
- Role: Verified professional with completed onboarding. Can browse and apply to shifts, manage accepted bookings, and use secure messaging.

Both accounts are pre-verified and onboarding-complete. No email OTP or document approval is required during review.

## Business Model (رد جاهز على سؤال Apple)

1. Users of paid content, subscriptions, or services: None. SyndeoCare currently has no paid digital content, subscriptions, consumables, or paid feature unlocks.
2. Where purchases occur: No purchases are available in the app or on the web.
3. Previously purchased content: None.
4. Paid features not using In-App Purchase: None.
5. Account creation: Clinics and healthcare professionals create accounts free of charge. Clinics publish real-world healthcare shifts and professionals apply to provide in-person healthcare services. Compensation displayed for a shift is payment for real-world person-to-person healthcare work, not digital content or an in-app service purchase.
6. Continued access: Facility accounts remain free after 30 days. No payment, subscription, renewal purchase, or paid upgrade is required. Verification and fair-use posting/search limits still apply; these limits cannot be bypassed through a purchase.

## Current correction and appeal evidence

- Replacement iOS source now limits new account registration to healthcare professionals. Existing facility accounts can still sign in, use their workspace and edit their profiles. Android/web facility registration remains available. New facility onboarding and direct profile-creation links are blocked in iOS. This does not alter database authorization.
- This registration restriction is NOT in the rejected build 8. A replacement iOS build and device checks are required before telling Apple it is available in the submitted binary. Do not send the previous appeal claiming the current binary includes this change.
- After the replacement build is tested and selected, add this to App Review Notes: "New account registration in the iOS app is available only for healthcare professionals. Existing facility accounts can sign in and use the app. Both account types remain free; there are no subscriptions, purchases or paid feature unlocks."
- No build or submission was started here. The existing main-branch mobile push workflow still automatically builds and uploads to App Store Connect when its credentials are configured; uploading alone does not submit a version for review.

- The former 30-day expiration was a real legacy access restriction, not just wording. It was removed from the database access predicate and publishing gate on 12 October 2026; inactive accounts remain blocked and quotas/verification/privacy are unchanged.
- The revised legal terms are administrator-managed and available to the existing mobile app after refresh. No native source changes or new iOS build were needed for this correction. The reviewed binary itself still needs physical-device verification; do not claim it was tested here.
- Website wording changes are in the preview until the owner publishes/deploys them. Do not say the public website is corrected before checking its live URLs.
- Use `docs/apple-review-appeal.md` for the appeal draft and evidence checklist. Never submit screenshots of private real-user data or include passwords in evidence files.

## Permission Usage Strings (جاهزة)

- Location access is optional and is used to suggest the user's city and store coordinates for nearby shift matching.
- Photo access is optional and is used for profile images, clinic logos, documents, and message attachments.

## ملاحظات

- أسباب الرفض السابقة المعالجة: Support URL يعمل (`https://www.syndeocare.ai/contact`)، حساب مراجعة يعمل بدون OTP، وتوضيح نموذج الأعمال أعلاه.
- التحديثات اللاحقة تخضع للمراجعة أيضًا لكنها عادة أسرع.
