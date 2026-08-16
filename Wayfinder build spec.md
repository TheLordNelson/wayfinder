# Wayfinder — App Build Spec

A complete specification for building **Wayfinder**, a mobile-first holiday-planning web app. Written so it can be handed to Claude (or a developer) to regenerate the app. It describes *what to build*, not the trip-planning brief the app produces — that's a separate document (`Claude prompt.md`).

---

## 1. What to build

A single, self-contained `index.html` — a step-by-step ("wizard") holiday planner for one or a few travellers. The user builds a multi-stop trip, sees live AUD cost estimates, and at the end gets a ready-to-paste brief for an AI travel planner. The app also stores multiple named plans, versions them, and lets the user share/export them.

**Signature visual:** a vertical "route spine" — a chart-paper aesthetic with a brass-and-navy palette, each stop a node on a vertical rail, each connection a labelled leg between nodes.

---

## 2. Tech & deployment constraints

- **One file, no build step.** Everything (HTML, CSS-in-JS, app code) lives in `index.html`. It must run by opening the file or serving it statically.
- **React via CDN + Babel Standalone.** Load React, ReactDOM and `@babel/standalone` from a CDN (e.g. jsdelivr); put the app in a `<script type="text/babel">`. Show a "Loading Wayfinder…" placeholder and a friendly error/timeout message in case scripts fail.
- **Target: GitHub Pages** (static hosting) on a phone. Must be fully client-side.
- **Styling is inline style objects** (no Tailwind, no external CSS framework). Define a set of shared style consts near the bottom.
- **Persistence is `localStorage`** (fine on a real static site). Guard every access in try/catch.
- All state is React `useState`/`useMemo`/`useEffect`. No router; a numeric `step` and a `view` flag drive navigation.

---

## 3. Design system

**Colour tokens**

| Token | Hex | Use |
|---|---|---|
| `INK` | `#16324F` | deep navy ink (primary text, buttons) |
| `INK_SOFT` | `#3C5A78` | muted navy (secondary text) |
| `BRASS` | `#B8860B` | brass gold (accents, node dots) |
| `BRASS_DEEP` | `#8C6608` | darker brass (emphasis) |
| `SEA` | `#2F7C86` | ferry teal |
| `PAPER` | `#F6F1E4` | warm chart-paper background |
| `PAPER_2` | `#FBF8F0` | lighter paper (cards) |
| `LINE` | `#E4DCC8` | hairline borders |

**Typography:** Georgia / serif for headings and plan names; `ui-monospace` for figures (nights, prices, dates); system sans for body.

**Layout:** mobile-first, centred column `max-width: 560px`. Sticky header (brand + Plans button + active-plan pill) and a sticky footer showing running `{totalNights} nights` and `{low}–{high}` cost with Back/Next.

**Icons:** small inline SVG components sharing a base (`stroke="currentColor"`, no fills) — compass, users, map-pin, plane, ship, home, calendar, plus/minus, arrows, trash, copy, check, chevron, sparkles, folder, x, pencil, download, upload, file-plus, link, car.

---

## 4. Wizard structure (steps 0–6)

0. **Welcome** — intro + start.
1. **Travellers** — traveller count (stepper) and party type (Couple / Family / Friends / Solo).
2. **Route & nights** — the route spine: add/rename/reorder/remove stops, set nights per stop (stepper), toggle each connection's mode (flight ↔ ferry). Shows dated pills per stop (if a start date is set), a suggested fare pill per leg, and the **Route checks** panel (§8). This is the heart of the app.
3. **When** — a single **start date** input (drives everything date-related) + "dates flexible" toggle + a peak/shoulder-season callout.
4. **Style** — long-haul cabin (Economy / Premium economy / Business), accommodation tier (Comfortable 3★ / Premium 4★ / Luxury 5★), budget target (AUD).
5. **Estimate** — itemised cost (§6): **Flights & ferries** (per-person fares, editable), **Transfers** (door-to-door, editable), then accommodation/food/local/experiences, an indicative total range, and a budget verdict vs target.
6. **Your brief** — the generated planning prompt (§10): a Brief-style toggle (Agent / Classic), Copy / Export / Share buttons, a "what's changed since last brief" changelog card, and the brief in a textarea.

---

## 5. Data model

**Stop:** `{ id, name, nights, mode: "plane" | "ferry", note }`.

**Plan (metadata + data):**
```
{
  id, name, version:Int, updatedAt:ts,
  briefSnapshot: <data snapshot | undefined>, briefAt: ts,
  data: {
    travellers, party, vibe:[…], stops:[…],
    startDate:"YYYY-MM-DD", month:Int, flexible:Bool,
    cabin, tier, target:Int,
    legCosts:{ legKey: pp },          // per-leg fare overrides
    transfers:{ segKey:{ note, cost } } // per-segment transfer overrides
  }
}
```

- `version`, `briefSnapshot`, `briefAt` are **plan metadata** (not inside `data`) so auto-save preserves them.
- `month` is legacy; the **effective month** derives from `startDate` when set, else `month`.

**Seed:** on first run, create one plan named "Europe 2027" from the default state. Default route (`SEED_STOPS`): Canterbury (Reynolds Farm) 5 / French Riviera (Nice) 4 / Naples 2 / Ischia 5 *(ferry)* / Milos 3 / Mykonos 2 *(ferry)*; travellers 2, Couple, premium economy, comfortable, target 20000, startDate `2027-07-05`.

---

## 6. Cost model (exact)

Constants (AUD): `FLIGHT_PP=150`, `FERRY_PP=70`, `LONGHAUL_PP=1100`; cabin multipliers Economy `1.0` / Premium economy `1.75` / Business `3.6`; tier nightly Comfortable `270` / Premium `410` / Luxury `660`; peak months `{Jun, Jul, Aug, Dec}` → `season = 1.4` (else `1.0`).

**Fares** (one row per connection: long-haul out, each inter-stop hop, long-haul home):
- Long-haul leg pp `= round(1100 × cabinMult × season)`.
- Inter-stop hop pp `= round((mode==="ferry" ? 70 : 150) × season)`.
- Fare total for a leg `= effPP × travellers`, where `effPP` is the user override (`legCosts[key]`) if set, else suggested. Keys: `"out"`, each stop's `id` (its inbound leg), `"home"`.

**Transfers** — flat per segment (§7). **fares + transfers = "travel".**

**Other:** accommodation `= totalNights × tierNightly`; food `= travellers × 90 × totalNights`; local transport `= totalNights × 55`; experiences `= stops.length × 300`.

**Total** `= travel + accom + food + local + exp`; show an **indicative range** `low = total × 0.85`, `high = total × 1.2`. All figures are heuristics, not quotes — label them so.

---

## 7. Transfers — door-to-door chain

Generate the full ground chain in travel order (flat per-group costs, editable note + price per segment). For N stops there are **2N + 2** segments:

1. `Home → departure airport` — kind `home` ($70)
2. for each stop *i*: `Terminal → <stop>` (arrival) then `<stop> → terminal` (departure)
3. `Arrival airport → home` — kind `home` ($70)

Terminal type: arrival uses the arriving leg's mode (stop 0 = the long-haul flight = airport); departure uses the **next** leg's mode (last stop = flight home = airport). Cost by kind: `home 70`, `airport 60`, `port 40`. Segment keys: `t:origin`, `t:arr:<stopId>`, `t:dep:<stopId>`, `t:return` (stable across reorders). Overrides live in `data.transfers[key] = { note, cost }`; either field may be blank to fall back to the suggestion.

---

## 8. Route rules engine

`routeWarnings(stops, effMonth)` returns inline flags, shown on step 2 and injected into the brief:

- **Ferry seasonality:** any ferry leg with `effMonth` outside April–October (months 3–9) → warn that Med ferries thin out; confirm the route or keep a flight backup.
- **Island minimum nights:** name-matched rules — Milos ≥ 3 (Kleftiko boat day), Santorini ≥ 3, Amalfi/Positano ≥ 3.
- **Awkward connections:** consecutive stops matching a known-bad pair — Corsica↔Naples (no direct service; reroute via mainland), Milos↔Mykonos (different ferry lines; verify a same-day sailing).
- **Too-short ferry stop:** a ferry-reached stop with ≤ 1 night.

Show a green "all clear" when empty. Keep the rule tables (`MIN_NIGHTS`, `AWKWARD_LEGS`) easy to extend.

---

## 9. Saved plans system

- **Plans overlay** (full-screen) listing plan cards: name, `v{n}` badge, route summary, nights/stops, relative "updated" time, and actions — Open/Continue, New version, Rename, Share, Duplicate, Export, Delete. Plus New plan, Import, Export all.
- **Auto-save:** debounced (~400 ms) write of the active plan's `data` to `localStorage` whenever it changes; a "saved ✓" flash. Never bump `version` on auto-save.
- **Versioning:** manual — a "New version" action increments `plan.version`. Version shows on the card and header pill, and flows into export filename, share payload, and the brief header.
- **Export/Import:** download a plan as `{type:"wayfinder-plan", version:1, plan}` JSON (filename `<name>-v<n>.wayfinder.json`); "Export all" writes `{type:"wayfinder-plans", …, plans:[…]}`. Import accepts either, assigns fresh ids, opens the first.
- **Share link:** encode `{type:"wayfinder-plan", version:1, plan:{name, version, data}}` as URL-safe base64 into `location.hash` (`#plan=…`). Use `navigator.share` if present, else clipboard, with a toast. On load, if a `#plan=` hash is present, import it, open it, then clean the URL with `history.replaceState`.
- **Storage keys:** `wayfinder.plans.v1`, `wayfinder.active.v1`, `wayfinder.promptStyle`. Migrate plans on load to ensure a `version`.

---

## 10. Brief generator

`buildPrompt(...)` assembles a plain-text brief: an optional `PLAN: <name> (v<n>)` line, an optional `CHANGES SINCE MY LAST BRIEF` block, a **preamble**, then data sections `WHO / WHEN / ROUTE & NIGHTS / FLIGHTS & FERRIES / TRANSFERS — door to door / ROUTE CHECKS / STYLE & BUDGET`, then a **closer**.

- **Two preamble styles**, chosen by a persisted toggle (`promptStyle`, default `agent`):
  - **Agent** — expert trip-designer framing; verify facts with source + date; treat `~$` as placeholders; respect the CHANGES block as a revision; build in buffers; cover passports/visas/ETIAS/insurance; note contingencies and booking logistics; ends with a FINAL DELIVERABLE (dated itinerary + costs table + to-book/to-verify checklist). *(Use the current Agent brief text as the canonical wording.)*
  - **Classic** — the original concise "you're my travel planner" wording.
- **Changelog:** `diffPlans(baseline, current)` produces human-readable bullets (traveller/party/date/cabin/tier/budget changes; added/removed/renamed/reordered stops; night and mode changes; interests; fare/transfer edits). The baseline is `plan.briefSnapshot`, captured when the user **copies** the brief. Show a card on step 6 ("first brief" / "no changes" / a bulleted list) and prepend the same bullets to the brief.

---

## 11. Implementation gotchas

- **Declaration order (temporal dead zone):** in the component, declare `activePlan`, then `planData`, then `changes`, before the `prompt` memo that consumes them.
- **Number inputs:** clearing an override field should fall back to the suggested value; store raw override values so fields can be emptied.
- **Reorder-stable keys:** fare and transfer overrides key off stop `id`, not index.
- **No `localStorage` needed inside sandboxed preview environments** — this app targets a real static host, so `localStorage` is correct; just wrap it in try/catch.
- **Validate before shipping:** the code is JSX transpiled in-browser, so syntax-check the script (e.g. with esbuild) before publishing — a single typo blanks the page.

---

## 12. Acceptance checklist

- Builds a multi-stop route on a vertical spine; add/reorder/remove/rename stops; toggle flight/ferry per leg.
- Start date drives per-stop dated ranges, trip span, and peak detection.
- Estimate itemises fares (per person, editable), a full door-to-door transfer chain (editable), and the rest; shows a range and budget verdict.
- Route checks flag seasonality, island min-nights, awkward connections, short ferry stops.
- Save, name, version, duplicate, delete, export, import and share multiple plans; auto-save; reopen where left off.
- Final brief offers Agent/Classic wording, a changelog since last copy, and Copy/Export/Share.
- Runs as one static `index.html` on GitHub Pages, mobile-first.
