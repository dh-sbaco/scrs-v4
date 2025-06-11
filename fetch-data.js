import fetch from 'node-fetch';
import fs from 'fs';

async function fetchAndUpdate() {
  try {
    const res = await fetch('data.json'); // adjust path if needed
    const data = await res.json();

    // Example: update water temp element
    document.getElementById('waterTemp').textContent = data.waterTemperatureF + ' °F';

    // Update other elements similarly...
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

document.getElementById('refreshBtn').addEventListener('click', fetchAndUpdate);

// Optionally, call it on page load too
window.addEventListener('load', fetchAndUpdate);


const buoyId = '46053';
const pointForecast = { lat: 34.060205, lon: -119.531650 };
const airPoint = { lat: 34.049548, lon: -119.556973 };

async function fetchBuoyTemp() {
  const res = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`);
  const text = await res.text();
  const lines = text.split('\n').filter(line => line && !line.startsWith('#'));
  const parts = lines[0].split(/\s+/);
  const tempC = parseFloat(parts[14]);
  return (tempC * 9/5 + 32).toFixed(1);
}

async function fetchMarineForecast() {
  const res = await fetch(`https://marine.weather.gov/MapClick.php?lat=${pointForecast.lat}&lon=${pointForecast.lon}&FcstType=json`);
  const json = await res.json();
  const m = json.marine.data;
  return {
    windSpeed: m.wind_spd?.[0],
    windDir: m.wind_dir?.[0],
    swell1: { height: m.wvhgt?.[0], period: m.wvper?.[0] },
    swell2: { height: m.wvhgt2?.[0], period: m.wvper2?.[0] }
  };
}

async function fetchAirTemp() {
  const res = await fetch(`https://api.weather.gov/points/${airPoint.lat},${airPoint.lon}`);
  const { properties } = await res.json();
  const grid = properties.forecastHourly;
  const forecast = await fetch(grid).then(r => r.json());
  const temp = forecast.properties.periods[0].temperature;
  return temp;
}

async function fetchTides() {
  // Placeholder for real tide API or mocked data
  return Array.from({ length: 12 }).map((_, i) => ({
    time: `${i + 1}am`,
    height: (Math.sin(i / 2) * 2 + 2).toFixed(2)
  }));
}

async function main() {
  const [tempF, marine, airTemp, tide] = await Promise.all([
    fetchBuoyTemp(), fetchMarineForecast(), fetchAirTemp(), fetchTides()
  ]);

  const output = {
    waterTemperatureF: tempF,
    ...marine,
    airTemp,
    tide,
    updated: new Date().toISOString()
  };

  fs.writeFileSync("data.json", JSON.stringify(output, null, 2));
}

main();
