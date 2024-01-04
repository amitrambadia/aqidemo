import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const App = () => {
  const [locationData, setLocationData] = useState({
    latitude: null,
    longitude: null,
    city: null,
    station: null,
    pm25: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(true);

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
          pm25: data.pm25,
        });
        setLoading(false);
        updateMap(latitude, longitude);
      } catch (error) {
        console.error("Error fetching data:", error);
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
    const openAQApiKey = process.env.REACT_APP_WEATHER_API_KEY;

    const currentDate = new Date();
    const yesterdayDate = new Date(currentDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const formatDate = (date) => {
      return date.toISOString().split(".")[0] + "Z";
    };

    //fetched one record from current location.
    const aqiUrl = `https://api.openaq.org/v1/measurements?coordinates=
    ${latitude},${longitude}&parameter=pm25&radius=5000&limit=1&order_by=datetime&sort=desc&api_key=${openAQApiKey}&format=json`;

    //I am not getting any data for current date so commenting out this
    //     const aqiUrl = `https://api.openaq.org/v2/measurements?coordinates=
    // ${latitude},${longitude}&date_from=${formatDate(yesterdayDate)}&date_tp=${formatDate(tomorrowDate)}parameter=pm25&radius=5000&limit=1&order_by=datetime&sort=desc&api_key=${openAQApiKey}`;

    const response = await fetch(aqiUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      setError(false);

      return {
        city: data.results[0].city,
        station: data.results[0].location,
        pm25: data.results[0].value,
      };
    } else {
      setError(true);
      throw new Error("No data available.");
    }
  };

  const updateMap = (latitude, longitude) => {
    const map = L.map("map").setView([latitude, longitude], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    //add fetch data on click of map location
    map.on("click", async (e) => {
      const clickedLatitude = parseFloat(e.latlng.lat).toFixed(7);
      const clickedLongitude = parseFloat(e.latlng.lng).toFixed(7);
      console.log("clickedLatitude", e);

      try {
        const data = await fetchAQI(clickedLatitude, clickedLongitude);
        setLocationData({
          latitude: clickedLatitude,
          longitude: clickedLongitude,
          city: data.city,
          station: data.station,
          pm25: data.pm25,
        });
        setError(false);
      } catch (error) {
        setError(true);
        console.error("Error fetching data:", error);
      }
    });

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup("Your Location")
      .openPopup();
  };

  return (
    <div>
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <div className="loader-text">Loading...</div>
        </div>
      ) : (
        <div>
          <div id="map" className="map-container"></div>
          {!error ? (
            <div className="details-container">
              <h2>Air Quality Index (AQI)</h2>
              <p>
                <b>Latitude:</b> {locationData.latitude}
              </p>
              <p>
                <b>Longitude:</b> {locationData.longitude}
              </p>
              <p>
                <b>City: </b>
                {locationData.city}
              </p>
              <p>
                <b>Station: </b>
                {locationData.station}
              </p>
              <p>
                <b>PM2.5 levels </b>
                {locationData.pm25}
              </p>
            </div>
          ) : (
            <p class="no-data">No Data Found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
