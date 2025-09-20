document.addEventListener('DOMContentLoaded', async function () {
  const el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return;

  const map = L.map('map', { zoomControl: true, worldCopyJump: false });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 12,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=' +
    encodeURIComponent('London Borough of Barking and Dagenham');

  // Adjusted bounds - 20% reduction in each direction from current bounds
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

    // USE YOUR RESTRICTED BOUNDS instead of the full borough bounds
    map.setMaxBounds(restrictedBounds.pad(0.01));
    map.options.maxBoundsViscosity = 1.0;
    map.fitBounds(restrictedBounds, { padding: [10, 10] });
  } catch (e) {
    console.warn('Boundary fetch failed; using fallback rectangle:', e);
    map.setMaxBounds(restrictedBounds.pad(0.01));
    map.options.maxBoundsViscosity = 1.0;
    map.fitBounds(restrictedBounds, { padding: [10, 10] });
  }

  const centerBD = [51.559, 0.147];
  map.setView(centerBD, 12);

  setTimeout(() => map.invalidateSize(), 0);
});