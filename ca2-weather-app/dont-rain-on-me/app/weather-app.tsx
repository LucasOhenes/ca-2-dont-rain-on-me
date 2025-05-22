import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';

export default function WeatherApp() {
  const [location, setLocation] = useState('Dublin, Leinster, Ireland');
  const [coordinates, setCoordinates] = useState({ lat: 53.33306, lon:  -6.24889});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true); // creating element to toggle celsius/farhenheit 

  const [currentWeather, setCurrentWeather] = useState({
    temperature: null,
    condition: 'Loading...',
    humidity: null,
    windSpeed: null,
    visibility: null,
    feelsLike: null
  });

  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  const getWeatherIcon = (weatherCode) => {
  // Open-Meteo weather codes to icon mapping
  if (weatherCode >= 0 && weatherCode <= 3) {
    return weatherCode <= 1 ? 'wb-sunny' : 'cloud';
  } else if (weatherCode >= 45 && weatherCode <= 48) {
    return 'blur-on'; // Fog
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    return 'grain'; // Drizzle/Rain
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return 'ac-unit'; // Snow
  } else if (weatherCode >= 80 && weatherCode <= 82) {
    return 'grain'; // Rain showers (same as drizzle/rain)
  } else if (weatherCode >= 85 && weatherCode <= 86) {
    return 'ac-unit'; // Snow showers
  } else if (weatherCode >= 95 && weatherCode <= 99) {
    return 'flash-on'; // Thunderstorm
  }
  return 'wb-sunny';
};

  const getWeatherCondition = (weatherCode) => {
    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return conditions[weatherCode] || 'Unknown';
  };


  //Function to format temperature according to measurement unit
  const formatTemperature = (tempCelsius) => {
    if(tempCelsius === null || tempCelsius === '--') return '--°';
    return isCelsius 
    ? `${tempCelsius}°C`
    : `${Math.round((tempCelsius * 9) / 5 + 32)}°F` // if temperature is in celcius, return it, if not, use conversion expression to  convert it to fahrenheit and return that. 
  }

  // Geocoding function to get coordinates from location name
  const geocodeLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.latitude,
          lon: result.longitude,
          name: `${result.name}${result.admin1 ?`, ${result.admin1}`: ''}, ${result.country}`
        };
      }
      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Fetch weather data from Open-Meteo API
  const fetchWeatherData = async (lat, lon) => {
    try {
      setLoading(true);
      
      // Fetch current and forecast weather
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );
      
      const data = await response.json();
      
      // Update current weather
      setCurrentWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        visibility: null, // Open-Meteo doesn't provide visibility
        feelsLike: Math.round(data.current.apparent_temperature)
      });

      // Update hourly forecast (next 12 hours)
      const currentHour = new Date().getHours();
      const hourlyData = data.hourly.time.slice(0, 12).map((time, index) => {
        const hour = new Date(time).getHours();
        return {
          id: index.toString(),
          time: `${hour.toString().padStart(2, '0')}:00`,
          temp: Math.round(data.hourly.temperature_2m[index]),
          condition: getWeatherIcon(data.hourly.weather_code[index])
        };
      });
      setHourlyForecast(hourlyData);

      // Update 5-day forecast
      const dailyData = data.daily.time.map((date, index) => {
        const dayName = index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        
        return {
          id: index.toString(),
          day: dayName,
          high: Math.round(data.daily.temperature_2m_max[index]),
          low: Math.round(data.daily.temperature_2m_min[index]),
          condition: getWeatherCondition(data.daily.weather_code[index]),
          icon: getWeatherIcon(data.daily.weather_code[index])
        };
      });
      setForecast(dailyData);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Show error state
      setCurrentWeather({
        temperature: '--',
        condition: 'Unable to load weather',
        humidity: '--',
        windSpeed: '--',
        visibility: '--',
        feelsLike: '--'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCitySuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSuggestions(data.results.map(city => ({
          name: `${city.name}${city.admin1 ?`, ${city.admin1}`: ''}, ${city.country}`,
          lat: city.latitude,
          lon: city.longitude
        })));
        setNoResults(false);
      } else {
        setSuggestions([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      setSuggestions([]);
      setNoResults(true);
    }
  };

  // UPDATED: Handle suggestion selection
  const handleSuggestionSelect = async (item) => {
    // Update location data
    setLocation(item.name);
    setCoordinates({ lat: item.lat, lon: item.lon });
    
    // Save to history
    await saveSearchToHistory(item.name);
    
    // Clear UI state
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchFocused(false);
  };

  // UPDATED: Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const locationData = await geocodeLocation(searchQuery);
        setLocation(locationData.name);
        setCoordinates({ lat: locationData.lat, lon: locationData.lon });
        
        // Save to history after successful search
        await saveSearchToHistory(locationData.name);
        
        // Clear the search query and suggestions
        setSearchQuery('');
        setSuggestions([]);
        setIsSearchFocused(false);
      } catch (error) {
        console.error('Search error:', error);
        // Show error message
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle history item selection
  const handleHistorySelect = async (historyItem) => {
    try {
      setLoading(true);
      const locationData = await geocodeLocation(historyItem);
      setLocation(locationData.name);
      setCoordinates({ lat: locationData.lat, lon: locationData.lon });
      
      // Move selected item to top of history
      await saveSearchToHistory(locationData.name);
      
      // Clear UI state
      setSearchQuery('');
      setIsSearchFocused(false);
    } catch (error) {
      console.error('History selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save search to history
  const saveSearchToHistory = async (query) => {
    try {
      // Remove the query if it exists and add it to the front
      const updated = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
      setSearchHistory(updated);
      await AsyncStorage.setItem('weather_search_history', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save search:', error);
      return false;
    }
  };

  // Clear search history
  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem('weather_search_history');
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    // Fetch initial weather data for Dublin
    fetchWeatherData(coordinates.lat, coordinates.lon);
    // Load search history
    loadSearchHistory();
  }, []);

  // Fetch weather when coordinates change
  useEffect(() => {
    if (coordinates.lat && coordinates.lon) {
      fetchWeatherData(coordinates.lat, coordinates.lon);
    }
  }, [coordinates]);

  // Load search history
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('weather_search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const renderHourlyItem = ({ item }) => (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{item.time}</Text>
      <MaterialIcons 
        name={item.condition} 
        size={24} 
        color="#ffffff" 
        style={styles.hourlyIcon}
      />
      <Text style={styles.hourlyTemp}>{formatTemperature(item.temp)}</Text>
    </View>
  );

  const renderForecastItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <View style={styles.forecastLeft}>
        <MaterialIcons 
          name={item.icon} 
          size={24} 
          color="#ffffff" 
        />
        <View style={styles.forecastText}>
          <Text style={styles.forecastDay}>{item.day}</Text>
          <Text style={styles.forecastCondition}>{item.condition}</Text>
        </View>
      </View>
      <View style={styles.forecastTemps}>
        <Text style={styles.forecastHigh}>{formatTemperature(item.high)}</Text>
        <Text style={styles.forecastLow}>{formatTemperature(item.low)}</Text>
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
            <MaterialIcons name="location-on" size={24} color="#ffffff" />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor="#E3F2FD"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay so click can register
                onChangeText={(text) => {
                  setSearchQuery(text);
                  fetchCitySuggestions(text);
                }}
                onSubmitEditing={handleSearch}
              />

              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Feather name="search" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* City suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionBox}>
              {suggestions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionItem} 
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search history */}
          {isSearchFocused && searchQuery.trim() === '' && searchHistory.length > 0 && (
            <View style={styles.suggestionBox}>
              <Text style={styles.historyHeader}>Recent Searches</Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity 
                  key={`history-${index}`} 
                  style={styles.suggestionItem}
                  onPress={() => handleHistorySelect(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.suggestionItem, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }]}
                onPress={clearSearchHistory}
              >
                <Text style={[styles.suggestionText, { color: '#ffaaaa' }]}>Clear Search History</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No results message */}
          {noResults && (
            <Text style={styles.noResultText}>No such city found.</Text>
          )}

          {/* Current Location */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{location}</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Current Weather */}
          <View style={styles.currentWeatherContainer}>
            <MaterialIcons 
              name={currentWeather.condition && currentWeather.temperature ? 
                    getWeatherIcon(2) : 'cloud'} 
              size={80} 
              color="#ffffff" 
              style={styles.mainWeatherIcon} 
            />
            <Text style={styles.currentTemp}>
              {loading ? 'Loading...' : formatTemperature(currentWeather.temperature)}
            </Text>
            <Text style={styles.currentCondition}>{currentWeather.condition}</Text>
            <Text style={styles.feelsLike}>
              {currentWeather.feelsLike ? `Feels like ${formatTemperature(currentWeather.feelsLike)}` : 'Feels like --°'}
            </Text>
          </View>

          {/* celsius/fahrenheit toggle button*/}
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity 
              style={[styles.unitButton, isCelsius && styles.unitButtonActive]} 
              onPress={() => setIsCelsius(true)}
            >
              <Text style={[styles.unitText, isCelsius ? {color: '#2E6DA4'} : {color: '#ffffff'}]}>°C</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.unitButton, !isCelsius && styles.unitButtonActive]} 
              onPress={() => setIsCelsius(false)}
            >
              <Text style={[styles.unitText, !isCelsius ? {color: '#2E6DA4'} : {color: '#ffffff'}]}>°F</Text>
            </TouchableOpacity>
          </View>

          {/* Weather Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Feather name="wind" size={24} color="#ffffff" />
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{currentWeather.windSpeed} km/h</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="droplet" size={24} color="#ffffff" />
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="eye" size={24} color="#ffffff" />
              <Text style={styles.detailLabel}>Visibility</Text>
              <Text style={styles.detailValue}>{currentWeather.visibility || '--'} km</Text>
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
  locationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
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
  suggestionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 10,
    zIndex: 1,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 1,
  },
  suggestionText: {
    color: '#ffffff',
  },
  noResultText: {
    color: '#ffdddd',
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: -10,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
  },
  unitButtonActive: {
    backgroundColor: '#ffffff',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyHeader: {
    color: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    fontSize: 12,
    opacity: 0.8,
  },
});