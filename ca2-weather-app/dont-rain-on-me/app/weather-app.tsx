import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';

export default function WeatherApp() {
  const [location, setLocation] = useState('New York, NY');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map Open-Meteo Weather Codes to Human-Readable Text
  const getConditionText = (code) => {
    const weatherMap = {
      0: 'Clear Sky',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Drizzle: Light',
      53: 'Drizzle: Moderate',
      55: 'Drizzle: Dense',
      61: 'Rain: Light',
      63: 'Rain: Moderate',
      65: 'Rain: Heavy',
      71: 'Snow: Light',
      73: 'Snow: Moderate',
      75: 'Snow: Heavy',
      80: 'Rain Showers: Light',
      81: 'Rain Showers: Moderate',
      82: 'Rain Showers: Violent',
      95: 'Thunderstorm: Light or Moderate',
      99: 'Thunderstorm: Heavy Hail',
    };
    return weatherMap[code] || 'Unknown';
  };

  // Map Conditions to Icons
  const getWeatherIcon = (condition) => {
    switch (condition.toLowerCase()) {
      case 'clear sky': return 'wb-sunny';
      case 'mainly clear': return 'wb-sunny';
      case 'partly cloudy': return 'cloud-queue';
      case 'overcast': return 'cloud';
      case 'fog': return 'blur-on';
      case 'rain': return 'grain';
      case 'drizzle': return 'grain';
      case 'snow': return 'ac-unit';
      case 'thunderstorm': return 'flash-on';
      default: return 'wb-sunny';
    }
  };

  // Fetch Weather Data from Open-Meteo API
  const fetchWeatherData = async (location) => {
    setLoading(true);
    try {
      // Step 1: Geocoding to get Latitude and Longitude
      const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.length === 0) {
        alert("Location not found.");
        setLoading(false);
        return;
      }

      const { lat, lon, display_name } = geocodeData[0];

      // Step 2: Fetch weather data
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`);
      const data = await response.json();

      // Step 3: Update State
      setLocation(display_name);
      setCurrentWeather({
        temperature: data.current_weather.temperature,
        condition: getConditionText(data.current_weather.weathercode),
        windSpeed: data.current_weather.windspeed,
        visibility: data.current_weather.visibility ?? "N/A",
        feelsLike: data.current_weather.temperature,
        humidity: "N/A",
      });

      setForecast(data.daily.time.map((date, index) => ({
        id: index.toString(),
        day: index === 0 ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        high: data.daily.temperature_2m_max[index],
        low: data.daily.temperature_2m_min[index],
        condition: getConditionText(data.daily.weathercode[index]),
        icon: getWeatherIcon(getConditionText(data.daily.weathercode[index])),
      })));
    } catch (error) {
      alert(`Error fetching weather data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Event
  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery);
      setSearchQuery('');
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchWeatherData(location);
  }, []);

  // Render Forecast Items
  const renderForecastItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <View style={styles.forecastLeft}>
        <MaterialIcons name={item.icon} size={24} color="#ffffff" />
        <View style={styles.forecastText}>
          <Text style={styles.forecastDay}>{item.day}</Text>
          <Text style={styles.forecastCondition}>{item.condition}</Text>
        </View>
      </View>
      <View style={styles.forecastTemps}>
        <Text style={styles.forecastHigh}>{item.high}°</Text>
        <Text style={styles.forecastLow}>{item.low}°</Text>
      </View>
    </View>
  );

  // Main Render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradient}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Weather App</Text>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor="#E3F2FD"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : currentWeather ? (
            <View style={styles.currentWeatherContainer}>
              <MaterialIcons name={getWeatherIcon(currentWeather.condition)} size={80} color="#ffffff" />
              <Text style={styles.currentTemp}>{currentWeather.temperature}°</Text>
              <Text style={styles.currentCondition}>{currentWeather.condition}</Text>
              <Text style={styles.feelsLike}>Feels like {currentWeather.feelsLike}°</Text>
            </View>
          ) : null}
          <FlatList
            data={forecast}
            renderItem={renderForecastItem}
            keyExtractor={(item) => item.id}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
  searchContainer: { margin: 20 },
  searchInput: { backgroundColor: '#ffffff30', color: '#ffffff', padding: 10, borderRadius: 10 },
  currentWeatherContainer: { alignItems: 'center', marginVertical: 20 },
  currentTemp: { fontSize: 64, color: '#ffffff' },
  currentCondition: { fontSize: 18, color: '#E3F2FD' },
  feelsLike: { fontSize: 14, color: '#E3F2FD' },
  forecastItem: { flexDirection: 'row', justifyContent: 'space-between', margin: 10 },
  forecastDay: { fontSize: 18, color: '#ffffff' },
  forecastCondition: { color: '#E3F2FD' },
  forecastHigh: { fontSize: 16, color: '#ffffff' },
  forecastLow: { fontSize: 16, color: '#B0BEC5' },
});
