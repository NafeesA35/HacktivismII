// Leaflet map: init, clamp bounds, one marker per coordinate, navigate to location page
document.addEventListener('DOMContentLoaded', async function () {
  
  const el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return;
  const map = L.map('map', { zoomControl: true, worldCopyJump: false });
  // Base tiles
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
    {
      maxZoom: 19,
      minZoom: 12,
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(map); // .addTo(map) adds the configured tile layer to our map instance.
  
  // Restricted view area + borough outline fetch
  const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=' +
    encodeURIComponent('London Borough of Barking and Dagenham');
  const restrictedBounds = L.latLngBounds([51.5527, 0.1219], [51.5573, 0.1231]);
  try {
    const res = await fetch(NOMINATIM_URL);
    const data = await res.json();
    const feature = data?.features?.[0];
    const geometry = feature?.geometry;
    if (!geometry) throw new Error('Boundary not found');
    const outline = L.geoJSON(geometry, {
      style: { color: '#2E7D32', weight: 2, fillOpacity: 0 }
    }).addTo(map);
    // Lock viewport to a small rectangle inside the borough
    map.setMaxBounds(restrictedBounds.pad(0.01));
    map.options.maxBoundsViscosity = 1.0;
    map.fitBounds(restrictedBounds, { padding: [10, 10] });

  } catch (e) {
    console.warn('Boundary fetch failed; using fallback rectangle:', e);
    map.setMaxBounds(restrictedBounds.pad(0.01));
    map.options.maxBoundsViscosity = 1.0;
    map.fitBounds(restrictedBounds, { padding: [10, 10] });
  }

  // Load stories and add one pin per coordinate
  let lastSelected = null; // { lat: number, lng: number }

  try {
    const resp = await fetch('/api/stories');
    if (!resp.ok) throw new Error('Failed to load stories');
    const stories = await resp.json();

    // Group stories by exact lat,lng so we render a single marker per coordinate
    const groups = new Map();
    for (const s of stories) {
      if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') continue;
      const key = `${s.latitude},${s.longitude}`;
      if (!groups.has(key)) groups.set(key, { lat: s.latitude, lng: s.longitude, items: [] });
      groups.get(key).items.push(s);
    }

    // One marker per group with a count popup
    groups.forEach(({ lat, lng, items }) => {
      const marker = L.marker([lat, lng]).addTo(map);
      const count = items.length;
      const popupHtml = `
        <div>
          <strong>${count} stor${count === 1 ? 'y' : 'ies'} here</strong><br />
          <small>Click this pin to select it.</small>
        </div>`;
      marker.bindPopup(popupHtml);
      // Remember selection for the navigation button
      marker.on('click', () => {
        lastSelected = { lat, lng };
      });
    });
  } catch (e) {
    console.warn('Could not render story markers:', e);
  }

  // Button → /location?latitude=..&longitude=..
  const btn = document.getElementById('viewLocationStoriesBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!lastSelected) {
        alert('Please click a pin on the map first.');
        return;
      }
      const { lat, lng } = lastSelected;
      const url = `/location?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}`;
      window.location.href = url;
    });
  }

  // Fix grey tiles if container resized after init
  setTimeout(() => map.invalidateSize(), 0);
});