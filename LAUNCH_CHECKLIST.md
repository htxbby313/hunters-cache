# Hunter's Cache launch checklist

Status checked October 9, 2026. An accessible website does not establish transaction readiness.

## Business details

- Business/brand name: Hunter's Cache
- Short description: An online marketplace connecting hunters and outdoor enthusiasts to buy and sell hunting gear, outdoor equipment, and firearms through approved payment and transfer providers.
- Domain: https://hunterscacheusa.com
- Professional email: hq@hunterscacheusa.com
- Legal entity name and email delivery: not verified in this check.

## Verified today

- Netlify homepage and provider status endpoint return HTTP 200.
- Provider status reports PostgreSQL.
- Root domain still resolves to Squarespace addresses.
- GunTab, FFL provider, and comparable-sale import are not configured.
- Firearm checkout is disabled.

## Work requiring account access or external approval

- Identify the Squarespace account owning the domain; connect root and www to Netlify while preserving Google Workspace mail records.
- Verify domain HTTPS, canonical redirects, and email delivery after DNS changes.
- Verify the GunTab business account and bank account; configure test credentials and signed webhooks before live credentials.
- Configure the FFL provider and verify receiving-license validation before enabling firearm checkout.
- Approve Terms, Privacy Policy, seller agreement, prohibited-items and dispute policies with appropriate counsel; settle tax requirements.
- Configure durable photo storage, monitoring and database backups; prove restoration.
- Exercise signup, listing, messaging, checkout, payment events, shipment, cancellation/refund and dispute flows end to end.
- Validate a real transaction before declaring public launch ready.

## Engineering follow-up

- Save the existing implementation in a reviewed Git checkpoint after checking for secrets and generated files.
- Deploy and verify subsequent fixes; local validation alone does not confirm production behavior.
- Import only attributable completed-sale evidence for market-price estimates.
