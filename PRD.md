# Product Requirements Document
## Weather Feels (working title)

---

## 1. Overview

Weather Feels is a mobile-first web app designed for iPhone users. It answers one simple question: **"How does today's weather compare to yesterday's?"** Rather than overwhelming the user with data, it shows a single human-friendly message and a background illustration that immediately communicates the vibe of the day.

---

## 2. Goals

- Give the user instant, intuitive weather context with zero friction
- Require no configuration beyond entering a zip code once
- Load fast and work well in iPhone Safari

---

## 3. Target User

Someone who wants a quick, low-effort answer to "is today warmer or cooler than yesterday?" without opening a full weather app.

---

## 4. User Stories

**US-1: Location Setup**
As a new user, I want to enter my zip code so I can see weather for my location.

**US-2: Location Memory**
As a returning user, I want my zip code to be remembered so I don't have to re-enter it on every visit.

**US-3: Temperature Comparison**
As a user, I want to see a simple message telling me whether today is warmer or cooler than yesterday.

**US-4: Rain Warning**
As a user, I want to know if rain is expected during the day so I can plan accordingly.

**US-5: Visual Weather Context**
As a user, I want the background to visually reflect today's weather so I can instantly grasp the conditions.

---

## 5. Functional Requirements

### FR-1: Location Entry
- The app displays a zip code input field
- Only US zip codes are supported
- The app does not validate zip codes before submitting; if the zip is unrecognized, the resulting API error is displayed as a human-readable message
- Submitting the form triggers weather data to be fetched for that location

### FR-2: Location Persistence
- When a zip code is used successfully, it is saved in the browser's `localStorage`
- On return visits, the saved zip code is pre-filled and weather data loads automatically

### FR-3: Day Determination
The app determines "Day N" (today) and "Day N-1" (yesterday) based on the sunrise and sunset times for the entered location. All time comparisons use the **timezone of the entered location**.

| Current time | Day N | Day N-1 |
|---|---|---|
| After sunrise, before sunset | Current calendar day | Previous calendar day |
| After sunset, or before sunrise | Next calendar day | Current calendar day |

### FR-4: Temperature Message
The app compares the **forecast high temperature** for Day N to Day N-1.

| Temperature Difference | Message Shown |
|---|---|
| Day N is 8°F or more warmer | "A lot warmer" |
| Day N is 4–7°F warmer | "Warmer" |
| Day N is 1–3°F warmer | "A little warmer" |
| No difference (0°F) | "About the same" |
| Day N is 1–3°F cooler | "A little cooler" |
| Day N is 4–7°F cooler | "Cooler" |
| Day N is 8°F or more cooler | "A lot cooler" |

Differences are calculated in whole degrees Fahrenheit after rounding both temperatures to the nearest integer.

### FR-5: Rain Alert
If the **predicted cumulative precipitation** for Day N between **8:00 AM and 8:00 PM** (in the location's timezone) exceeds **0.05 inches**, the message "Rain is expected." is appended to the temperature message.

Example combined output: *"Warmer. Rain is expected."*

### FR-6: Background Illustration
The background fills the full screen and reflects Day N's forecast. Backgrounds are SVG illustrations in a simple, childlike drawing style.

Background selection logic (applied in order):

1. **Rainy** — if predicted cumulative precipitation 8AM–8PM > 0.05 inches
2. **Sunny** — if average cloud cover from sunrise to sunset is below 30%
3. **Cloudy** — all other cases

### FR-7: Error Handling
- If any API call fails, the app displays a clear, human-readable error message
- Raw error codes, stack traces, or technical language are never shown to the user
- Specific messages are shown for: zip not found, network failure, service unavailability

### FR-8: Day Header
The weather display includes a contextual header above the main message:
- "Today will be:" — when Day N is the current calendar day (daytime)
- "Tomorrow will be:" — when Day N is the next calendar day (nighttime/pre-sunrise)

### FR-9: Temperature Detail
The weather display shows the raw high temperatures for both Day N-1 and Day N in small text below the main message. Labels are contextual:

| Time of day | Day N-1 label | Day N label |
|---|---|---|
| Daytime | "Yesterday" | "Today" |
| Nighttime / pre-sunrise | "Today" | "Tomorrow" |

Temperatures are displayed rounded to the nearest whole degree Fahrenheit.

### FR-10: State Demo Codes
The app accepts 6-digit numeric state demo codes as valid input in the zip code field. Each code forces the app directly into a specific visual and message combination, bypassing all API calls entirely. This enables testing of every possible app state without requiring real weather data or a network connection.

There are 21 valid codes, covering all combinations of 3 backgrounds × 7 temperature messages:

- Codes `200101`–`200107`: Sunny background, temperature messages A lot warmer through A lot cooler
- Codes `200201`–`200207`: Cloudy background, temperature messages A lot warmer through A lot cooler
- Codes `200301`–`200307`: Rainy background, temperature messages A lot warmer through A lot cooler (rain notice always shown)

When a state demo code is entered:
- `showWeather()` is called directly with predetermined values; no API calls are made
- The location pill displays "Demo"
- The header shows "Today will be:" (demo states always render as daytime)
- Nothing is saved to `localStorage`

The complete code listing is documented in `demo-codes.txt`.

---

## 6. Non-Functional Requirements

**NFR-1: Performance** — Page should render usable content within 3 seconds on a typical mobile connection.

**NFR-2: Browser Support** — Must work correctly in Safari on iOS (iPhone) and modern desktop browsers (Chrome, Safari, Firefox, Edge). Mobile is the primary design target; desktop is a co-equal priority for testing and use. The layout should look intentional and polished at both viewport sizes.

**NFR-3: No Backend** — All logic runs in the browser. No server-side code, no database.

**NFR-4: Cost** — All external APIs used must be free at the expected (personal) usage level.

---

## 7. Design Requirements

**DR-1: Layout** — Centered, full-viewport. The SVG background fills the entire screen. The weather message is displayed prominently over the background. The zip code input is always accessible. On desktop, the layout should feel deliberate — not just a stretched mobile view. The SVG backgrounds should scale gracefully to wide viewports.

**DR-2: Visual Style** — Custom design (not default iOS). Friendly, warm, approachable. Not clinical.

**DR-3: Illustrations** — Three SVG backgrounds in a simple, childlike drawing style (think crayon or finger-painting aesthetic):

- **Sunny**: Light blue sky, large yellow sun with simple radiating rays, green wavy hills at the bottom
- **Cloudy**: Light gray sky, 2–3 simple white/gray puffy clouds, hints of pale blue
- **Rainy**: Dark gray sky, dark storm clouds, diagonal blue rain streaks, small puddle shapes at the bottom

**DR-4: Typography** — Large, bold display text for the main message. Clean readable font for everything else.

---

## 8. Out of Scope (v1)

- International or non-US locations
- Zip code validation
- Multiple saved locations
- Extended forecasts (beyond next day)
- Hourly weather breakdown
- Push notifications
- Native iOS app
- Dark/light mode toggle
- Accessibility compliance (noted as a future consideration)
