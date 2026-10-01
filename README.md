# Mini Lab Aggregator

Search for a diagnostic test by **name** and **pincode**, and get every lab test and health package that can be booked there, ranked by the **true final price** a patient actually pays.

## Project Overview

Lab websites advertise an "offer price", but home collection often adds a fee, and the cheapest test may only be available inside a bigger package. This app removes that guesswork:

1. The user enters a test name and a 6-digit pincode.
2. The API keeps only providers serving that pincode.
3. It matches standalone tests **and** packages whose `included_tests` contain the test.
4. It calculates `total_final_price = offer_price + home_collection_fee`.
5. Results are sorted from cheapest to most expensive final price and shown as cards.

## Features

- Pincode-based lab filtering
- Case- and whitespace-insensitive test search (`"  LiPiD   PrOfIlE "` works)
- Package matching through `included_tests` (searching *Lipid Profile* also returns the cardiac and diabetic packages)
- Final price calculation (offer price + collection fee), shown as a clear price breakdown
- Ascending sort by final price, with the cheapest result flagged
- NABL badge, shown only for accredited labs
- Home collection information (available / free / fee / lab visit only)
- Report turnaround time in readable form ("Report in 24 hours")
- Loading skeletons, empty state, error state with retry
- Responsive layout (desktop, tablet, mobile) and basic accessibility (labels, focus states, `aria-live` results, keyboard submit)

## Tech Stack

| Choice | Why |
| --- | --- |
| **React** | Small, reusable components (form, card, states) and simple local state; no state library needed. |
| **Vite** | Near-instant dev server and builds with almost no configuration. |
| **Node.js + Express** | Minimal, well-understood REST layer; easy to read in an interview. |
| **JSON file as database** | The brief forbids an external DB. The file is loaded once at startup and never mutated. The service layer is the only code that touches it, so swapping in a real database later changes one file. |
| **`node:test`** | Built-in test runner, so there are no extra test dependencies. |

## Architecture

```
Frontend (React)  →  REST API (Express)  →  Service layer  →  JSON data
  components/          routes/ + middleware/     services/         data/labs.json
  services/api.js      (validation, errors)      searchService.js
```

```
mini-lab-aggregator/
├── backend/
│   ├── data/labs.json               mock database (provided dataset, unchanged)
│   ├── src/
│   │   ├── routes/                  URL → controller wiring
│   │   ├── middleware/              input validation, error handling
│   │   ├── controllers/             HTTP concerns only (status codes, response shape)
│   │   ├── services/searchService.js  ALL business logic (filter, match, price, sort)
│   │   ├── utils/                   text normalisation, ApiError
│   │   └── app.js                   Express app factory (CORS, routes)
│   ├── tests/                       unit tests (service) + API tests (HTTP)
│   └── server.js                    entry point
└── frontend/
    ├── src/
    │   ├── components/              SearchForm, SearchResults, ResultCard, Loading/Empty/ErrorState
    │   ├── services/api.js          the only place that calls the backend
    │   ├── utils/                   price/hour formatting, input validation
    │   └── styles/                  design tokens, base, component styles
    └── tests/                       formatting + validation tests
```

Business logic lives in `searchService.js`, separate from routes, so it can be tested without HTTP.

## Setup

Requires Node.js 18+ (developed on Node 22).

**Backend** (terminal 1)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Frontend** (terminal 2)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**. The API runs on **http://localhost:5000**.

**Optional: one command for both** (from the repo root)

```bash
npm run install:all
npm run dev
```

The two-terminal commands above are the reliable fallback.

**Tests and build**

```bash
npm test            # from the root: backend + frontend tests
npm run build       # production build of the frontend into frontend/dist
```

## Environment Variables

| File | Variable | Default | Purpose |
| --- | --- | --- | --- |
| `backend/.env` | `PORT` | `5000` | Port the API listens on. |
| `backend/.env` | `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated origins allowed to call the API. Set this to your deployed frontend URL in production. |
| `frontend/.env` | `VITE_API_BASE_URL` | `http://localhost:5000` | Backend base URL, no trailing slash. |

`.env` files are git-ignored; only `.env.example` is committed. There are no secrets in this project.

## API Documentation

### `GET /api/search`

| Param | Rules |
| --- | --- |
| `search_query` | Required, trimmed, 1–100 characters. |
| `pincode` | Required, exactly 6 digits. |

**Request**

```http
GET /api/search?search_query=Lipid%20Profile&pincode=110001
```

**Response `200`** (abridged to two of the four results)

```json
{
  "success": true,
  "query": { "search_query": "Lipid Profile", "pincode": "110001" },
  "count": 4,
  "results": [
    {
      "id": "102",
      "provider_name": "Local City Lab",
      "item_type": "test",
      "item_name": "Lipid Profile",
      "included_tests": ["Lipid Profile"],
      "pricing": { "mrp": 600, "offer_price": 450 },
      "logistics": { "home_collection": false, "home_collection_fee": 0, "report_tat_hours": 12 },
      "nabl_accredited": false,
      "match_type": "direct",
      "total_final_price": 450
    },
    {
      "id": "101",
      "provider_name": "Apollo Diagnostics",
      "item_type": "test",
      "item_name": "Lipid Profile",
      "included_tests": ["Lipid Profile"],
      "pricing": { "mrp": 1000, "offer_price": 800 },
      "logistics": { "home_collection": true, "home_collection_fee": 100, "report_tat_hours": 24 },
      "nabl_accredited": true,
      "match_type": "direct",
      "total_final_price": 900
    }
  ]
}
```

`match_type` is `"direct"` when the item itself matches the query and `"included"` when the test is found inside a package. It is an addition to the required fields.

**Errors** all share one shape and never include stack traces:

```json
{ "success": false, "error": { "code": "INVALID_PINCODE", "message": "Please enter a valid 6-digit pincode." } }
```

| Status | `error.code` | When |
| --- | --- | --- |
| 400 | `INVALID_SEARCH_QUERY` | Missing, blank, repeated, or over-long `search_query`. |
| 400 | `INVALID_PINCODE` | Missing, non-numeric, or not exactly 6 digits. |
| 404 | `NO_RESULTS` | Valid request, but nothing matches in that pincode. |
| 404 | `ROUTE_NOT_FOUND` | Unknown route. |
| 500 | `INTERNAL_ERROR` | Unexpected failure (details are logged server-side only). |

A `GET /api/health` endpoint returns `{ "success": true, "status": "ok" }`.

## Business Logic

```
Pincode filter  +  Standalone test matching  +  Package included_tests matching
   +  Final price calculation  +  Ascending price sort
```

1. **Pincode filter.** An item is eligible only if `available_pincodes.includes(pincode)`.
2. **Normalisation.** Query and data are trimmed, whitespace-collapsed and lowercased before comparing.
3. **Standalone matching.** The query is matched against `item_name`.
4. **Package matching.** The query is also matched against every entry in `included_tests`, so a package appears whenever it contains the searched test. The logic never relies on `item_name` alone.
5. **Final price.** `total_final_price = offer_price + home_collection_fee`. The fee counts only when `home_collection` is true.
6. **Sort.** Ascending by `total_final_price`, never by MRP, offer price, name or turnaround time. Exact ties fall back to provider name so ordering is deterministic.

Worked example for `Lipid Profile` in `110001`:

| Provider | Offer | Collection fee | **Final** |
| --- | --- | --- | --- |
| Local City Lab | ₹450 | ₹0 (no home collection) | **₹450** |
| Apollo Diagnostics | ₹800 | ₹100 | **₹900** |
| Lal PathLabs (package) | ₹1,500 | ₹150 | **₹1,650** |
| Tata 1mg (package) | ₹1,999 | ₹0 (free) | **₹1,999** |

**Design decisions worth knowing**

- **Matching is substring-based**, so `lipid` finds `Lipid Profile` and `MRI` finds `MRI Brain`. This was chosen over exact equality because it is friendlier for real users, and still simple. Fuzzy/typo matching is deliberately out of scope.
- **Empty results return `404 NO_RESULTS`** using the standard error shape, as the brief specifies a 404 for "no matching results". The frontend treats it as a normal empty state rather than an error. The service itself returns a plain empty array, which is what the unit test asserts.
- **Dev-server note:** `npm audit` flags an advisory in Vite 5's bundled esbuild that only affects the local dev server, not the production build. The fix requires a major Vite upgrade, so it was left unchanged.

## Thinking Question

**How would you architect a scraper for live competitor prices when large companies attempt to block automated traffic?**

I would treat it as a reliability and compliance problem rather than an arms race: first check whether the competitor offers an official API, affiliate feed or data-sharing agreement, and read their terms and robots.txt so the crawler only collects what it is permitted to. Architecturally, a scheduler pushes jobs onto a queue; worker processes fetch pages at a polite, per-domain rate limit, retry transient failures with exponential backoff and jitter, and back off automatically when they see 429/403 responses instead of escalating. Results are cached with sensible TTLs (prices rarely change minute to minute) so the same page is not re-fetched unnecessarily, and each parsed price is validated and timestamped, with the last known good value served, clearly marked as stale, when a fetch fails. Where appropriate and permitted, traffic can be spread across a small pool of egress IPs or a managed proxy provider for capacity and resilience, but the goal is lower load and stable operation, not disguising the crawler. Finally, I would monitor success rate, latency, block rate and parser breakage per source with alerts, so layout changes or blocking are noticed and handled (by slowing down, changing approach, or dropping the source) rather than silently producing wrong prices.
