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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function WeatherApp() {
  const [location, setLocation] = useState('Loading location...');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeather, setCurrentWeather] = useState({
    temperature: 0,
    condition: 'Clear',
    humidity: 0,
    windSpeed: 0,
    visibility: 10,
    feelsLike: 0,
  });
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user's current location on first load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Fetch weather data whenever coordinates change
  useEffect(() => {
    if (coordinates.lat !== null && coordinates.lon !== null) {
      fetchWeatherData(coordinates.lat, coordinates.lon);
    }
  }, [coordinates]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      // Request permission for location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        // Default to New York if permission denied
        searchLocation('New York');
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get location name
      const locationDetails = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (locationDetails && locationDetails.length > 0) {
        const { city, region, country } = locationDetails[0];
        const locationName = city 
          ? `${city}${region ? `, ${region}` : ''}`
          : country || 'Current Location';
        
        setLocation(locationName);
        setCoordinates({ lat: latitude, lon: longitude });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to retrieve your location');
      // Default to New York
      searchLocation('New York');
    }
  };

  const searchLocation = async (query) => {
    setIsLoading(true);
    try {
      const geocodeResult = await Location.geocodeAsync(query);
      
      if (geocodeResult && geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        
        // Get location name for the coordinates
        const locationDetails = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        if (locationDetails && locationDetails.length > 0) {
          const { city, region, country } = locationDetails[0];
          const locationName = city 
            ? `${city}${region ? `, ${region}` : ''}`
            : country || query;
          
          setLocation(locationName);
          setCoordinates({ lat: latitude, lon: longitude });
        } else {
          setLocation(query);
          setCoordinates({ lat: latitude, lon: longitude });
        }
      } else {
        Alert.alert('Location not found', 'Please try a different location.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Unable to find this location');
      setIsLoading(false);
    }
  };

  const fetchWeatherData = async (latitude, longitude) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,apparent_temperature&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Weather data not available');
      }
      
      const data = await response.json();
      
      // Update current weather
      setCurrentWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition: getConditionFromCode(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        visibility: 10, // Not provided by Open-Meteo in free tier
        feelsLike: Math.round(data.current.apparent_temperature)
      });
      
      // Update hourly forecast (next 24 hours)
      const now = new Date();
      const currentHour = now.getHours();
      
      const hourlyData = data.hourly.time
        .slice(currentHour, currentHour + 24)
        .map((time, index) => ({
          id: String(index),
          time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(data.hourly.temperature_2m[currentHour + index]),
          condition: getIconFromCode(data.hourly.weather_code[currentHour + index]),
          precipitation: data.hourly.precipitation_probability?.[currentHour + index] || 0
        }))
        .slice(0, 12); // Limit to next 12 hours
      
      setHourlyForecast(hourlyData);
      
      // Update 5-day forecast
      const forecastData = data.daily.time.map((time, index) => ({
        id: String(index),
        day: getDayLabel(index),
        high: Math.round(data.daily.temperature_2m_max[index]),
        low: Math.round(data.daily.temperature_2m_min[index]),
        condition: getConditionFromCode(data.daily.weather_code[index]),
        icon: getIconFromCode(data.daily.weather_code[index])
      })).slice(0, 5); // Ensure exactly 5 days
      
      setForecast(forecastData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Unable to fetch weather data. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchLocation(searchQuery);
      setSearchQuery('');
    }
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sun':
        return 'wb-sunny';
      case 'cloud':
        return 'cloud';
      case 'rain':
        return 'grain';
      case 'storm':
        return 'flash-on';
      case 'snow':
        return 'ac-unit';
      default:
        return 'wb-sunny';
    }
  };

  const getConditionFromCode = (code) => {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    if (code === 0) return 'Clear Sky';
    if (code === 1) return 'Mainly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  };
  
  const getIconFromCode = (code) => {
    if (code === 0 || code === 1) return 'sun';
    if (code >= 2 && code <= 3) return 'cloud';
    if (code >= 4 && code <= 49) return 'cloud'; // fog
    if (code >= 50 && code <= 69) return 'rain'; // drizzle & rain
    if (code >= 70 && code <= 79) return 'snow';
    if (code >= 80 && code <= 99) return 'storm'; // thunderstorm
    return 'cloud';
  };
  
  const getDayLabel = (index) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const renderHourlyItem = ({ item }) => (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{item.time}</Text>
      <MaterialIcons 
        name={getWeatherIcon(item.condition)} 
        size={24} 
        color="#ffffff" 
        style={styles.hourlyIcon}
      />
      <Text style={styles.hourlyTemp}>{item.temp}°</Text>
      {item.precipitation > 0 && (
        <Text style={styles.precipChance}>{item.precipitation}%</Text>
      )}
    </View>
  );

  const renderForecastItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <View style={styles.forecastLeft}>
        <MaterialIcons 
          name={getWeatherIcon(item.icon)} 
          size={24} 
          color="#ffffff" 
        />
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
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E6DA4']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Weather</Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <MaterialIcons name="my-location" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor="#E3F2FD"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Feather name="search" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Location */}
          <View style={styles.locationContainer}>
            <View style={styles.locationNameContainer}>
              <MaterialIcons name="location-on" size={18} color="#ffffff" style={styles.locationIcon} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading weather data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color="#ffffff" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => coordinates.lat && fetchWeatherData(coordinates.lat, coordinates.lon)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Current Weather */}
              <View style={styles.currentWeatherContainer}>
                <MaterialIcons 
                  name={getWeatherIcon(getIconFromCode(currentWeather.condition))} 
                  size={80} 
                  color="#ffffff" 
                  style={styles.mainWeatherIcon} 
                />
                <Text style={styles.currentTemp}>{currentWeather.temperature}°</Text>
                <Text style={styles.currentCondition}>{currentWeather.condition}</Text>
                <Text style={styles.feelsLike}>Feels like {currentWeather.feelsLike}°</Text>
              </View>

              {/* Weather Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Feather name="wind" size={24} color="#ffffff" />
                  <Text style={styles.detailLabel}>Wind</Text>
                  <Text style={styles.detailValue}>{currentWeather.windSpeed} km/h</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="droplets" size={24} color="#ffffff" />
                  <Text style={styles.detailLabel}>Humidity</Text>
                  <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="eye" size={24} color="#ffffff" />
                  <Text style={styles.detailLabel}>Visibility</Text>
                  <Text style={styles.detailValue}>{currentWeather.visibility} km</Text>
                </View>
              </View>

              {/* Hourly Forecast */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                <View style={styles.hourlyContainer}>
                  <FlatList
                    data={hourlyForecast}
                    renderItem={renderHourlyItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hourlyList}
                  />
                </View>
              </View>

              {/* 5-Day Forecast */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>5-Day Forecast</Text>
                <View style={styles.forecastContainer}>
                  <FlatList
                    data={forecast}
                    renderItem={renderForecastItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  searchButton: {
    padding: 5,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  locationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationIcon: {
    marginRight: 5,
  },
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  currentWeatherContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainWeatherIcon: {
    marginBottom: 10,
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: '200',
    color: '#ffffff',
    marginBottom: 5,
  },
  currentCondition: {
    fontSize: 18,
    color: '#E3F2FD',
    marginBottom: 5,
  },
  feelsLike: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  hourlyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 15,
  },
  hourlyList: {
    paddingHorizontal: 5,
  },
  hourlyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 50,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 8,
  },
  hourlyIcon: {
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  precipChance: {
    fontSize: 12,
    color: '#E3F2FD',
    marginTop: 4,
  },
  forecastContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 15,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  forecastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forecastText: {
    marginLeft: 12,
  },
  forecastDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  forecastCondition: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastHigh: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  forecastLow: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});