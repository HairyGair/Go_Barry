// Search for a Place - address/landmark/bus-stop search for the breakdown
// "Vehicle Location" step. Combines two sources:
//  - GTFS bus stops (supervisors' drivers very often describe "at/near <stop>")
//  - Google Places (landmarks, roads, postcodes) via the app's existing Maps key
//
// Debounced, keyboard-navigable (Up/Down/Enter/Escape), dark theme to match
// the rest of the breakdown guide.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bus, MapPinned, Loader2, X } from 'lucide-react';
import { loadGooglePlaces, searchGtfsStops, geocodePlaceId, NE_BOUNDS } from './geocode.js';

const LocationSearchModal = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [stops, setStops] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placesReady, setPlacesReady] = useState(false);

  const inputRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadGooglePlaces().then((ok) => {
      if (ok && window.google?.maps?.places) {
        placesServiceRef.current = new window.google.maps.places.AutocompleteService();
        setPlacesReady(true);
      }
    });
  }, []);

  // Combined, flattened list used for keyboard navigation + rendering
  const results = [
    ...stops.map((s) => ({
      kind: 'stop',
      key: `stop-${s.stopId}`,
      label: s.stopName,
      sublabel: s.distanceKm != null ? `Bus stop • ${(s.distanceKm * 1000).toFixed(0)}m away` : 'Bus stop',
      stop: s,
    })),
    ...places.map((p) => ({
      kind: 'place',
      key: `place-${p.place_id}`,
      label: p.structured_formatting?.main_text || p.description,
      sublabel: p.structured_formatting?.secondary_text || 'Address / landmark',
      placeId: p.place_id,
      description: p.description,
    })),
  ];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setHighlightedIndex(-1);

    if (!query || query.trim().length < 2) {
      setStops([]);
      setPlaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const stopResults = await searchGtfsStops(query.trim(), { limit: 5, signal: controller.signal });
        if (!controller.signal.aborted) setStops(stopResults);
      } catch (err) {
        if (err?.name !== 'AbortError') setStops([]);
      }

      if (placesServiceRef.current) {
        placesServiceRef.current.getPlacePredictions(
          {
            input: query.trim(),
            locationBias: NE_BOUNDS,
            componentRestrictions: { country: 'gb' },
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPlaces(predictions.slice(0, 5));
            } else {
              setPlaces([]);
            }
          }
        );
      }

      if (!controller.signal.aborted) setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback(async (item) => {
    if (!item) return;
    if (item.kind === 'stop') {
      onSelect({
        lat: item.stop.lat,
        lng: item.stop.lng,
        description: `${item.stop.stopName} bus stop`,
        source: 'stop_search',
        stopId: item.stop.stopId,
      });
      return;
    }

    // Google place - needs a geocode round-trip to get coordinates
    setResolving(true);
    const resolved = await geocodePlaceId(item.placeId);
    setResolving(false);
    if (resolved) {
      onSelect({
        lat: resolved.lat,
        lng: resolved.lng,
        description: resolved.description || item.description,
        source: 'place_search',
      });
    }
  }, [onSelect]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[highlightedIndex] ?? results[0];
      handleSelect(chosen);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 flex flex-col max-h-[80vh]">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-white">Search for a Place</h3>
            <p className="text-sm text-gray-400 mt-1">Bus stops, roads, landmarks, or addresses</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Coast Road near the Silverlink, or Haymarket..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-autocomplete="list"
            />
          </div>
          {!placesReady && (
            <p className="text-xs text-gray-500 mt-2">
              Address search unavailable right now - bus stop search still works.
            </p>
          )}
        </div>

        <div className="px-3 pb-6 overflow-y-auto flex-1">
          {(loading || resolving) && (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {resolving ? 'Locating place...' : 'Searching...'}
            </div>
          )}

          {!loading && !resolving && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No matches for "{query}"
            </div>
          )}

          {!loading && !resolving && results.length > 0 && (
            <ul role="listbox" className="space-y-1">
              {results.map((item, index) => (
                <li key={item.key} role="option" aria-selected={index === highlightedIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                      index === highlightedIndex
                        ? 'bg-cyan-600/20 border border-cyan-500/40'
                        : 'border border-transparent hover:bg-gray-800'
                    }`}
                  >
                    {item.kind === 'stop' ? (
                      <Bus className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <MapPinned className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-white text-sm font-medium truncate">{item.label}</span>
                      <span className="block text-xs text-gray-400 truncate">{item.sublabel}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length < 2 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSearchModal;
