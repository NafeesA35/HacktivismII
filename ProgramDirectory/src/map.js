const center = [51.536119, 0.111456];
const map =L.map("map", {minZoom: 12}).setView([center], 12);
const bounds = L.latLngBounds(
    [center[0] - 0.005, center[1] - 0.005],
    [center[0] + 0.005, center[1] + 0.005]
);
map.setMaxBounds(bounds);

// creating the map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// pin clusters

const myClusterLayer =  L.markerClusterGroup({
    clusterPin: function (cluster) {
        return L.divIcon({
            html: '<div class="cluster-div">' + cluster.getChildCount() + '</div>',
        });
    }
});

// pin on map
var pin1 = L.marker([51.536119, 0.101]);
var pin2 = L.marker([51.536119, 0.1]);
var pin3 = L.marker([51.535000, 0.1]);

myClusterLayer.addLayer(pin1);
myClusterLayer.addLayer(pin2);
myClusterLayer.addLayer(pin3);

map.addLayer(myClusterLayer);