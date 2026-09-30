# Mobile experience quality pass

- [ ] Finish store release only after verified deletion fulfillment (not merely request submission), physical iPad/Android reviewer login tests, and store-owner credentials; do not submit automatically

- [x] Store resubmission essentials in the mobile interface: direct support, account deletion request with review status, and iOS email/password login without third-party-only login
- [x] Allow enrolled-MFA mobile users to complete a TOTP challenge in-app before protected account deletion requests
- [x] Implement service-role account deletion finalizer and guarded endpoint; reject requests without cron authentication
- [ ] Configure and test a production scheduler for the deletion endpoint; validate end-to-end deletion/retries on a dedicated disposable account, plus reviewer login on a physical iPad before submission
- [ ] Submit iOS replacement and Android internal test only after device QA and store credentials are available (account-holder action; do not publish automatically)

- [ ] Redesign the complete mobile onboarding and role-based journeys: resumable account setup, honest verification status, progressive forms, polished Arabic/English screens, and real-device validation (device and isolated QA accounts required)
- [x] Resume roleless accounts at the setup checklist; provide confirmation-email recovery, profile-to-checklist return, accurate document review states, and browse access after a completed professional profile

- [x] Keep Google One Tap and the visible Google sign-in button on syndeocare.ai, completing the session in place instead of returning to the Lovable domain

- [x] Establish logo-derived teal/violet visual direction and Cairo typography for the mobile shell and sign-in
- [x] Improve shared listing cards, publishing-field feedback, applicant decisions, interview form, message composer, and verification-gated facility actions
- [ ] Complete an award-caliber visual/interaction pass across every mobile workspace and form (requires screen-by-screen native device review)

- [x] Audit onboarding, professional discovery/home, detail actions, facility shift state, and activity status language; fix confirmed mobile navigation and recovery issues
- [x] Keep candidate search visibility behind the authorized visibility action rather than writing the protected profile field directly
- [ ] Verify application, booking, publishing, messaging, and interview journeys on physical Arabic/English devices with isolated professional and facility accounts (device access and QA accounts required)

- [x] Replace free-text countries and cities with administrator-managed searchable choices in mobile profiles and publishing; preserve historic values
- [x] Replace free-text facility type with existing categories and retain historic types
- [x] Consolidate applicant decisions into one action and remove repeated home actions/statistics

- [x] Publish every pushed commit to a unique Expo branch for independent Expo Go testing

- [x] Repair critical journey entry points: facility shift detail, interview date selection, message failure and verification states
- [x] Improve publishing: full searchable specialty selection, validation, review-stage errors and existing application/booking feedback
- [x] Align navigation, permissions, accessible labels and manual message/notification refresh with product preferences
- [ ] Validate all changes with Expo Android/iOS export and typechecks through CI; run real-device RTL/LTR, keyboard and screen-reader journeys with test accounts
- [ ] Extend shift detail with actual owner actions and bookings only after verifying available authorized RPCs and business rules
- [ ] Conduct moderated usability tests with Yemeni professionals and facilities; refine typography, copy, and layouts from device screenshots rather than claiming pixel-perfect results without device testing

- [ ] Eliminate confirmed mobile creation failures: trusted search-visibility update, booking-status alignment, role activation, validation parity, and actionable error mapping
- [ ] Complete end-to-end professional and facility journey QA with isolated accounts, including create/profile/publish/apply/book/interview/message/review states
- [ ] Complete native screen-by-screen design-system and information-architecture review after critical flows are reliable (requires real device captures)

- [x] Fix publisher-consent persistence and human-readable shift review dates
- [x] Lock mobile professional/facility country and city after first save; route changes to admin approval
- [x] Route established mobile professional specialty changes through the administrator's data-change review queue
- [ ] Improve mobile photo, document renewal and manager-controlled upload window
- [ ] Add city then optional district in publishing with manager policy
- [ ] Repair mobile sheets, date/time, conversations and attachments
- [x] Make mobile city and specialty selections searchable lists; map notification links to existing mobile pages
- [ ] Enable dark mode and review role-specific onboarding and form polish
