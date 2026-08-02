// Go_BARRY/config/googleMaps.js
// Single source of truth for the Google Maps Platform API key.
//
// The key must come from the environment. Do not hardcode a fallback here or
// anywhere else: this repo is public, and a committed key gets scraped and
// billed against the account within days.
//
// Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in Go_BARRY/.env for local work, and in
// the Render / cPanel build environment for deploys. See .env.example.

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

// True when a key is configured. Callers should check this before building a
// Google URL, and render a fallback instead of a broken map when it is false.
export const hasGoogleMapsKey = () => GOOGLE_MAPS_API_KEY.length > 0;

let warned = false;

// Returns the key, warning once per session if it is missing.
export const requireGoogleMapsKey = () => {
  if (!GOOGLE_MAPS_API_KEY && !warned) {
    warned = true;
    console.warn(
      '[Go BARRY] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Google Maps features are disabled.'
    );
  }
  return GOOGLE_MAPS_API_KEY;
};

export default GOOGLE_MAPS_API_KEY;
