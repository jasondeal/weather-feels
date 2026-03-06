# Technical Documentation
## Weather Feels

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JavaScript (ES6+) |
| Persistence | Browser `localStorage` |
| Backgrounds | SVG files |
| Deployment | GitHub Pages |

No build tools, no framework, no backend. The app is a single folder of static files.

The layout is mobile-first by design target but must look polished on desktop as well. CSS should use responsive techniques (flexbox, viewport units, media queries) to handle both gracefully — not just stretch a phone layout to fill a wide screen.

---

## 2. External APIs

### 2a. Zippopotam.us — Zip Code to Coordinates

**Purpose**: Convert a US zip code into latitude and longitude.

- **Endpoint**: `GET https://api.zippopotam.us/us/{zipcode}`
- **Auth**: None required
- **Cost**: Free
- **CORS**: Supported (safe to call from the browser)

**Example request**: `GET https://api.zippopotam.us/us/10001`

**Example response**:
```json
{
  "post code": "10001",
  "country": "United States",
  "places": [{
    "place name": "New York City",
    "state": "New York",
    "state abbreviation": "NY",
    "latitude": "40.7484",
    "longitude": "-73.9967"
  }]
}
```

**Error case**: Returns HTTP 404 if the zip code is not found.

---

### 2b. Open-Meteo — Weather Data

**Purpose**: Retrieve forecast and historical weather data, including high temperatures, precipitation, cloud cover, and sunrise/sunset times.

- **Endpoint**: `GET https://api.open-meteo.com/v1/forecast`
- **Auth**: None required
- **Cost**: Free (non-commercial use)
- **CORS**: Supported

**Full request parameters**:

| Parameter | Value | Purpose |
|---|---|---|
| `latitude` | From Zippopotam | Location |
| `longitude` | From Zippopotam | Location |
| `daily` | `temperature_2m_max, weathercode, sunrise, sunset` | Daily aggregates |
| `hourly` | `precipitation, cloudcover` | Hourly data for calculations |
| `temperature_unit` | `fahrenheit` | Display in °F |
| `precipitation_unit` | `inch` | Display in inches |
| `timezone` | `auto` | Infer timezone from coordinates |
| `past_days` | `1` | Include yesterday's data |
| `forecast_days` | `3` | Include today and tomorrow |

**Example request**:
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=40.7484
  &longitude=-73.9967
  &daily=temperature_2m_max,weathercode,sunrise,sunset
  &hourly=precipitation,cloudcover
  &temperature_unit=fahrenheit
  &precipitation_unit=inch
  &timezone=auto
  &past_days=1
  &forecast_days=3
```

**Key response fields**:
```json
{
  "timezone": "America/New_York",
  "daily": {
    "time": ["2024-01-14", "2024-01-15", "2024-01-16", "2024-01-17"],
    "temperature_2m_max": [38.5, 42.0, 51.3, 44.8],
    "weathercode": [3, 61, 1, 0],
    "sunrise": ["2024-01-14T07:20", "2024-01-15T07:20", "2024-01-16T07:19", "2024-01-17T07:19"],
    "sunset":  ["2024-01-14T16:58", "2024-01-15T16:59", "2024-01-16T17:00", "2024-01-17T17:01"]
  },
  "hourly": {
    "time": ["2024-01-14T00:00", "2024-01-14T01:00", "..."],
    "precipitation": [0.0, 0.0, 0.04, 0.02, "..."],
    "cloudcover": [80, 75, 60, 55, "..."]
  }
}
```

**Important note on date range**: With `past_days=1` and `forecast_days=3`, the response covers yesterday, today, tomorrow, and the day after. Index 0 = yesterday, index 1 = today, index 2 = tomorrow.

---

## 3. File Structure

```
weather-feels/
├── index.html        — App shell and DOM structure
├── style.css         — All styles
├── app.js            — All JavaScript logic
├── sunny.svg         — Sunny background illustration
├── cloudy.svg        — Cloudy background illustration
├── rainy.svg         — Rainy background illustration
├── demo-codes.txt    — Reference list of 6-digit demo codes for testing
└── README.md         — Project overview
```

---

## 4. Data Flow

```
User enters zip code
        │
        ▼
fetchLocation(zip)
  → GET api.zippopotam.us/us/{zip}
  → Returns { lat, lng }
        │
        ▼
fetchWeather(lat, lng)
  → GET open-meteo.com/v1/forecast
  → Returns { timezone, daily, hourly }
        │
        ▼
determineDay(daily, timezone)
  → Compares current local time to today's sunrise/sunset
  → Returns { nIndex, n1Index, isDaytime }
        │
        ▼
computeTemperatureMessage(daily, nIndex, n1Index)
  → Compares daily.temperature_2m_max[nIndex] to [n1Index]
  → Returns message string
        │
        ▼
computeRainExpected(hourly, timezone, dayN_date)
  → Sums precipitation from hours 8–19 for Day N
  → Returns boolean
        │
        ▼
computeBackground(hourly, daily, timezone, nIndex)
  → Checks precipitation > 0.05in (8AM–8PM)
  → If not rainy, checks avg cloud cover sunrise–sunset
  → Returns 'sunny' | 'cloudy' | 'rainy'
        │
        ▼
renderUI(tempMessage, rainExpected, background, isDaytime, tempN, tempN1)
  → Sets day header ("Today will be:" / "Tomorrow will be:")
  → Updates main message, rain line, temp detail row
  → Sets background SVG
```

---

## 5. Key Algorithms

### 5a. Get Current Date String in Location Timezone

Open-Meteo returns a `timezone` IANA string (e.g. `"America/New_York"`). To find today's date in that timezone:

```javascript
function getTodayString(timezone) {
  // 'en-CA' locale uses YYYY-MM-DD format, which matches Open-Meteo's date format
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}
```

### 5b. Get Current Time as Minutes Since Midnight (in Location Timezone)

```javascript
function getCurrentMinutesInTZ(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  return hour * 60 + minute;
}
```

### 5c. Parse Sunrise/Sunset Time String to Minutes Since Midnight

Open-Meteo returns sunrise/sunset as strings like `"2024-01-15T07:20"` — already in the location's local timezone, but without a timezone designator. We just need the time portion:

```javascript
function parseTimeToMinutes(dateTimeStr) {
  // dateTimeStr looks like "2024-01-15T07:20"
  const timePart = dateTimeStr.split('T')[1]; // "07:20"
  const [hour, minute] = timePart.split(':').map(Number);
  return hour * 60 + minute;
}
```

### 5d. Day Determination

```javascript
function determineDay(daily, timezone) {
  const todayStr = getTodayString(timezone);
  const todayIndex = daily.time.indexOf(todayStr);

  if (todayIndex === -1) {
    throw new Error('Could not find today in weather data.');
  }

  const currentMinutes = getCurrentMinutesInTZ(timezone);
  const sunriseMinutes = parseTimeToMinutes(daily.sunrise[todayIndex]);
  const sunsetMinutes = parseTimeToMinutes(daily.sunset[todayIndex]);

  const isDaytime = currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;

  if (isDaytime) {
    // Day N = today, Day N-1 = yesterday
    return { nIndex: todayIndex, n1Index: todayIndex - 1, isDaytime: true };
  } else {
    // Day N = tomorrow, Day N-1 = today
    return { nIndex: todayIndex + 1, n1Index: todayIndex, isDaytime: false };
  }
}
```

### 5e. Temperature Message

```javascript
function getTempMessage(tempN, tempN1) {
  const diff = Math.round(tempN) - Math.round(tempN1);

  if (diff >= 8)  return "A lot warmer";
  if (diff >= 4)  return "Warmer";
  if (diff >= 1)  return "A little warmer";
  if (diff === 0) return "About the same";
  if (diff >= -3) return "A little cooler";
  if (diff >= -7) return "Cooler";
  return "A lot cooler";
}
```

### 5f. Rain Detection (8AM–8PM Cumulative Precipitation)

Open-Meteo hourly times look like `"2024-01-15T08:00"`. Each value represents precipitation that fell during that hour (e.g., the value at `T08:00` covers 8:00–8:59 AM).

We sum hours 8 through 19 (covering 8:00 AM through 7:59 PM) for a total of 12 hours.

```javascript
function getRainExpected(hourly, dayN_date) {
  // dayN_date is a string like "2024-01-15"
  let total = 0;

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i]; // e.g. "2024-01-15T08:00"
    if (!timeStr.startsWith(dayN_date)) continue;

    const hour = parseInt(timeStr.slice(11, 13));
    if (hour >= 8 && hour < 20) {
      total += hourly.precipitation[i];
    }
  }

  return total > 0.05;
}
```

### 5g. Background Selection

We check rain first, then cloud cover. Cloud cover is averaged over the hours between (and including) sunrise and sunset.

```javascript
function getBackground(hourly, daily, timezone, nIndex) {
  const dayN_date = daily.time[nIndex];

  // Step 1: Check for rain (reuse rain logic)
  if (getRainExpected(hourly, dayN_date)) return 'rainy';

  // Step 2: Calculate average cloud cover from sunrise to sunset
  const sunriseHour = parseInt(daily.sunrise[nIndex].slice(11, 13));
  const sunsetHour = parseInt(daily.sunset[nIndex].slice(11, 13));

  const daytimeCloudCover = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    if (!timeStr.startsWith(dayN_date)) continue;
    const hour = parseInt(timeStr.slice(11, 13));
    if (hour >= sunriseHour && hour <= sunsetHour) {
      daytimeCloudCover.push(hourly.cloudcover[i]);
    }
  }

  const avgCloudCover = daytimeCloudCover.length > 0
    ? daytimeCloudCover.reduce((a, b) => a + b, 0) / daytimeCloudCover.length
    : 100; // Default to cloudy if no data

  return avgCloudCover < 30 ? 'sunny' : 'cloudy';
}
```

### 5h. Message Composition

```javascript
function composeMessage(tempMessage, rainExpected) {
  return rainExpected ? `${tempMessage}. Rain is expected.` : tempMessage;
}
```

### 5i. State Demo Codes

Six-digit state demo codes (e.g. `200101`, `200304`) bypass all API calls and force the app into a specific visual and message combination. There are 21 codes covering every valid combination of background (sunny / cloudy / rainy) × temperature message (A lot warmer through A lot cooler).

Code structure:
- `2001XX` = Sunny background
- `2002XX` = Cloudy background
- `2003XX` = Rainy background (rain notice always shown)
- Last two digits `01`–`07` = temperature message rank (A lot warmer → A lot cooler)

Each entry in `STATE_CODES` is a plain object with all the data `showWeather()` needs:

```javascript
const STATE_CODES = {
  '200101': { background: 'sunny', tempMessage: 'A lot warmer', rainExpected: false, tempN: 80, tempN1: 70 },
  // ... 20 more entries
};
```

In the form submit handler, state codes are detected before the normal `loadWeather()` path. When matched, `showWeather()` is called directly and the handler returns early — no API calls are made, nothing is saved to `localStorage`:

```javascript
const value = input.value.trim();

if (STATE_CODES[value]) {
  const state = STATE_CODES[value];
  showWeather({
    tempMessage:  state.tempMessage,
    rainExpected: state.rainExpected,
    background:   state.background,
    locationName: 'Demo',
    isDaytime:    true,
    tempN:        state.tempN,
    tempN1:       state.tempN1,
  });
  return; // skip all API calls
}

if (value) loadWeather(value);
```

The complete code listing is documented in `demo-codes.txt`.

### 5j. UI — Day Header and Temperature Detail

After `determineDay` returns `isDaytime`, two additional UI elements are populated:

**Day header** (above main message):
```javascript
el('day-header').textContent = isDaytime ? 'Today will be:' : 'Tomorrow will be:';
```

**Temperature detail row** (below rain line):
```javascript
const n1Label = isDaytime ? 'Yesterday' : 'Today';
const nLabel  = isDaytime ? 'Today'     : 'Tomorrow';
el('temp-n1-label').textContent = n1Label;
el('temp-n1-value').textContent = `${Math.round(tempN1)}°`;
el('temp-n-label').textContent  = nLabel;
el('temp-n-value').textContent  = `${Math.round(tempN)}°`;
```

---

## 6. localStorage Schema

```javascript
// One key used:
const STORAGE_KEY = 'weatherFeels_zip';

// Save:
localStorage.setItem(STORAGE_KEY, '10001');

// Load:
const savedZip = localStorage.getItem(STORAGE_KEY); // "10001" or null
```

---

## 7. Error Handling

All API calls are wrapped in try/catch. Human-readable messages are shown for each scenario:

| Scenario | User-Facing Message |
|---|---|
| Zip code not found (404) | "We couldn't find that zip code. Please try a different one." |
| Network unavailable | "Unable to connect. Please check your internet connection and try again." |
| Weather service unavailable | "Weather data is temporarily unavailable. Please try again in a moment." |
| Unexpected error | "Something went wrong loading the weather. Please try again." |

Error display replaces the weather content in the UI (does not show both at once).

---

## 8. SVG Background Specifications

All three SVGs use a landscape viewBox of `0 0 800 600` paired with `background-size: cover`, which scales and crops gracefully on both portrait mobile and landscape desktop viewports. Style is intentionally simple and childlike — thick strokes, flat fills, no gradients or shadows.

### sunny.svg
- **Sky**: Light blue rectangle (`#87CEEB`) filling the full viewBox
- **Sun**: Yellow-gold circle (`#FFD700`), radius ~60px, positioned upper-right area (cx=300, cy=110)
- **Sun rays**: 8 lines radiating outward from the sun center, stroke `#FFD700`, strokeWidth=5, length ~70px each
- **Ground**: Wavy/bumpy green shape at the bottom ~20% of the image, fill `#5D8A2C`. Achieved with a `<path>` using a gentle wave.
- **Optional cloud**: A simple white cloud (2–3 overlapping circles) on the left side for character

### cloudy.svg
- **Sky**: Light gray rectangle (`#C8C8C8`) filling the full viewBox
- **Clouds**: 3 cloud shapes distributed across the upper half. Each cloud is made of 3–4 overlapping circles, filled white (`#FFFFFF`) or light gray (`#E0E0E0`).
- **Ground**: Same wavy green shape as sunny, slightly muted (`#6B9A3E`)

### rainy.svg
- **Sky**: Dark blue-gray rectangle (`#5C6B7A`) filling the full viewBox
- **Clouds**: 2–3 large cloud shapes in the upper third, filled dark gray (`#3D4F5C`)
- **Rain**: 18–20 short diagonal lines (`/` direction), stroke `#89CFF0`, strokeWidth=2, length ~20px each, distributed across the middle portion of the image
- **Puddles**: 3–4 flat ellipses near the bottom, fill `#89CFF0`, varying widths

---

## 9. Deployment: GitHub Pages

GitHub Pages hosts static files for free directly from a GitHub repository.

1. Create a GitHub repository named `weather-feels`
2. Push all project files to the `main` branch
3. In the repository, go to **Settings → Pages**
4. Under "Source", select **Deploy from a branch**, choose `main`, and root `/`
5. Click **Save**
6. After 1–2 minutes, the app will be live at: `https://[your-username].github.io/weather-feels/`

Any time you push a new commit to `main`, the live site automatically updates within a minute or two.

---

## 10. API Reliability Notes

Both APIs used are operated by reputable, stable services with no authentication required:

- **Zippopotam.us** has been running since ~2011 and is widely used in hobby/educational projects.
- **Open-Meteo** is open source and aggregates data from multiple global weather models (NOAA, ECMWF, DWD, etc.), making it more accurate than most free single-source APIs.

If either API becomes unreliable in the future, migration paths exist: Open-Meteo can be self-hosted, and Zippopotam.us can be replaced with the US Census Bureau geocoding API (also free and government-maintained).
