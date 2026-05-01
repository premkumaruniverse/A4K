# 🚀 Ride Booking App — MVP Implementation Plan

> **Tech Stack:** React (Vite + PWA) · FastAPI · PostgreSQL · Mobile-First UI
> **Design Source:** [Figma Prototype](https://camel-swarm-06968238.figma.site)
> **Target:** Full-stack MVP in 4 weeks, mobile-first, India-focused

---

## 1. Design System (Extracted from Figma)

### Color Tokens
| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#2563EB` | Buttons, active nav, links |
| `--primary-light` | `#EFF6FF` | Page backgrounds, card headers |
| `--primary-dark` | `#1D4ED8` | Hover states |
| `--success` | `#10B981` | Seat available, booking success |
| `--warning-bg` | `#FEF9C3` | Info alerts (instructions box) |
| `--warning-text` | `#92400E` | Info alert text |
| `--text-primary` | `#1F2937` | Headings, primary text |
| `--text-secondary` | `#4B5563` | Labels, meta text |
| `--text-muted` | `#9CA3AF` | Placeholders |
| `--border` | `#E5E7EB` | Input borders, dividers |
| `--surface` | `#FFFFFF` | Cards, modal backgrounds |
| `--bg` | `#F9FAFB` | Page background |

### Typography
| Style | Size | Weight | Usage |
|---|---|---|---|
| `heading-xl` | 24px | 700 | Page titles |
| `heading-lg` | 20px | 600 | Card titles, section headers |
| `heading-md` | 16px | 600 | Sub-section titles |
| `body` | 14px | 400 | Body text |
| `caption` | 12px | 400 | Meta info, labels |
| `tag` | 11px | 500 | Amenity tags (uppercase) |

**Font:** Inter (Google Fonts)

### Key Components (from Figma)
- **RideCard** — white card, shadow-sm, rounded-xl, 2 rides visible (Mumbai→Pune, Dreamz Express)
- **FilterPill** — outlined pill-shaped tab (Price / Departure / Rating)
- **SeatGrid** — 2×N grid, colored by state (gray=booked, green=selected, white=available)
- **AmenityTag** — Icon + label chip (AC, WiFi, USB Charging, Water Bottle)
- **BottomNav** — Fixed, 3 tabs: Home / Bookings / Profile
- **PaymentMethodCard** — Radio-select card with icon; UPI pre-selected
- **ConfirmationCard** — Booking ID + success banner + yellow "Important Instructions" box

---

## 2. Screen Map (10 Screens)

```
1. Splash          → Auto-redirect after 2s
2. Login (OTP)     → /login
3. Home (Search)   → /home
4. Search Results  → /search-results
5. Ride Details    → /ride/:id
6. Seat Selection  → /ride/:id/seats  [Bus only]
7. Passenger Form  → /booking/passengers
8. Payment         → /booking/payment
9. Confirmation    → /booking/confirmation/:id
10. My Bookings    → /bookings
11. Profile        → /profile  [Bottom nav]
```

### Screen Details

#### Screen 1: Splash
- Full-screen gradient `#2563EB → #1D4ED8`
- App logo centered, tagline "Book your ride"
- 2s auto-redirect → Login (if no token) OR Home (if token present)

#### Screen 2: Login (OTP)
- Header: "Welcome Back" + subtitle
- Phone input with `+91` prefix flag
- "Send OTP" primary button
- OTP → 6-digit input (resend timer 30s)
- "Verify OTP" → redirects to Home
- No password, no social login

#### Screen 3: Home (Search)
- Top greeting: "Good morning, Rajesh 👋"
- Vehicle type selector: **Bus | Traveller | Cab | Auto** (pill tabs)
- Search card:
  - From input (map-pin icon, placeholder "Enter city")
  - Swap button (↕) between From/To
  - To input
  - Travel Date (calendar icon, date picker)
  - "Search Vehicles" — full-width blue button
- "Popular Routes" section — horizontally scrolling cards (Mumbai→Pune, etc.)

#### Screen 4: Search Results
- Header: "Mumbai → Pune · 20 Apr" with back arrow
- Filter pills: Price | Departure | Rating
- Ride cards (RideCard component):
  - Vehicle name + type badge (bus/cab/auto)
  - Operator name
  - Departure time + duration
  - Rating + reviews count
  - Seats available
  - Amenity tags (AC, WiFi, USB, Water)
  - Price (₹ per seat, right-aligned blue)
- Tap card → Ride Details

#### Screen 5: Ride Details
- Back arrow + "Bus Details" heading
- Operator info section (name, rating, reviews)
- Journey timeline: From → To with departure/arrival times + duration
- Amenities grid (2×2 icons)
- Customer reviews (top 2 static)
- CTA bottom bar:
  - Bus → "Select Seats" (primary button)
  - Cab/Auto → "Book Now" (primary button)

#### Screen 6: Seat Selection (Bus only)
- "Select Seats" heading + "2+1 Seater" chip
- Legend: Available (white) / Booked (gray) / Selected (green)
- Seat grid: rows A–F, columns 1–4 (2+aisle+2 layout)
- Bottom bar: "2 seats selected · ₹1700" + "Continue" button

#### Screen 7: Passenger Details
- Progress stepper: Seats → Passengers → Payment
- Per-passenger form (one per selected seat):
  - Full Name (text input)
  - Age (number input, min 1)
  - Gender (M / F / Other radio)
- "Continue to Payment" button

#### Screen 8: Payment
- "Payment" heading + back arrow
- Trip Summary card (scrollable):
  - From/To, Date, Time, Seats, Passengers
  - Base Fare / Taxes & Fees / **Total Amount** (blue)
- "Select Payment Method":
  - UPI (Google Pay, PhonePe, Paytm) — pre-selected radio
  - Credit/Debit Card (Visa, Mastercard, RuPay)
- "Pay ₹XXX" full-width button
- "By proceeding, you agree to our Terms & Conditions"

#### Screen 9: Booking Confirmation
- Green checkmark animation
- "Booking Confirmed!" heading
- Booking ID (large, copyable)
- Payment Summary: Total Paid + timestamp
- Yellow "Important Instructions" box (bullet list)
- Action buttons: Download Ticket | Share | View Bookings | Book Another Trip
- "Booking confirmation has been sent to your email" — green info strip

#### Screen 10: My Bookings
- Tab switcher: Upcoming | Completed | Cancelled
- Booking cards per tab:
  - Route + date + vehicle type
  - Status badge (color-coded)
  - Actions: View Details | Cancel (Upcoming only)
- Empty state: icon + "No bookings yet" + "Book a Trip" CTA

#### Screen 11: Profile
- Avatar + "Rajesh Kumar" + phone number
- Stats row: Total Trips / Cities Visited
- Menu items: Saved Addresses | Payment Methods | Help & Support | Privacy Policy | Logout
- Logout → clears token, redirect to Login

---

## 3. User Flow

```
[Splash]
   ↓ (2s)
[Login] → OTP → Verify
   ↓
[Home/Search]
   ↓ (fill from/to/date/type)
[Search Results]
   ↓ (tap ride card)
[Ride Details]
   ↓
   ├─ Bus → [Seat Selection] → [Passengers]
   └─ Cab/Auto → [Passengers]
                     ↓
                 [Payment]
                     ↓ (pay)
                 [Confirmation]
                     ↓
                 [My Bookings]
```

---

## 4. Frontend Architecture

### Project Structure
```
frontend/
├── public/
│   └── manifest.json            # PWA manifest
├── src/
│   ├── assets/                  # Icons, images
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── RideCard.jsx
│   │   ├── SeatGrid.jsx
│   │   ├── AmenityTag.jsx
│   │   ├── FilterPill.jsx
│   │   ├── PaymentMethodCard.jsx
│   │   └── BookingCard.jsx
│   ├── pages/
│   │   ├── Splash.jsx
│   │   ├── Login.jsx
│   │   ├── Home.jsx
│   │   ├── SearchResults.jsx
│   │   ├── RideDetails.jsx
│   │   ├── SeatSelection.jsx
│   │   ├── PassengerDetails.jsx
│   │   ├── Payment.jsx
│   │   ├── Confirmation.jsx
│   │   ├── MyBookings.jsx
│   │   └── Profile.jsx
│   ├── hooks/
│   │   ├── useAuth.js           # OTP flow, token storage
│   │   ├── useBooking.js        # Multi-step booking state
│   │   └── useRides.js          # Ride search/fetch
│   ├── store/
│   │   └── bookingStore.js      # Zustand: booking session state
│   ├── services/
│   │   └── api.js               # Axios instance + all API calls
│   ├── styles/
│   │   ├── globals.css          # CSS variables + reset
│   │   └── components.css       # Shared component styles
│   ├── utils/
│   │   └── helpers.js           # formatCurrency, formatDate, etc.
│   ├── App.jsx                  # Route definitions
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

### State Management
- **Zustand** for booking flow state (shared across 4 screens)
- **React Query** for data fetching (search results, ride details, bookings)
- **localStorage** for auth token (JWT)

### Key Libraries
| Library | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| React Router DOM | 6.x | Client-side routing |
| Zustand | 4.x | Global state management |
| React Query | 5.x | Server state + caching |
| Axios | 1.x | HTTP client |
| Lucide React | latest | Icon set (matches Figma style) |
| date-fns | 3.x | Date formatting |
| react-hot-toast | 2.x | Toast notifications |
| Vite | 5.x | Build tool + dev server |

---

## 5. Backend Architecture

### Project Structure
```
backend/
├── app/
│   ├── main.py                  # FastAPI app + CORS + router includes
│   ├── config.py                # Settings (DB URL, JWT secret, env)
│   ├── database.py              # SQLAlchemy engine + session factory
│   ├── models/
│   │   ├── user.py
│   │   ├── ride.py
│   │   ├── seat.py
│   │   └── booking.py
│   ├── schemas/
│   │   ├── auth.py              # OTP request/response schemas
│   │   ├── ride.py              # Ride list/detail schemas
│   │   ├── booking.py           # Booking create/response schemas
│   │   └── payment.py           # Payment init/verify schemas
│   ├── routers/
│   │   ├── auth.py              # /auth routes
│   │   ├── rides.py             # /rides routes
│   │   ├── bookings.py          # /bookings routes
│   │   └── payment.py           # /payment routes
│   ├── services/
│   │   ├── otp_service.py       # OTP generation + verification (mock)
│   │   ├── ride_service.py      # Business logic for ride search
│   │   └── payment_service.py   # Mock payment processing
│   └── utils/
│       ├── auth.py              # JWT create/decode
│       └── dependencies.py      # get_current_user dependency
├── alembic/                     # DB migrations
│   └── versions/
├── alembic.ini
├── requirements.txt
├── .env
└── Dockerfile
```

### API Specification

#### Auth Routes (`/api/v1/auth`)
```
POST /send-otp
  Body: { phone: "9876543210" }
  Response: { message: "OTP sent", expires_in: 300 }

POST /verify-otp
  Body: { phone: "9876543210", otp: "123456" }
  Response: { access_token: "jwt...", token_type: "bearer", user: {...} }
```

#### Ride Routes (`/api/v1/rides`)
```
GET /rides?from=Mumbai&to=Pune&date=2026-04-20&type=bus
  Response: [ RideSchema, ... ]

GET /rides/{ride_id}
  Response: RideDetailSchema (includes seats for bus)
```

#### Booking Routes (`/api/v1/bookings`)
```
POST /bookings
  Auth: Bearer token required
  Body: { ride_id, seat_ids: [], passengers: [{name, age, gender}], payment_method }
  Response: BookingSchema

GET /bookings/{booking_id}
  Auth: Bearer token required
  Response: BookingDetailSchema

GET /bookings/me
  Auth: Bearer token required
  Response: [ BookingSchema, ... ]  // paginated

PATCH /bookings/{booking_id}/cancel
  Auth: Bearer token required
  Response: { message: "Booking cancelled" }
```

#### Payment Routes (`/api/v1/payment`)
```
POST /payment/init
  Auth: Bearer token required
  Body: { booking_id, payment_method }
  Response: { payment_id, amount, status: "pending" }

POST /payment/verify
  Auth: Bearer token required
  Body: { payment_id, booking_id }
  Response: { status: "success", booking_id, transaction_id }
```

---

## 6. Database Schema

```sql
-- Users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       VARCHAR(15) UNIQUE NOT NULL,
    name        VARCHAR(100),
    email       VARCHAR(150),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- OTP Store (ephemeral)
CREATE TABLE otp_store (
    phone       VARCHAR(15) PRIMARY KEY,
    otp         VARCHAR(6) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    attempts    INT DEFAULT 0
);

-- Rides
CREATE TABLE rides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(10) NOT NULL,  -- bus/cab/auto
    operator_name   VARCHAR(100),
    from_city       VARCHAR(100) NOT NULL,
    to_city         VARCHAR(100) NOT NULL,
    departure_time  TIMESTAMP NOT NULL,
    arrival_time    TIMESTAMP NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    rating          DECIMAL(3,2),
    total_reviews   INT DEFAULT 0,
    amenities       JSONB DEFAULT '[]',    -- ["AC","WiFi","USB"]
    is_active       BOOLEAN DEFAULT TRUE
);

-- Seats (Bus only)
CREATE TABLE seats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID REFERENCES rides(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,       -- "1A", "2C"
    seat_type   VARCHAR(20) DEFAULT 'seater', -- seater/sleeper/lower/upper
    status      VARCHAR(10) DEFAULT 'available', -- available/booked/blocked
    UNIQUE(ride_id, seat_number)
);

-- Bookings
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    ride_id         UUID REFERENCES rides(id),
    seat_ids        UUID[] DEFAULT '{}',   -- array of seat IDs (bus only)
    total_price     DECIMAL(10,2) NOT NULL,
    base_fare       DECIMAL(10,2) NOT NULL,
    taxes           DECIMAL(10,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/cancelled/completed
    payment_status  VARCHAR(20) DEFAULT 'pending',
    payment_method  VARCHAR(30),           -- UPI/card
    transaction_id  VARCHAR(100),
    booked_at       TIMESTAMP DEFAULT NOW(),
    cancelled_at    TIMESTAMP
);

-- Passengers
CREATE TABLE passengers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    age         INT NOT NULL,
    gender      VARCHAR(10) NOT NULL       -- male/female/other
);

-- Indexes
CREATE INDEX idx_rides_from_to_date ON rides(from_city, to_city, departure_time);
CREATE INDEX idx_rides_type ON rides(type);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_seats_ride ON seats(ride_id, status);
```

---

## 7. Project Structure (Monorepo)

```
RideBookingApp/
├── frontend/            # React + Vite (PWA)
├── backend/             # FastAPI + PostgreSQL
├── docker-compose.yml   # Local dev orchestration
├── .env.example
└── README.md
```

### docker-compose.yml Services
- `db`: PostgreSQL 15
- `backend`: FastAPI on port 8000
- `frontend`: Vite dev on port 5173

---

## 8. Implementation Phases

### Phase 1 — Week 1: Foundation + Auth
**Backend:**
- [ ] FastAPI project setup with folder structure
- [ ] PostgreSQL + Alembic migrations
- [ ] User model + OTP model
- [ ] `POST /auth/send-otp` (mock SMS, log OTP to console)
- [ ] `POST /auth/verify-otp` (JWT response)
- [ ] JWT middleware + `get_current_user` dependency
- [ ] Seed script: 10 sample rides + bus seats

**Frontend:**
- [ ] Vite + React project init with PWA config
- [ ] CSS design system (all variables from Figma)
- [ ] Splash, Login, OTP screens
- [ ] Auth flow (send OTP, verify, store JWT)
- [ ] Protected route wrapper
- [ ] Home (Search) screen — static UI

---

### Phase 2 — Week 2: Search + Listing + Details
**Backend:**
- [ ] Ride model + Seat model
- [ ] `GET /rides` with from/to/date/type filters
- [ ] `GET /rides/:id` with seats (bus only)

**Frontend:**
- [ ] Search form with date picker (react-day-picker)
- [ ] Search Results page — ride cards from API
- [ ] Filter pills (client-side sort: price/departure/rating)
- [ ] Ride Details page — full detail view
- [ ] RideCard, AmenityTag, FilterPill components

---

### Phase 3 — Week 3: Booking Flow
**Backend:**
- [ ] Booking + Passenger models
- [ ] `POST /bookings` — seat lock + booking create
- [ ] `GET /bookings/me` — user's bookings
- [ ] `GET /bookings/:id` — booking detail
- [ ] `PATCH /bookings/:id/cancel` — cancel booking
- [ ] Seat status update on booking

**Frontend:**
- [ ] Seat Selection grid (SeatGrid component)
- [ ] Zustand booking store (ride → seats → passengers → payment)
- [ ] Passenger form (per seat/passenger)
- [ ] My Bookings page (3 tabs)
- [ ] Profile page (static + logout)

---

### Phase 4 — Week 4: Payment + Polish
**Backend:**
- [ ] Mock payment endpoints (`/payment/init`, `/payment/verify`)
- [ ] Booking status → `confirmed` on payment success
- [ ] Seat status → `booked` on payment success

**Frontend:**
- [ ] Payment page (UPI + Card UI)
- [ ] Mock payment flow (2-step: init → verify)
- [ ] Confirmation page (success animation + booking ID)
- [ ] Download ticket (basic print-friendly view or PDF via jsPDF)
- [ ] Toast notifications, error states, loading states
- [ ] Mobile responsive polish
- [ ] PWA manifest + service worker
- [ ] README.md + setup docs

---

## 9. Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@db:5432/rideapp
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE_MINUTES=10080
OTP_EXPIRE_SECONDS=300
CORS_ORIGINS=http://localhost:5173
DEBUG=true
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 10. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend framework | React (Vite) PWA | Fastest to build, browser-based, no app store needed |
| Backend | FastAPI | Async, auto-docs (Swagger), Python ecosystem |
| DB ORM | SQLAlchemy + Alembic | Type-safe, migration support |
| Auth | JWT (no sessions) | Stateless, easy to scale |
| OTP delivery | Console log (MVP) | No SMS cost, swap with Twilio/MSG91 later |
| Payment | Mock (MVP) | Razorpay integration in Phase 2 |
| State | Zustand | Minimal boilerplate vs Redux |
| Icons | Lucide React | Matches Figma icon style exactly |
| Styling | Vanilla CSS + CSS vars | No framework bloat, precise design control |

---

## 11. Seed Data Plan

### Rides (10 records)
| type | from | to | time | price | operator |
|---|---|---|---|---|---|
| bus | Mumbai | Pune | 06:00 AM | ₹850 | Dreamz Express |
| bus | Mumbai | Pune | 10:00 PM | ₹750 | SRS Travels |
| bus | Delhi | Agra | 07:00 AM | ₹400 | RedBus Express |
| cab | Mumbai | Pune | On demand | ₹2200 | QuickCab |
| auto | Mumbai | Bandra | On demand | ₹120 | AutoGo |
| ... | ... | ... | ... | ... | ... |

### Seats (for each bus ride)
- Format: rows 1–8, columns A/B (window/aisle left) + C/D (aisle/window right)
- Random 30% seats pre-booked as seed

---

## 12. Verification Plan

### Automated
- FastAPI `/docs` Swagger UI for all API endpoint testing
- React dev server for UI review at `localhost:5173`

### Manual Screen-by-Screen
1. **Splash** → auto-redirect works (2s)
2. **Login** → OTP appears in backend console, 6-digit input, verify → token stored
3. **Home** → all 4 vehicle types selectable, search button active
4. **Search Results** → cards load, filter pills sort correctly
5. **Ride Details** → amenities, timeline, reviews visible
6. **Seat Selection** → tap to select/deselect, bottom bar updates count + price
7. **Passenger Form** → validates required fields, continues
8. **Payment** → UPI pre-selected, Pay button shows correct total
9. **Confirmation** → booking ID displayed, "View Bookings" navigates correctly
10. **My Bookings** → 3 tabs work, cancelled booking appears in Cancelled tab
11. **Profile** → logout clears token, redirects to Login

---

## 13. Out of Scope (MVP)

- Live ride tracking / GPS
- Driver-facing app
- Admin dashboard
- Real SMS OTP (replace console log with Twilio/MSG91)
- Real payment gateway (replace mock with Razorpay)
- Push notifications
- Multi-language (Hindi support)
- Rating & review submission
- Offers / promo codes
