'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weatherFeels_zip';

// ─── State demo codes ─────────────────────────────────────────────────────────
// 6-digit codes that force the app into a specific visual/message combination,
// bypassing the weather API entirely. Useful for testing every app state.
//
// Code structure:  2001XX = Sunny   2002XX = Cloudy   2003XX = Rainy
//                  XX01 = Hotter         XX02 = Warmer          XX03 = A little warmer
//                  XX04 = About the same XX05 = A little cooler XX06 = Cooler
//                  XX07 = Colder
//
// Rainy states always carry "Rain is expected." (same threshold drives both).
// Sunny and cloudy states never show a rain notice.
//
// Each entry: { background, tempMessage, rainExpected, tempN, tempN1 }
// Temperatures are chosen to produce the correct message bucket.

const STATE_CODES = {
  // ── Sunny ─────────────────────────────────────────────────────────────────
  '200101': { background: 'sunny',  tempMessage: 'Hotter',         rainExpected: false, tempN: 82, tempN1: 70 },
  '200102': { background: 'sunny',  tempMessage: 'Warmer',         rainExpected: false, tempN: 79, tempN1: 70 },
  '200103': { background: 'sunny',  tempMessage: 'A little warmer',rainExpected: false, tempN: 75, tempN1: 70 },
  '200104': { background: 'sunny',  tempMessage: 'About the same', rainExpected: false, tempN: 70, tempN1: 70 },
  '200105': { background: 'sunny',  tempMessage: 'A little cooler',rainExpected: false, tempN: 65, tempN1: 70 },
  '200106': { background: 'sunny',  tempMessage: 'Cooler',         rainExpected: false, tempN: 61, tempN1: 70 },
  '200107': { background: 'sunny',  tempMessage: 'Colder',         rainExpected: false, tempN: 58, tempN1: 70 },
  // ── Cloudy ────────────────────────────────────────────────────────────────
  '200201': { background: 'cloudy', tempMessage: 'Hotter',         rainExpected: false, tempN: 82, tempN1: 70 },
  '200202': { background: 'cloudy', tempMessage: 'Warmer',         rainExpected: false, tempN: 79, tempN1: 70 },
  '200203': { background: 'cloudy', tempMessage: 'A little warmer',rainExpected: false, tempN: 75, tempN1: 70 },
  '200204': { background: 'cloudy', tempMessage: 'About the same', rainExpected: false, tempN: 70, tempN1: 70 },
  '200205': { background: 'cloudy', tempMessage: 'A little cooler',rainExpected: false, tempN: 65, tempN1: 70 },
  '200206': { background: 'cloudy', tempMessage: 'Cooler',         rainExpected: false, tempN: 61, tempN1: 70 },
  '200207': { background: 'cloudy', tempMessage: 'Colder',         rainExpected: false, tempN: 58, tempN1: 70 },
  // ── Rainy (rain message always shown) ─────────────────────────────────────
  '200301': { background: 'rainy',  tempMessage: 'Hotter',         rainExpected: true,  tempN: 82, tempN1: 70 },
  '200302': { background: 'rainy',  tempMessage: 'Warmer',         rainExpected: true,  tempN: 79, tempN1: 70 },
  '200303': { background: 'rainy',  tempMessage: 'A little warmer',rainExpected: true,  tempN: 75, tempN1: 70 },
  '200304': { background: 'rainy',  tempMessage: 'About the same', rainExpected: true,  tempN: 70, tempN1: 70 },
  '200305': { background: 'rainy',  tempMessage: 'A little cooler',rainExpected: true,  tempN: 65, tempN1: 70 },
  '200306': { background: 'rainy',  tempMessage: 'Cooler',         rainExpected: true,  tempN: 61, tempN1: 70 },
  '200307': { background: 'rainy',  tempMessage: 'Colder',         rainExpected: true,  tempN: 58, tempN1: 70 },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

function saveZip(zip) {
  localStorage.setItem(STORAGE_KEY, zip);
}

function loadZip() {
  return localStorage.getItem(STORAGE_KEY);
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchLocation(zip) {
  let response;
  try {
    response = await fetch(`https://api.zippopotam.us/us/${zip}`);
  } catch {
    throw new Error('network_error');
  }
  if (response.status === 404) throw new Error('zip_not_found');
  if (!response.ok) throw new Error('location_unavailable');

  const data = await response.json();
  const place = data.places[0];
  return {
    lat:   parseFloat(place.latitude),
    lng:   parseFloat(place.longitude),
    city:  place['place name'],
    state: place['state abbreviation'],
  };
}

async function fetchWeather(lat, lng) {
  const params = new URLSearchParams({
    latitude:           lat,
    longitude:          lng,
    daily:              'temperature_2m_max,weathercode,sunrise,sunset',
    hourly:             'precipitation,cloudcover',
    temperature_unit:   'fahrenheit',
    precipitation_unit: 'inch',
    timezone:           'auto',
    past_days:          '1',
    forecast_days:      '3',
  });

  let response;
  try {
    response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  } catch {
    throw new Error('network_error');
  }
  if (!response.ok) throw new Error('weather_unavailable');
  return response.json();
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

// Returns today's date as "YYYY-MM-DD" in the given IANA timezone.
// 'en-CA' locale produces YYYY-MM-DD format natively.
function getTodayString(timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
}

// Returns the current time as total minutes since midnight, in the given timezone.
function getCurrentMinutesInTZ(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).formatToParts(new Date());

  // hour12: false can return "24" for midnight in some browsers; normalise to 0
  const hour   = parseInt(parts.find(p => p.type === 'hour').value,   10) % 24;
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return hour * 60 + minute;
}

// Parses the time portion of an Open-Meteo datetime string like "2024-01-15T07:20"
// and returns it as minutes since midnight.
function parseTimeToMinutes(dateTimeStr) {
  const [hour, minute] = dateTimeStr.split('T')[1].split(':').map(Number);
  return hour * 60 + minute;
}

// ─── Day determination ────────────────────────────────────────────────────────

// Determines which index in daily.time is "Day N" (today in app terms) and
// which is "Day N-1" (yesterday in app terms). Also returns isDaytime.
//
// Rule: if we're between sunrise and sunset, today is Day N.
//       if we're after sunset or before sunrise, tomorrow is Day N.
//
function determineDay(daily, timezone) {
  const todayStr   = getTodayString(timezone);
  const todayIndex = daily.time.indexOf(todayStr);

  if (todayIndex === -1) throw new Error('day_not_found');

  const currentMinutes = getCurrentMinutesInTZ(timezone);
  const sunriseMinutes = parseTimeToMinutes(daily.sunrise[todayIndex]);
  const sunsetMinutes  = parseTimeToMinutes(daily.sunset[todayIndex]);
  const isDaytime      = currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;

  return isDaytime
    ? { nIndex: todayIndex,     n1Index: todayIndex - 1, isDaytime: true  } // Day N = today
    : { nIndex: todayIndex + 1, n1Index: todayIndex,     isDaytime: false }; // Day N = tomorrow
}

// ─── Weather logic ────────────────────────────────────────────────────────────

// Compares two high temperatures and returns the appropriate message string.
function getTempMessage(tempN, tempN1) {
  const diff = Math.round(tempN) - Math.round(tempN1);
  if (diff >   10) return 'Hotter';
  if (diff >=   8) return 'Warmer';
  if (diff >=   3) return 'A little warmer';
  if (diff >=  -2) return 'About the same';
  if (diff >=  -7) return 'A little cooler';
  if (diff >= -10) return 'Cooler';
  return 'Colder';
}

// Returns true if the cumulative precipitation for dayN_date between 8AM and 8PM
// (i.e. hourly buckets 08:00 through 19:00) exceeds 0.05 inches.
function getRainExpected(hourly, dayN_date) {
  let total = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    if (!hourly.time[i].startsWith(dayN_date)) continue;
    const hour = parseInt(hourly.time[i].slice(11, 13), 10);
    if (hour >= 8 && hour < 20) total += hourly.precipitation[i];
  }
  return total > 0.05;
}

// Determines which SVG background to show for Day N.
// Priority: rainy > sunny (avg cloud cover < 30%) > cloudy.
function getBackground(hourly, daily, nIndex) {
  const dayN_date = daily.time[nIndex];

  if (getRainExpected(hourly, dayN_date)) return 'rainy';

  const sunriseHour = parseInt(daily.sunrise[nIndex].slice(11, 13), 10);
  const sunsetHour  = parseInt(daily.sunset[nIndex].slice(11, 13),  10);

  const daytimeCover = [];
  for (let i = 0; i < hourly.time.length; i++) {
    if (!hourly.time[i].startsWith(dayN_date)) continue;
    const hour = parseInt(hourly.time[i].slice(11, 13), 10);
    if (hour >= sunriseHour && hour <= sunsetHour) {
      daytimeCover.push(hourly.cloudcover[i]);
    }
  }

  const avg = daytimeCover.length > 0
    ? daytimeCover.reduce((a, b) => a + b, 0) / daytimeCover.length
    : 100; // default to cloudy if no data

  return avg < 30 ? 'sunny' : 'cloudy';
}

// ─── Error messages ───────────────────────────────────────────────────────────

function getErrorMessage(err) {
  switch (err.message) {
    case 'zip_not_found':
      return "We couldn't find that zip code. Please try a different one.";
    case 'network_error':
      return "Unable to connect. Please check your internet connection and try again.";
    case 'weather_unavailable':
      return "Weather data is temporarily unavailable. Please try again in a moment.";
    default:
      return "Something went wrong loading the weather. Please try again.";
  }
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function el(id) {
  return document.getElementById(id);
}

function hideAll() {
  el('welcome').hidden         = true;
  el('loading').hidden         = true;
  el('weather-display').hidden = true;
  el('error-display').hidden   = true;
}

function showWelcome() {
  hideAll();
  el('welcome').hidden = false;
}

function showLoading() {
  hideAll();
  el('loading').hidden = false;
}

function showError(message) {
  hideAll();
  el('error-display').textContent = message;
  el('error-display').hidden = false;
}

function showWeather({ tempMessage, rainExpected, background, locationName, isDaytime, tempN, tempN1 }) {
  hideAll();

  // Header: "Today will be:" / "Tomorrow will be:"
  el('day-header').textContent = isDaytime ? 'Today will be:' : 'Tomorrow will be:';

  // Main message
  el('weather-message').textContent = tempMessage;

  // Rain line
  el('rain-message').textContent = rainExpected ? 'Rain is expected.' : '';

  // Temperature detail row
  // Labels depend on whether Day N is today or tomorrow
  const n1Label = isDaytime ? 'Yesterday' : 'Today';
  const nLabel  = isDaytime ? 'Today'     : 'Tomorrow';
  el('temp-n1-label').textContent = n1Label;
  el('temp-n1-value').textContent = `${Math.round(tempN1)}°`;
  el('temp-n-label').textContent  = nLabel;
  el('temp-n-value').textContent  = `${Math.round(tempN)}°`;

  // Location pill and background
  el('location-name').textContent = locationName;
  setBackground(background);

  el('weather-display').hidden = false;
}

function setBackground(type) {
  el('app').style.backgroundImage = `url('${type}.svg')`;
}

// ─── Main orchestration ───────────────────────────────────────────────────────

async function loadWeather(zip) {
  showLoading();

  try {
    // Step 1: zip → lat/lng
    const { lat, lng, city, state } = await fetchLocation(zip);

    // Step 2: lat/lng → weather data
    const { daily, hourly, timezone } = await fetchWeather(lat, lng);

    // Step 3: figure out which days are "Day N" and "Day N-1", and whether it's daytime
    const { nIndex, n1Index, isDaytime } = determineDay(daily, timezone);

    // Step 4: compute message components
    const tempN      = daily.temperature_2m_max[nIndex];
    const tempN1     = daily.temperature_2m_max[n1Index];
    const dayN_date  = daily.time[nIndex];

    const tempMessage  = getTempMessage(tempN, tempN1);
    const rainExpected = getRainExpected(hourly, dayN_date);
    const background   = getBackground(hourly, daily, nIndex);

    // Step 5: persist zip and render
    saveZip(zip);
    showWeather({
      tempMessage,
      rainExpected,
      background,
      locationName: `${city}, ${state}`,
      isDaytime,
      tempN,
      tempN1,
    });

  } catch (err) {
    console.error('Weather load error:', err);
    showError(getErrorMessage(err));
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form  = el('zip-form');
  const input = el('zip-input');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const value = input.value.trim();

    // 6-digit state codes bypass the API and force the app into a specific visual state
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
  });

  // Auto-load if a zip was saved from a previous visit
  const savedZip = loadZip();
  if (savedZip) {
    input.value = savedZip;
    loadWeather(savedZip);
  } else {
    showWelcome();
  }
});
