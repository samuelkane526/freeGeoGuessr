var score = 0, roundNum = 0, room, coordList = [], coords = {}, mapOnTop = true;
var map, marker, line, actualMarker;

const mapCon = document.querySelector(".mapCon");
const panoDisplay = document.querySelector(".pano")
const lockInBtn = document.querySelector(".lockIn")
const mileTxt = document.querySelector(".mileTxt")
const toggleView = document.querySelector(".toggleViewBtn");

async function initialize() {
  const response = await fetch('./coordinates.json');
  coordList = await response.json();
  coords = { lat: coordList[0].latitude, lng: coordList[0].longitude };

  document.querySelector(".menuBlind").addEventListener("click", () => {
    document.querySelector(".menuBlind").style.visibility = "hidden";
    document.querySelector(".socialMenu").style.visibility = "hidden";
  });

  document.querySelector(".manageSocial").addEventListener("click", () => {
    document.querySelector(".menuBlind").style.visibility = "visible";
    document.querySelector(".socialMenu").style.visibility = "visible";
  });

  const apiUrl = 'http://192.168.0.160:3000';
  const makeRequest = (path, method, data, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, apiUrl + path, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = () => { if (xhr.readyState === 4) callback(JSON.parse(xhr.responseText)); };
    xhr.send(JSON.stringify(data));
  };

  document.querySelector(".createRoomBtn").addEventListener("click", () => {
    makeRequest('/roomCreate', 'POST', { totalRounds: prompt('Enter the Total Rounds') }, (response) => {
      alert(response.message);
      joinRoom(response.message);
    });
  });

  document.querySelector(".joinRoomBtn").addEventListener("click", () => joinRoom(prompt("Enter the Room Code")));

  const joinRoom = (roomId) => {
    if (!roomId) return alert("Please enter in a room code.");
    makeRequest("/roomJoin", "POST", { roomId }, (response) => {
      if (response.roomId) {
        roundNum = score = 0;
        room = { roomId: response.roomId, coordList: response.coordList };
        coordList = room.coordList;
        coords = { lat: coordList[0].latitude, lng: coordList[0].longitude };
        alert(`Joined Room: ${room.roomId}`);
        renderPanorama();
        resetMap();
      } else alert(response.message);
    });
  };

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 38.33028550237048, lng: -90.05513949965952 },
    zoom: 5,
    addressControl: false,
    linksControl: false,
    panControl: false,
    zoomControl: false,
    enableCloseButton: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false
  });

  await renderPanorama();

  map.addListener('click', (e) => {
    lockInBtn.classList.add("lockInActive");
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({ position: e.latLng, map });
  });

  var guessed = false;

  lockInBtn.addEventListener("click", () => {
    if(guessed) return;

    guessed = true;
    mapCon.classList.remove("mapConNoGuess")
    mapCon.classList.add("mapConGuessed")
    lockInBtn.style.visibility = "hidden"
    document.querySelector(".roundOverMenu").style.visibility = "visible"

    const R = 3958.8, toRadians = degrees => degrees * Math.PI / 180;
    const getDistance = (lat1, lng1, lat2, lng2) => {
      const dLat = toRadians(lat2 - lat1), dLng = toRadians(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    if (marker) {
      const markerPos = marker.getPosition();
      const lat = markerPos.lat(), lng = markerPos.lng();
      let distance = (getDistance(coords.lat, coords.lng, lat, lng)).toFixed(1);
      let roundScore = distance > 1000 ? 0 : Math.round(10 - (distance / 100));
      score += roundScore;
      lockInBtn.classList.remove("lockInActive");
      
      mileTxt.textContent = distance + " Miles"
      mileTxt.style.color = "red"
      if(distance < 800) mileTxt.style.color = "orange"
      if(distance < 500) mileTxt.style.color = "yellow"
      if(distance < 200) mileTxt.style.color = "#13aa52";

      if (line) line.setMap(null);
      line = new google.maps.Polyline({
        path: [{ lat: coords.lat, lng: coords.lng }, { lat, lng }],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map
      });

      if (actualMarker) actualMarker.setMap(null);
      actualMarker = new google.maps.Marker({
        position: coords,
        map,
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
      bounds.extend(new google.maps.LatLng(lat, lng));
      map.fitBounds(bounds);
      
      roundNum++;

      if (roundNum == coordList.length){
        document.querySelector(".distanceTxt").textContent = "Game Over! Total Score: " + score
      }
    }
  });

  document.querySelector(".nextRoundBtn").addEventListener("click", function(){
      if (guessed && roundNum < coordList.length) {
        resetMap();
        coords = { lat: coordList[roundNum].latitude, lng: coordList[roundNum].longitude };
        renderPanorama();
        guessed = false;
    }
  });

  toggleView.addEventListener("click", function(){
    if(mapOnTop){
      panoDisplay.style.zIndex = 5;
      toggleView.textContent = "View Map"
    }
    else{
      panoDisplay.style.zIndex = 1;
      toggleView.textContent = "Street View"
    }
    mapOnTop = !mapOnTop;
  })
}


var renderPanorama = async () => {
  coords = room && room.coordList ? room.coordList[roundNum] : coordList[Math.floor(Math.random() * coordList.length)];
  coords = { lat: coords.latitude, lng: coords.longitude };
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return console.error('Invalid coordinates:', coords);

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
}

var resetMap = () => {
  if (line) line.setMap(null);
  if (marker) marker.setMap(null);
  if (actualMarker) actualMarker.setMap(null);
  map.setCenter({ lat: 38.33028550237048, lng: -90.05513949965952 });
  map.setZoom(5);

  document.querySelector(".roundOverMenu").style.visibility = "hidden"

  mapCon.classList.add("mapConNoGuess")
  mapCon.classList.remove("mapConGuessed")
  
  panoDisplay.style.zIndex = 1;
  toggleView.textContent = "Street View"
  mapOnTop = true;

  lockInBtn.style.visibility = "visible"
}

window.initialize = initialize;
