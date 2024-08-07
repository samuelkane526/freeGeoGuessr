async function initialize() {
  const response = await fetch('./coordinates.json');
  const coordinates = await response.json();
  const { latitude: lat, longitude: lng } = coordinates[Math.floor(Math.random() * coordinates.length)];
  const coords = { lat, lng };

  const map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 38.33028550237048, lng: -90.05513949965952},
    zoom: 5,
    addressControl: false,
    linksControl: false,
    panControl: false,
    zoomControl: false,
    enableCloseButton: false,
    streetViewControl: false,
    mapTypeControl: false  ,
    fullscreenControl: false
  });

  const panorama = new google.maps.StreetViewPanorama(document.getElementById("pano"), {
    position: coords,
    pov: { heading: 34, pitch: 10 },
    streetViewControl: false,
    showRoadLabels: false,
    disableDefaultUI: true
  });

  panorama.addListener('position_changed', () => {
    const addressNode = document.querySelector('.gm-iv-address');
    if (addressNode) addressNode.style.display = 'none';
  });

  let marker, line, actualMarker;

  map.addListener('click', (e) => {
    console.log('Map was clicked at: ', e.latLng.lat(), e.latLng.lng());
    document.querySelector(".lockIn").classList.add("lockInActive");
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({ position: e.latLng, map });
  });

  document.querySelector(".lockIn").addEventListener("click", () => {
    const R = 3958.8, toRadians = degrees => degrees * Math.PI / 180;
    const getDistance = (lat1, lng1, lat2, lng2) => {
      const dLat = toRadians(lat2 - lat1), dLng = toRadians(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    if (marker) {
      const markerPos = marker.getPosition();
      const lat = markerPos.lat();
      const lng = markerPos.lng();
      alert(`Distance: ${getDistance(coords.lat, coords.lng, lat, lng)} miles`);

      if (line) line.setMap(null);
      line = new google.maps.Polyline({
        path: [{ lat: coords.lat, lng: coords.lng }, { lat, lng }],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map
      });

      // Add a marker at the actual location
      if (actualMarker) actualMarker.setMap(null);
      actualMarker = new google.maps.Marker({
        position: coords,
        map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // Custom marker icon
        }
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
      bounds.extend(new google.maps.LatLng(lat, lng));
      map.fitBounds(bounds);
    }
  });
}

window.initialize = initialize;
