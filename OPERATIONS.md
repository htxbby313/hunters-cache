# Hunter's Cache operating policies

Version: 2026-10-08

## Transaction controls

- Keep all payments on GunTab. Hunter's Cache must never receive or store raw card or bank credentials.
- A listing is reserved when a GunTab invoice is created. It returns to active only after a verified cancellation, expiration, or refund event.
- A seller ships only after GunTab reports successful payment processing. Every shipment requires tracking, and GunTab fulfillment is updated at the same time.
- Firearms and other regulated items require the correct GunTab classification and a verified receiving FFL selected from the configured FFL provider.
- The first completed seller transaction has no Hunter's Cache fee. Later sales carry 5%, capped at $250. GunTab fees are separate.

## Identity and FFL verification

- GunTab performs payment-side identity and account verification. Hunter's Cache records only provider references and resulting status, never identity-document images.
- Internal verification requests remain `pending` until an authorized operator confirms the provider result.
- An FFL badge may be displayed only when the provider result is recorded as `verified` and has not expired.
- Never manually override a failed or expired FFL from an email or screenshot alone.

## Messaging and offers

- Keep listing and order discussions in marketplace messaging.
- Market-price offers are permitted only when at least three attributable completed-sale comparables support the estimate.
- Do not display active asking prices as completed-sale market evidence.
- Off-platform payment solicitation, evasion of transfer rules, threats, spam, and illegal-item discussions must be reported.

## Disputes

- Allow one active dispute per order and preserve the order, message, shipment, and audit records.
- GunTab controls payment holds, refunds, returns, and disbursement decisions for its transactions.
- Hunter's Cache resolves marketplace conduct and account access; it must not promise a refund GunTab has not approved.
- Record every operator decision, reason, assignee, and completion time.

## Moderation

- Review reports oldest first, with immediate priority for threats, suspected stolen goods, prohibited weapons, fraud, or attempts to bypass an FFL.
- Operators may hide a listing during review. Account suspension requires recorded evidence and a reason.
- Preserve reported messages and transaction evidence. Do not expose the reporting user's identity to the reported party.
- Provide an appeal route for listing removals and account restrictions.

## Production data and privacy

- Production never falls back to demo listings or demo orders.
- Secrets belong in the hosting provider's encrypted environment settings, never in source control.
- Collect only data needed for transactions, safety, tax/accounting, and support.
- Establish retention periods with counsel before public launch. Identity documents should stay with the verification provider.
- Back up the production database, test restoration, and restrict operations endpoints with a separate high-entropy key.

## Daily operations checklist

1. Review failed GunTab webhooks and unmatched order IDs.
2. Review open disputes, moderation reports, and verification requests.
3. Check reserved listings older than the GunTab checkout window.
4. Check paid orders without shipment movement.
5. Reconcile completed GunTab transactions, gross merchandise value, marketplace fees, refunds, and chargebacks.
6. Review security logs and unusual signup, messaging, offer, or checkout volume.

## Launch gate

Public launch requires approved Terms, Privacy Policy, prohibited-items policy, dispute policy, seller agreement, firearms counsel review, tax advice, verified business bank account, live GunTab credentials, signed webhook configuration, FFL provider credentials, durable production storage, backups, monitoring, and a successful real end-to-end transaction.
