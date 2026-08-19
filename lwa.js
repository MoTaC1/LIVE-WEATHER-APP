const homeSearchButton = document.getElementById("go-to-search-btn");
const homeCityInput = document.getElementById("home-city-input");
const celsiusButton = document.getElementById("celsius-btn");
const fahrenheitButton = document.getElementById("fahrenheit-btn");
const locationButton = document.getElementById("location-btn");
const seacrhCityButton = document.getElementById("search-city-btn");
const citySearchInput = document.getElementById("city-search-input");
const seacrhAnotherCityButton = document.getElementById("result-search-another-city-btn");
const searchBackButton = document.getElementById("search-back-btn");
const retryButton = document.getElementById("retry-btn");
const saveFavoriteButton = document.getElementById("save-favorite-btn");
const locationList = document.getElementById("location-list");

let selectedUnit = "celsius";
let currentTemperature = null;
let currentCity = "";

console.log("currentCity value:", typeof currentCity);
saveFavoriteButton.addEventListener("click", function () {
    let favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    if (!favorites.includes(currentCity)) {
        favorites.push(currentCity);
    }
    localStorage.setItem("favoriteCities", JSON.stringify(favorites));
    console.log("Favorite cities saved:", favorites);
});
homeSearchButton.addEventListener("click", function () {
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("error-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("search-screen").style.display = "flex";
})
celsiusButton.addEventListener("click", function () {
    celsiusButton.classList.add("selected");
    fahrenheitButton.classList.remove("selected");
    selectedUnit = "celsius";
    console.log("Temperature when Celsius clicked:", currentTemperature);
    console.log("Selected unit:", selectedUnit);
    updateTemperatureDisplay();
});
fahrenheitButton.addEventListener("click", function () {
    fahrenheitButton.classList.add("selected");
    celsiusButton.classList.remove("selected");
    selectedUnit = "fahrenheit";
    console.log("Temperature when Fahrenheit clicked:", currentTemperature);
    console.log("Selected unit:", selectedUnit);
    updateTemperatureDisplay();
});
locationButton.addEventListener("click", function () {
    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json()
            currentCity = data.city || data.locality || data.principalSubdivision;
            getWeather(latitude, longitude);
        },
        function (error) {
            console.log("Unable to get your location.");
        }
    );
});
seacrhCityButton.addEventListener ("click", function () {
    const city = citySearchInput.value.trim();
    if (city === "") {
        return;
    }
    getCoordinates(city)
})
seacrhAnotherCityButton.addEventListener ("click", function () {
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("error-screen").style.display = "none";
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("search-screen").style.display = "flex";
    displayFavoriteCity();
})
searchBackButton.addEventListener("click", function () {
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("error-screen").style.display = "none";
    document.getElementById("search-screen").style.display = "none";
    document.getElementById("home-screen").style.display = "flex";   
})
retryButton.addEventListener("click", function () {
    document.getElementById("result-screen").style.display = "none";
    document.getElementById("error-screen").style.display = "none";
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("search-screen").style.display = "flex";
    displayFavoriteCity();
})


async function getCoordinates(city) {
    currentCity = city;
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        document.getElementById("home-screen").style.display = "none";
        document.getElementById("search-screen").style.display = "none";
        document.getElementById("result-screen").style.display = "none";
        document.getElementById("error-screen").style.display = "flex";
        return;
    }
    const latitude = data.results[0].latitude;
    const longitude = data.results[0].longitude;
    console.log("Latitude:", latitude)
    console.log("Longitude:", longitude)
    getWeather(latitude, longitude);
}
async function getWeather(latitude, longitude) {
    const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&forecast_days=7&timezone=auto`
);
    const data = await response.json();
    const forecastContainer = document.getElementById("forecast-container");
forecastContainer.innerHTML = "";
for (let i = 0; i < 7; i++) {
    const date = new Date(data.daily.time[i]);
    const dayName = date.toLocaleDateString("en-US", {
        weekday: "short"
    });
    const maxTemperature = Math.round(data.daily.temperature_2m_max[i]);
    const minTemperature = Math.round(data.daily.temperature_2m_min[i]);
    const weatherCode = data.daily.weather_code[i];
    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
        <span class="forecast-day">${dayName}</span>
        <span class="forecast-icon">${getWeatherEmoji(weatherCode)}</span>
        <span class="forecast-temperature">${maxTemperature}°C / ${minTemperature}°C</span>
    `;
    forecastContainer.appendChild(forecastItem);
}
    currentTemperature = data.current.temperature_2m;
    document.getElementById("result-city").textContent = currentCity;
    document.getElementById("current-weather-icon").textContent = getWeatherEmoji(data.current.weather_code);
    console.log("Current weather data:", data.current);
    console.log("Temperature received:", currentTemperature);
    selectedUnit = "celsius";
    updateTemperatureDisplay();
    document.getElementById("humidity-value").textContent = data.current.relative_humidity_2m + "%";
    document.getElementById("wind-speed-value").textContent = data.current.wind_speed_10m + "km/h";
    document.getElementById("rain-probability-value").textContent = data.daily.precipitation_probability_max[0];
    const weatherDescription = getWeatherDescription(data.current.weather_code);
    document.getElementById("weather-condition").textContent = weatherDescription;
    document.getElementById("search-screen").style.display = "none";
    document.getElementById("error-screen").style.display = "none";
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "flex";
}
function updateTemperatureDisplay() {
    const temperatureElement = document.getElementById("current-temperature");
    if (selectedUnit === "celsius") {
        temperatureElement.textContent = currentTemperature.toFixed(1) + "°C"; 
    } else {
        const fahrenheit = (currentTemperature * 9/5) + 32;
        console.log("Fahrenheit calculated:", fahrenheit);
        temperatureElement.textContent = fahrenheit.toFixed(1) + "°F"; 
    }
}
function getWeatherDescription(weatherCode) {
    const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2:"Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };
    return weatherDescriptions[weatherCode] || "Unknown";
}
function displayFavoriteCity() {
    const favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];
    locationList.textContent = "";
     favorites.forEach(function (city) {
        const row = document.createElement("div");
        row.className = "favorite-row";
        const favoriteButton = document.createElement("button");
        favoriteButton.textContent = city;
        favoriteButton.addEventListener("click", function () {
            getCoordinates(city);
        });
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌";
        deleteButton.addEventListener("click", function () {
            const updatedFavorites = favorites.filter(function (favorite) {
                return favorite !== city;
            });
            localStorage.setItem(
                "favoriteCities",
                JSON.stringify(updatedFavorites)
            );
            displayFavoriteCity();
        });
        row.appendChild(favoriteButton);
        row.appendChild(deleteButton);
        locationList.appendChild(row);
    });
}
function getWeatherEmoji(code) {
    if (code === 0) return "🌞";
    if (code === 1 || code === 2) return "⛅";
    if (code === 3) return "☁";
    if (code >= 45 && code <= 48) return "";
    if (code >= 51 && code <= 57) return "🌦";
    if (code >= 61 && code <= 67) return "🌧";
    if (code >= 71 && code <= 77) return "❄";
    if (code >= 80 && code <= 82) return "🌦";
    if (code >= 85 && code <= 86) return "🌧";
    if (code >= 95) return "⛈";
    return "⛅";
}
displayFavoriteCity();