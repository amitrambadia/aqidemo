// src/App.js
import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Chart from 'chart.js/auto';

const App = () => {
  const [locationData, setLocationData] = useState({
    latitude: null,
    longitude: null,
    city: null,
    station: null,
    pm25: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { latitude, longitude } = await getCurrentLocation();
        const data = await fetchAQI(latitude, longitude);
        setLocationData({
          latitude,
          longitude,
          city: data.city,
          station: data.station,
          pm25: data.pm25
        });
        setLoading(false);
        updateMap(latitude, longitude);
        displayAQIChart();
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => reject(error)
      );
    });
  };

  const fetchAQI = async (latitude, longitude) => {
    const openAQApiKey = '6e89897acf2546e8caee2f4bc78029da75d232e7d9b79e21624065215349e13d'; // Replace with your OpenAQ API key
    const currentDate = new Date();
  const yesterdayDate = new Date(currentDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const tomorrowDate = new Date(currentDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const formatDate = (date) => {
    return date.toISOString().split('.')[0] + 'Z';
  };

   const aqiUrl = `https://api.openaq.org/v1/measurements?coordinates=${latitude},${longitude}&parameter=pm25&radius=5000&limit=1&order_by=datetime&sort=asc&api_key=${openAQApiKey}`;

  console.log('AQI URL:', aqiUrl);
  console.log("from",formatDate(yesterdayDate))
  console.log("to",formatDate(tomorrowDate))
    const response = await fetch(aqiUrl);
    const data = await response.json();

    console.log("data", data)

    if (data.results && data.results.length > 0) {
      return {
        city: data.results[0].city,
        station: data.results[0].location,
        pm25: data.results[0].value
      };
    } else {
      throw new Error('No data available.');
    }
  };

  const updateMap = (latitude, longitude) => {
    const map = L.map('map').setView([latitude, longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup('Your Location').openPopup();
  };

  const displayAQIChart = () => {
    const ctx = document.getElementById('aqi-chart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Yesterday', 'Today', 'Tomorrow'],
        datasets: [
          {
            label: 'PM2.5 levels',
            data: locationData.pm25,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div id="map" style={{ height: '300px', marginBottom: '20px' }}></div>
          <div>
            <h2>Air Quality Index (AQI)</h2>
            <p>Latitude: {locationData.latitude}</p>
            <p>Longitude: {locationData.longitude}</p>
            <p>City: {locationData.city}</p>
            <p>Station: {locationData.station}</p>
            <h3>PM2.5 levels</h3>
            <ul>
              {locationData.pm25}
            </ul>
            <canvas id="aqi-chart"></canvas>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
