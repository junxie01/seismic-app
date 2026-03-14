import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const EarthquakeMap = () => {

const html = `
<!DOCTYPE html>
<html>

<head>

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="stylesheet"
href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<style>

html,body,#map{
height:100%;
margin:0;
}

.controls{

position:absolute;
top:10px;
left:10px;

background:white;

padding:10px;

border-radius:8px;

box-shadow:0 2px 6px rgba(0,0,0,0.2);

z-index:999;

}

button{

margin:4px;

padding:6px 10px;

border:none;

background:#007AFF;

color:white;

border-radius:5px;

}

.legend{

position:absolute;

bottom:20px;

left:10px;

background:white;

padding:10px;

border-radius:8px;

}

</style>

</head>

<body>

<div id="map"></div>

<div class="controls">

<button onclick="loadData('day')">24h</button>

<button onclick="loadData('week')">7天</button>

<button onclick="loadData('month')">30天</button>

</div>

<div class="legend">

<div>🔴 ≥6</div>

<div>🟠 5-6</div>

<div>🟢 <5</div>

</div>

<script>

var map = L.map('map').setView([20,0],2);

var layerGroup = L.layerGroup().addTo(map);

L.tileLayer(
'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
{maxZoom:10}
).addTo(map);

function getColor(m){

if(m>=6) return "red";

if(m>=5) return "orange";

return "green";

}

function getSize(m){

return Math.max(4,m*2);

}

function loadData(period){

layerGroup.clearLayers();

fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_"+period+".geojson")

.then(r=>r.json())

.then(data=>{

data.features.forEach(eq=>{

const lat=eq.geometry.coordinates[1];

const lon=eq.geometry.coordinates[0];

const depth=eq.geometry.coordinates[2];

const mag=eq.properties.mag;

const place=eq.properties.place;

const time=new Date(eq.properties.time).toLocaleString();

L.circleMarker([lat,lon],{

radius:getSize(mag),

color:getColor(mag),

fillColor:getColor(mag),

fillOpacity:0.7

})

.addTo(layerGroup)

.bindPopup(

"<b>"+place+"</b><br>"+

"震级: M"+mag+"<br>"+

"深度: "+depth+" km<br>"+

"时间: "+time

);

});

});

}

loadData("day");

</script>

</body>

</html>
`;

return (

<View style={{flex:1}}>

<WebView
originWhitelist={['*']}
source={{html}}
javaScriptEnabled
domStorageEnabled
style={{flex:1}}
/>

</View>

);

};

export default EarthquakeMap;
