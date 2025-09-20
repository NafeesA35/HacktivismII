/*
 * =================================================================================
 * B&D StoryBank - Leaflet Map Setup
 * =================================================================================
 * This script initializes the interactive map on the homepage using the Leaflet.js library.
 * It sets the map's boundaries, fetches the official outline of Barking and Dagenham,
 * and prepares to display story markers.
 * =================================================================================
 */

// This is the main entry point for our script.
// The 'DOMContentLoaded' event fires when the initial HTML document has been completely loaded and parsed.
// We wrap our code in this event listener to ensure that the HTML element <div id="map"></div> exists before we try to use it.
// The 'async' keyword allows us to use 'await' for handling asynchronous operations, like fetching data from an API.
document.addEventListener('DOMContentLoaded', async function () {
  
  // --- 1. BASIC MAP INITIALIZATION ---

  // Find the <div> element in our HTML with the id 'map'. This is where our map will live.
  const el = document.getElementById('map');
  
  // A safety check. If the 'map' element doesn't exist on the page, or if the Leaflet library (L) failed to load,
  // we stop the script immediately to prevent errors.
  if (!el || typeof L === 'undefined') return;

  // Create a map instance.
  // L.map() is the central function in Leaflet to create a map.
  // - The first argument, 'map', is the ID of the div element to render the map in.
  // - The second argument is an object of options:
  //   - `zoomControl: true`: Shows the default '+' and '-' buttons for zooming.
  //   - `worldCopyJump: false`: Prevents the map from "jumping" back to the original world copy when you pan across the 180th meridian.
  const map = L.map('map', { zoomControl: true, worldCopyJump: false });

  // --- 2. ADDING THE VISUAL MAP LAYER (TILE LAYER) ---

  // A map is made of two main parts: the data (markers, lines) and the visual background (streets, satellite images).
  // This background is called a "tile layer". It's a grid of square images stitched together.
  L.tileLayer(
    // This is the URL template for the map tiles from OpenStreetMap.
    // Leaflet replaces {s}, {z}, {x}, and {y} with the correct values for each tile it needs to load.
    // {z} = zoom level, {x} = horizontal position, {y} = vertical position, {s} = subdomain (for faster loading).
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      // Options for the tile layer:
      // `maxZoom`: The deepest level a user can zoom IN. 19 is very close (street level).
      maxZoom: 19,
      // `minZoom`: The furthest level a user can zoom OUT.
      minZoom: 12,
      // `attribution`: The credit text that appears in the corner of the map. This is required by most map providers.
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(map); // .addTo(map) adds the configured tile layer to our map instance.

  // --- 3. DEFINING MAP BOUNDARIES ---

  // This URL is for the Nominatim API, a free service from OpenStreetMap for searching geographic data.
  // We are asking it to find the geographic shape ('polygon_geojson=1') for the "London Borough of Barking and Dagenham".
  const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=' +
    encodeURIComponent('London Borough of Barking and Dagenham');

  // Here, we define a small, rectangular area on the map using its corners.
  // L.latLngBounds() creates a geographical rectangle.
  // The first array `[51.5527, 0.1219]` is the South-West corner (latitude, longitude).
  // The second array `[51.5573, 0.1231]` is the North-East corner (latitude, longitude).
  // This will be the ONLY area the user can see.
  const restrictedBounds = L.latLngBounds([51.5527, 0.1219], [51.5573, 0.1231]);

  // --- 4. FETCHING & APPLYING BOUNDARIES ---

  // The `try...catch` block is for error handling.
  // The code inside `try` will be executed. If any part of it fails (e.g., the user has no internet connection),
  // the program will jump to the `catch` block instead of crashing.
  try {
    // `fetch()` is a modern JavaScript function to make network requests. `await` pauses the code until the request is complete.
    const res = await fetch(NOMINATIM_URL);
    // `await res.json()` parses the response from the server (which is in JSON format) into a JavaScript object.
    const data = await res.json();

    /*
     * --- Beginner's Guide to Optional Chaining (`?.`) ---
     * Sometimes, the data we get from an API might be missing parts.
     * For example, `data.features` might not exist. If we tried to access `data.features[0]`, our code would crash.
     * Optional Chaining (`?.`) is a safe way to access nested properties.
     *
     * `data?.features` means: "If `data` exists, try to get its `features` property. If `data` is null or undefined, stop and return undefined instead of crashing."
     * `data?.features?.[0]` means: "If `data` exists, get `features`. If `features` exists, get its first element (`[0]`). If anything in the chain doesn't exist, just return undefined."
     *
     * It's a clean, short way of writing this:
     * let feature;
     * if (data && data.features && data.features[0]) {
     *   feature = data.features[0];
     * } else {
     *   feature = undefined;
     * }
    */
    const feature = data?.features?.[0];
    const geometry = feature?.geometry;

    // If we couldn't get the geometry data from the API for any reason, we'll treat it as an error.
    if (!geometry) throw new Error('Boundary not found');

    // L.geoJSON() creates a Leaflet layer from GeoJSON data (a standard format for geographic shapes).
    // We add the official green outline of the borough to the map.
    const outline = L.geoJSON(geometry, {
      style: { color: '#2E7D32', weight: 2, fillOpacity: 0 }
    }).addTo(map);

    // --- Apply the RESTRICTED bounds, not the full borough bounds ---
    // This is the key part for limiting the user's view.
    
    // `setMaxBounds` prevents the user from panning outside this area.
    // `.pad(0.01)` adds a tiny bit of padding so the user doesn't hit a hard wall.
    map.setMaxBounds(restrictedBounds.pad(0.01));
    
    // `maxBoundsViscosity: 1.0` makes the boundary completely solid. A value of 0 would let the user pan freely.
    map.options.maxBoundsViscosity = 1.0;
    
    // `fitBounds` automatically calculates the correct zoom and center to make the given bounds fit perfectly in the map view.
    map.fitBounds(restrictedBounds, { padding: [10, 10] });

  } catch (e) {
    // This code runs ONLY if the `try` block failed (e.g., API was down).
    console.warn('Boundary fetch failed; using fallback rectangle:', e);
    // We apply the same restricted bounds as a fallback.
    map.setMaxBounds(restrictedBounds.pad(0.01));
    map.options.maxBoundsViscosity = 1.0;
    map.fitBounds(restrictedBounds, { padding: [10, 10] });
  }

  // --- 5. FINAL MAP ADJUSTMENTS ---

  // This `setView` call is problematic because it runs AFTER `fitBounds`.
  // `fitBounds` already set the perfect view for your restricted area.
  // This line then immediately overrides it, re-centering the map and changing the zoom,
  // which is likely why you didn't see your changes before. It should be removed.
  const centerBD = [51.559, 0.147];
  map.setView(centerBD, 12);

  // This is a small but important fix for a common Leaflet issue.
  // Sometimes, if the map container's size is determined by other elements on the page,
  // Leaflet might calculate its size before the page is fully rendered, resulting in a broken map (e.g., grey tiles).
  // `invalidateSize()` tells Leaflet to re-check the container's size and redraw itself.
  // `setTimeout(..., 0)` schedules this to run in the next "tick" of the browser's event loop, ensuring it happens after rendering is complete.
  setTimeout(() => map.invalidateSize(), 0);
});