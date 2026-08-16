# Wayfinder — Release Notes

**Release date:** 16 August 2026
**Scope:** This cycle covers everything shipped up to and including the improved planning-agent brief. Future release notes can be scoped to "since the previous release" — say the word and I'll cut them that way.

---

## Highlights

Wayfinder went from a single-trip wizard to a multi-plan planning tool for repeated use. You can now keep several holidays side by side, share and back them up, cost travel door to door, catch route problems before they bite, and hand off a sharper brief that tells the planner what changed since last time.

---

## New features

**Saved plans ("My Plans")**
Create, name, open, duplicate and delete multiple holiday plans. Everything auto-saves as you edit, and each plan remembers where you left off. A "Plans" button in the header opens the list; the active plan shows in the header with a quick rename.

**Plan version numbers**
Every plan carries a version (v1, v2, …), shown on its card and beside the active plan name. Bump it manually at a milestone — e.g. before sending to a client. The version flows into the export filename, the share link, and the top of the brief.

**Shareable links**
Share any plan as a link that opens it straight in a browser — no account or server needed (the whole plan is encoded in the URL). Uses your phone's native share sheet where available, otherwise copies to the clipboard. Opening a shared link saves a local copy and tidies the URL.

**Export / import**
Download a plan as a `.json` backup (or "Export all"), and import one back on any other device — the bridge for moving a plan between phone and laptop, since browser storage stays on one device.

**Real dates**
Set a single start date and Wayfinder lays out arrival–departure ranges for every stop, shows your full away-span, and drives the peak-season check off the actual month. Dated pills appear on the route spine, and the brief carries the dates per stop.

**Flight & ferry fares**
Each connection now has its own suggested per-person fare, with ferries priced differently from flights and the long-haul reflecting your cabin. Every fare is editable — drop in a real quote and it overrides the suggestion.

**Door-to-door transfers**
The full ground chain is now modelled: home → departure airport, terminal → your stay, and stay → terminal for the next leg, all the way through to the arrival airport → home. Ports and airports are priced differently. Every segment's description and price is editable.

**Route checks (your rules, baked in)**
Inline flags on the route step, drawn from real planning lessons: ferry seasonality (routes thin out beyond ~April–October), island minimum nights (e.g. Milos needs 3 for a Kleftiko boat day), awkward connections (e.g. Corsica → Naples has no direct service), and too-short ferry stops. A green "all clear" shows when nothing's wrong. The same checks flow into the brief.

**Brief changelog**
The final brief step now shows what's changed since you last handed it off — night counts, added/removed/reordered stops, mode swaps, dates, budget, interests, edited fares and transfers. The same list is placed at the top of the brief so the reader sees the delta first. The baseline resets when you copy the brief.

**Improved planning-agent brief (this release)**
The generated brief now frames Claude as an expert independent trip designer, tells it to treat the app's `~$` figures as placeholders and verify real routes and prices, and adds the practical layer an agent owns — passport validity, visas / entry rules (e.g. ETIAS), travel insurance, and transfers — plus booking-window guidance. A **Brief style** toggle on the final step switches between the new **Agent** wording and the original **Classic** wording; your choice is remembered.

**Export shortcut on the brief step**
An "Export plan" button sits alongside "Copy brief" so you can back up a plan the moment you've finished shaping its brief.

---

## Improvements

- Estimate split into clear sections: **Flights & ferries**, **Transfers**, and the rest, each with its own subtotal, feeding one indicative total range.
- Peak-season logic now derives from your actual start date rather than a chosen month.
- Local-transport line reworded so it no longer implies transfers are included (they're now itemised separately).

---

## Bug fixes

- **Incomplete transfers.** Earlier only the arrival-side transfer of each leg was modelled, so the whole outbound chain — home to the airport, and each accommodation back out to the airport/port — was missing. Transfers are now generated as a complete door-to-door chain.
- **Brief generator load error.** Fixed an ordering issue where the active plan was referenced before it was defined, which could stop the brief from rendering.
- **Stray characters in a plan card.** Removed a typo accidentally introduced into the plan-card markup during editing.
- **Double-counted ground transport.** The general "local transport" cost line no longer overlaps with the new itemised transfers.

---

## Known limitations

- **Prices are heuristics, not live quotes.** Suggested fares and transfers are sensible planning placeholders. A static site can't pull live fares on its own — that's what the editable fields and the "verify prices" instruction in the Agent brief are for.
- **Storage is per browser.** Saved plans live in the browser you saved them in; clearing that browser's site data wipes them. Export or a share link is your backup / cross-device bridge.
- **Transfer overrides reset once.** Because transfers were re-keyed for the door-to-door chain, any custom transfer prices set under the earlier one-per-leg version show fresh suggestions to re-enter. Fares and everything else carry over.
- **Migrated plans.** Existing plans open at v1 with an empty start date and no brief baseline; set the date once and copy the brief once, and both stick.

---

## Upgrade notes

Deployment is unchanged — replace `index.html` in the repository root and reload (a hard refresh or private tab clears any cached copy).
