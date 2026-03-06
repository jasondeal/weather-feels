# Development Todo
## Weather Feels

Each phase ends with a git commit. This is intentional — it builds good habits and gives you safe checkpoints to roll back to if something breaks.

---

## Phase 0: Git & Environment Setup

- [ ] Create a GitHub account at github.com (if you don't have one already)
- [ ] Install git: download from https://git-scm.com/downloads and run the installer
- [ ] Open a terminal (Mac: Terminal app, Windows: Git Bash) and configure git:
  ```
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```
- [ ] Create a new repository on GitHub:
  - Go to github.com → click the "+" → "New repository"
  - Name it `weather-feels`
  - Set it to Public
  - Do NOT add a README (we'll create files ourselves)
  - Click "Create repository"
- [ ] Clone the empty repo to your computer (GitHub will show you the command, it looks like):
  ```
  git clone https://github.com/YOUR-USERNAME/weather-feels.git
  cd weather-feels
  ```
- [ ] Create the starting file structure (empty files are fine for now):
  - `index.html`
  - `style.css`
  - `app.js`
  - `README.md` (write one line: "# Weather Feels")
  - `sunny.svg`
  - `cloudy.svg`
  - `rainy.svg`
  - `demo-codes.txt` (already complete — copy from the Weather Feels folder; documents all 21 app state codes)
- [ ] Make your first commit and push:
  ```
  git add .
  git commit -m "Initial project structure"
  git push origin main
  ```
- [ ] Verify: refresh your GitHub repo page — you should see the files there

---

## Phase 1: HTML Structure

- [ ] Open `index.html` and add the full HTML shell:
  - `<!DOCTYPE html>` and `<html lang="en">`
  - `<head>` with:
    - `<meta charset="UTF-8">`
    - `<meta name="viewport" content="width=device-width, initial-scale=1.0">` (critical for iPhone)
    - `<title>Weather Feels</title>`
    - Link to `style.css`
  - `<body>` with:
    - A `<div id="app">` wrapper
    - Inside: a zip code `<form>` with an `<input type="text">` and a `<button>`
    - A `<div id="weather-display">` (hidden by default) for the main message
    - A `<div id="loading">` (hidden by default) with text like "Loading..."
    - A `<div id="error-display">` (hidden by default) for error messages
  - Script tag linking `app.js` at the bottom of `<body>`
- [ ] Open `index.html` in a browser — it should show the zip code input (unstyled is fine)
- [ ] **Commit**: `git commit -m "Add HTML structure"`

---

## Phase 2: SVG Backgrounds

Work through each SVG one at a time. Open each file in a browser after creating it to verify it looks right.

- [ ] Create `sunny.svg`:
  - ViewBox: `0 0 800 600` (landscape — scales gracefully on mobile and desktop with background-size: cover)
  - Light blue sky rectangle covering full viewBox (`#87CEEB`)
  - Large yellow circle for the sun in the upper-right (`#FFD700`, radius ~68)
  - 8 lines radiating from the sun center as rays (stroke `#FFD700`, strokeWidth ~11)
  - Wavy green ground shape at the bottom (~bottom 20%) using a `<path>` (`#5D8A2C`)
  - One simple white cloud on the left made of overlapping circles

- [ ] Create `cloudy.svg`:
  - ViewBox: `0 0 800 600`
  - Light gray sky rectangle (`#C4C4C4`)
  - 3 simple cloud shapes across the upper half (overlapping circles, fill `#EDEDED` or `#E8E8E8`)
  - Same wavy ground shape at the bottom (`#6B9A3E`)

- [ ] Create `rainy.svg`:
  - ViewBox: `0 0 800 600`
  - Dark gray-blue sky rectangle (`#5C6B7A`)
  - 2–3 large dark cloud shapes in the upper third (fill `#3D4F5C`)
  - ~18–21 short diagonal rain lines across the middle (stroke `#89CFF0`, strokeWidth 3)
  - 3 small flat ellipses at the bottom as puddles (fill `#89CFF0`)

- [ ] Open each SVG in a browser and verify they look like simple, childlike illustrations
- [ ] **Commit**: `git commit -m "Add SVG background illustrations"`

---

## Phase 3: CSS Styling

- [ ] Add CSS reset at the top of `style.css`:
  ```css
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ```
- [ ] Make the app fill the full viewport:
  - `html, body` → `height: 100%`, `overflow: hidden`
  - `#app` → `width: 100%`, `height: 100%`, `position: relative`
- [ ] Background SVG:
  - Apply via `background-image`, `background-size: cover`, `background-position: center`
  - Default to sunny background on load
- [ ] Weather message:
  - Centered horizontally and vertically (use flexbox or absolute positioning)
  - Large, bold font (aim for 36–48px for main message)
  - White or dark text with enough contrast — add a text shadow or semi-transparent backdrop if needed
- [ ] Zip code form:
  - Positioned at the top or bottom of the screen
  - Styled input and button — clean, not default browser look
  - High enough contrast to read over any background
- [ ] Loading and error states:
  - Centered, clearly readable
  - Error text in a color that communicates something went wrong (e.g., warm red or orange)
- [ ] Check layout at iPhone viewport size (Chrome DevTools → Toggle Device Toolbar → iPhone 12/13/14)
- [ ] Check layout at full desktop width (1280px+) — should look intentional, not stretched
- [ ] **Commit**: `git commit -m "Add CSS styles"`

---

## Phase 4: Location API (Zippopotam.us)

- [ ] In `app.js`, write `fetchLocation(zip)`:
  - Fetches `https://api.zippopotam.us/us/${zip}`
  - If response is not OK (e.g., 404), throw an error with the message: "We couldn't find that zip code. Please try a different one."
  - Parses the response JSON
  - Returns `{ lat, lng }` as numbers (not strings — Zippopotam returns them as strings)
- [ ] Test in browser console:
  - `fetchLocation('10001')` → should return `{ lat: 40.7484, lng: -73.9967 }` (approximate)
  - `fetchLocation('99999')` → should throw an error
- [ ] **Commit**: `git commit -m "Add location geocoding (Zippopotam)"`

---

## Phase 5: Weather API (Open-Meteo)

- [ ] In `app.js`, write `fetchWeather(lat, lng)`:
  - Builds the Open-Meteo URL with all required parameters (see TECHNICAL.md Section 2b)
  - Fetches the URL
  - If response is not OK, throw a service unavailable error
  - Returns the full parsed JSON response (no filtering yet — that happens in later steps)
- [ ] Test in browser console:
  - `fetchWeather(40.7484, -73.9967)` → log the result
  - Verify `response.timezone` is a valid IANA string (e.g., `"America/New_York"`)
  - Verify `response.daily.time` has 4+ dates starting with yesterday
  - Verify `response.hourly.precipitation` and `response.hourly.cloudcover` arrays exist
- [ ] **Commit**: `git commit -m "Add weather API integration (Open-Meteo)"`

---

## Phase 6: Core Logic

Write and test each function in isolation before wiring them together. Use the browser console for testing.

- [ ] `getTodayString(timezone)`:
  - Returns today's date as `"YYYY-MM-DD"` in the given timezone
  - Test: `getTodayString('America/New_York')` → should return today's date

- [ ] `getCurrentMinutesInTZ(timezone)`:
  - Returns current time as minutes since midnight in the given timezone
  - Test: run at 9:30 AM local time in a US timezone → should return ~570

- [ ] `parseTimeToMinutes(dateTimeStr)`:
  - Input: `"2024-01-15T07:20"` → output: `440` (7×60 + 20)

- [ ] `determineDay(daily, timezone)`:
  - Returns `{ nIndex, n1Index, isDaytime }` based on current time vs sunrise/sunset
  - Test: run in the middle of the day → `nIndex` should be 1 (today's index), `isDaytime` should be `true`
  - Test: manually change your system clock to after sunset → `nIndex` should be 2 (tomorrow's index), `isDaytime` should be `false`

- [ ] `getTempMessage(tempN, tempN1)`:
  - Test all 7 branches:
    - `getTempMessage(75, 65)` → "A lot warmer"
    - `getTempMessage(73, 68)` → "Warmer"
    - `getTempMessage(70, 68)` → "A little warmer"
    - `getTempMessage(68, 68)` → "About the same"
    - `getTempMessage(66, 68)` → "A little cooler"
    - `getTempMessage(63, 68)` → "Cooler"
    - `getTempMessage(58, 68)` → "A lot cooler"

- [ ] `getRainExpected(hourly, dayN_date)`:
  - Sums precipitation for hours 8–19 on the given date
  - Returns `true` if total > 0.05 inches
  - Test with mock data (manually construct an hourly object with known precip values)

- [ ] `getBackground(hourly, daily, timezone, nIndex)`:
  - Returns `'rainy'`, `'cloudy'`, or `'sunny'`
  - Test: mock data with heavy rain → should return `'rainy'`
  - Test: mock data with no rain and low cloud cover → should return `'sunny'`
  - Test: mock data with no rain and high cloud cover → should return `'cloudy'`

- [ ] `composeMessage(tempMessage, rainExpected)`:
  - `composeMessage("Warmer", true)` → `"Warmer. Rain is expected."`
  - `composeMessage("Cooler", false)` → `"Cooler"`

- [ ] **Commit**: `git commit -m "Add core weather logic"`

---

## Phase 7: localStorage

- [ ] Write `saveZip(zip)`:
  - `localStorage.setItem('weatherFeels_zip', zip)`

- [ ] Write `loadZip()`:
  - `localStorage.getItem('weatherFeels_zip')` → returns the zip string or `null`

- [ ] On page load: call `loadZip()`. If a zip is found, pre-fill the input field and automatically trigger weather loading.

- [ ] On successful weather data load: call `saveZip(zip)` with the zip that was just used.

- [ ] Test:
  - Enter a zip → load weather → close tab → reopen → zip should be pre-filled and data should auto-load
  - Clear localStorage in browser DevTools → reload → should show empty input

- [ ] **Commit**: `git commit -m "Add zip code persistence"`

---

## Phase 8: Render Layer

- [ ] Write `showLoading()`:
  - Hides `#weather-display` and `#error-display`
  - Shows `#loading`

- [ ] Write `showError(message)`:
  - Hides `#loading` and `#weather-display`
  - Shows `#error-display` with the given message text

- [ ] Write `showWeather({ tempMessage, rainExpected, background, locationName, isDaytime, tempN, tempN1 })`:
  - Hides `#loading` and `#error-display`
  - Sets `#day-header` to "Today will be:" or "Tomorrow will be:" based on `isDaytime`
  - Sets the main message text in `#weather-message`
  - Sets rain line in `#rain-message` (empty string if no rain)
  - Populates `#temp-n1-label` / `#temp-n1-value` / `#temp-n-label` / `#temp-n-value` with contextual labels and rounded temperatures
  - Calls `setBackground(background)`
  - Shows `#weather-display`

- [ ] Write `setBackground(type)`:
  - Sets the CSS `background-image` on `#app` to `url('sunny.svg')`, `url('cloudy.svg')`, or `url('rainy.svg')` based on type

- [ ] Write the main `loadWeather(zip)` function that orchestrates the full flow:
  1. `showLoading()`
  2. `fetchLocation(zip)` → get lat/lng
  3. `fetchWeather(lat, lng)` → get weather data
  4. `determineDay(daily, timezone)` → get nIndex, n1Index
  5. Get `tempN` and `tempN1` from `daily.temperature_2m_max`
  6. `getTempMessage(tempN, tempN1)`
  7. `getRainExpected(hourly, dayN_date)`
  8. `composeMessage(tempMessage, rainExpected)`
  9. `getBackground(hourly, daily, timezone, nIndex)`
  10. `showWeather(finalMessage, background)`

- [ ] Wire up the zip code form submit event:
  - If input matches a 6-digit state demo code in `STATE_CODES`, call `showWeather()` directly with the preset values and return early (no API calls, nothing saved to localStorage)
  - Otherwise call `loadWeather(zip)`

- [ ] Wire up page load: if `loadZip()` returns a zip, call `loadWeather(zip)` automatically

- [ ] **Commit**: `git commit -m "Wire up full data flow and render layer"`

---

## Phase 9: Error Handling

- [ ] Wrap the entire body of `loadWeather()` in a try/catch
- [ ] In the catch block, call `showError()` with appropriate message based on error type:
  - Check `error.message` to decide which message to show
  - Fall back to "Something went wrong. Please try again." for unknown errors
- [ ] Test each error scenario manually:
  - Enter an invalid zip (e.g., "abcde") → should see "We couldn't find that zip code..."
  - Temporarily break the Open-Meteo URL (add a typo) → should see service unavailable message
  - Disable your network connection → should see network error message
- [ ] **Commit**: `git commit -m "Add error handling"`

---

## Phase 10: Polish & Testing

- [ ] Verify text is readable over all three backgrounds (check contrast on each)
- [ ] Add a subtle text shadow or semi-transparent pill/backdrop behind the main message if needed
- [ ] Choose a font (options: system font stack, or a free Google Font like "Nunito" or "Fredoka One")
- [ ] Add a loading spinner or animated dots to the loading state (optional but nice)
- [ ] Test edge cases:
  - [ ] Run just after sunrise (should be in daytime mode)
  - [ ] Run just before sunrise (should be in nighttime mode — Day N = today, visually representing tomorrow)
  - [ ] Run just after sunset (should be in nighttime mode)
  - [ ] Try a zip code known for frequent rain (e.g., Seattle: 98101)
  - [ ] Try a zip code in a very different timezone (e.g., Honolulu: 96801)
- [ ] Final visual review at iPhone viewport size in browser DevTools
- [ ] Final visual review at desktop width (resize browser to full screen) — verify backgrounds scale well and layout feels right
- [ ] Test in at least two desktop browsers (e.g., Chrome and Firefox)
- [ ] **Commit**: `git commit -m "Polish, fonts, and final testing"`

---

## Phase 11: Deploy to GitHub Pages

- [ ] Push all latest commits: `git push origin main`
- [ ] Go to your GitHub repository page
- [ ] Click **Settings** (top right area of the repo)
- [ ] Click **Pages** in the left sidebar
- [ ] Under "Source", select **Deploy from a branch**
- [ ] Choose branch: `main`, folder: `/ (root)` → click **Save**
- [ ] Wait 1–2 minutes
- [ ] Your app is live at: `https://YOUR-USERNAME.github.io/weather-feels/`
- [ ] Open the URL on your actual iPhone and test it
- [ ] Open the URL in a desktop browser and verify it looks good at full width
- [ ] Share the URL with someone to get a second opinion

---

## Notes on Git Workflow (for reference throughout)

After each phase, the commit pattern is:
```
git add .
git commit -m "Your message here"
git push origin main
```

If you make a mistake and want to see what changed:
```
git diff          — shows unsaved changes
git log           — shows commit history
git status        — shows what files have been modified
```

If something breaks badly and you want to go back to the last commit:
```
git checkout .    — discards all unsaved changes (careful — this can't be undone)
```
