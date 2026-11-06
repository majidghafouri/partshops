# Partshop — resume TODO

Updated: 2026-11-06. Production build is deployed to `https://partshops.ir`; next work is below.

## Must finish

- [ ] Kavenegar SMS rollout:
  - Provide `KAVENEGAR_API_KEY` plus either `KAVENEGAR_OTP_TEMPLATE` or `KAVENEGAR_SENDER`.
  - Add values to Vercel production env, redeploy, then smoke-test `/api/auth/otp/request` and `/api/auth/otp/verify` with a real phone.
  - Confirm cooldown/correct-code/wrong-code errors remain Farsi and field-specific.
- [ ] Confirm Google OAuth in Google Cloud Console:
  - Authorized redirect URIs: `https://partshops.ir/api/auth/google/callback` and `http://localhost:3000/api/auth/google/callback`.
  - Click through production Google login/register once.
  - Rotate the Google client secret if it was shared in chat.
- [x] Admin/user password-change flow added (`/api/auth/password`, `/account/settings`); admin should still rotate the seeded credential via the settings page.
- [ ] Refresh local Vercel Blob OIDC token if local upload testing is needed again via `vercel env pull .env.local`.

## Production notes already done

- Additive Prisma schema change for `Attachment` was pushed and deployed.
- Private Vercel Blob uploads were converted to OIDC presigned flow (`handleUploadPresigned` + `uploadPresigned`).
- Verified production image/audio/video upload, request creation, authenticated attachment proxy, and anonymous `401` blocking; smoke user and blobs were cleaned up.
- OTP production fallback correctly returns Farsi `503` with `field: "phone"` until Kavenegar is configured.
- Git repository is live on GitHub (`majidghafouri/partshops`); all source changes are committed/pushed and deployed.
- Seller signup is now minimal with guided profile onboarding; Dana font applied.

## Optional later polish

- [x] Account settings page added (profile + password change).
- [ ] Email verification and password reset (deferred: needs email/SMS provider; Kavenegar pending).
- [x] 404/error/loading pages, sitemap, robots, and toast notifications added.
- [ ] Add orphan Blob cleanup if attachment rows are deleted without deleting Blob objects.
