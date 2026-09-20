# Cennik

Source: Figma file `3GIk2uHbYEClWBNVw3geOa`, mobile frame `1165:2605`.
The standalone App Router shell intentionally omits the public Header/Footer,
matching the compact logo/close header and fixed selection bar.

## Pricing decisions

`pricing.ts` is the page's pricing/availability source of truth. All money is
stored and calculated in integer grosze. Subscription, commission, and booking
overage are separate gross components, so the visible equation always sums
exactly to the displayed monthly estimate.

- Net subscriptions: 0 / 70,73 / 142,28 zł; commissions: 11 / 5 / 0%; included
  registrations: 100 / 500 / unlimited. Source: pricing Figma frame.
- VAT: 23%. The owner explicitly confirmed net pricing, overriding the frame's
  contradictory “brutto / mies.” plan-card labels. Cards now say “netto / mies.”.
- Flex overage: 0,25 zł per registration from the existing `/system-dla-studiow-jogi` FAQ
  (`marketing-data.ts`, sourced from Figma `1556:3001`). Treated as net consistently
  with the owner-approved VAT decision.
- Balans overage: provisional 0,25 zł net over 500; no authoritative backend rule
  found. Explicitly approved by the owner; named assumption constant in config.
- Feature availability is explicit per feature. Flex includes the first nine;
  Balans additionally includes short URL, attendance, statistics, and multi-studio
  management; Przestrzeń includes everything. Stable partitioning puts unavailable
  features last. Balans ends with lotus, unlimited registrations, then 0% commission.
- Defaults: 1 000 zł sales, 250 registrations. Correct totals are **181,43 /
  148,50 / 175 zł gross**, recommending **Balans**. The mockup's 330 / 187 / 175 zł
  and Przestrzeń recommendation are intentionally not reproduced, with approval.
- Flex remains initially selected as in the frame. Calculator recommendations never
  change that selection; plan cards and calculator result buttons do. The result rows
  separate fixed subscription, variable costs, and their estimated total.
- The CTA follows only the selected plan and always shows its fixed gross subscription:
  Flex 0 zł, Balans 87,00 zł, Przestrzeń 175,00 zł. CTA: `/studio/dodaj`.
- The calculator estimates accrued monthly charges; the FAQ's invoice issuance
  threshold does not change those costs. Payment-provider fees remain excluded.
- Slider ticks use piecewise-linear interpolation to retain Figma's evenly
  spaced non-linear labels. Accessible values expose actual sales/registrations.

## Exact local assets

All files below are unmodified SVG exports made through the Figma Plugin API,
not redrawn icons. Directory: `public/images/pricing/`. Exported directly from
the icon child of each feature row (`I<row ID>;1060:2881`), preserving instance
overrides that the combined design-context asset response did not preserve.

| File              | Figma row/node |
| ----------------- | -------------- |
| logo.svg          | 1197:3897      |
| profile.svg       | 1191:2594      |
| ai.svg            | 1191:2619      |
| events.svg        | 1191:2599      |
| schedule.svg      | 1191:2604      |
| registrations.svg | 1191:2609      |
| email.svg         | 1191:2614      |
| notifications.svg | 1191:2929      |
| import.svg        | 1188:3409      |
| search.svg        | 1188:3410      |
| short-url.svg     | 1188:3411      |
| waitlist.svg      | 1188:3412      |
| attendance.svg    | 1191:2919      |
| statistics.svg    | 1191:2924      |
| lotus.svg         | 1188:3413      |
| studios.svg       | 1191:2934      |
| commission.svg    | 1191:2939      |

Close and disclosure chevrons reuse the existing `lucide-react` glyphs; actions
reuse the project Button. No remote or expiring asset URLs are used.
