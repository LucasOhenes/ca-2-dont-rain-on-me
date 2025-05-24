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

// Type definitions
interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

interface CurrentWeather {
  temperature: number | null;
  condition: string;
  humidity: number | null;
  windSpeed: number | null;
  feelsLike: number | null;
}

interface HourlyForecastItem {
  id: string;
  time: string;
  temp: number;
  condition: string;
}

interface DailyForecastItem {
  id: string;
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export default function WeatherApp() {
  // ----> STATE MANAGEMENT
  
  const currentHour = new Date().getHours(); 
  const isDayTime = currentHour >= 6 && currentHour < 18; // this function identify when is day and when is night and change the backgorund
  const backgroundColors = isDayTime
  ? ['#4A90E2', '#357ABD', '#2E6DA4']  // Light colours (day)
  : ['#2C003E', '#1A0033', '#0D0026']; // Dark colours (night)

  // Location and coordinates state - Dublin is the default location
  const [location, setLocation] = useState<string>('Dublin, Leinster, Ireland');
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 53.33306, lon: -6.24889});
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState<string>(''); //current search input
  const [searchHistory, setSearchHistory] = useState<LocationData[]>([]); //stored search history from AsyncStorage
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false); //controls when to show history/suggestions
  const [suggestions, setSuggestions] = useState<LocationData[]>([]); //Live city suggestions from geocoding API
  const [noResults, setNoResults] = useState<boolean>(false); //shows "no results" message
  
  // App state
  const [loading, setLoading] = useState<boolean>(false); //Loading indicator
  const [isCelsius, setIsCelsius] = useState<boolean>(true); //Temperature unit toggle (°C or °F)

  // Weather data state - current conditions
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>({
    temperature: null,
    condition: 'Loading...',
    humidity: null,
    windSpeed: null,
    feelsLike: null
  });

  // Weather forecast data
  const [forecast, setForecast] = useState<DailyForecastItem[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);

  // WEATHER CODE MAPPING TO ICONS AND HUMAN-FRIENDLY DESCRIPTIONS
 
  /**
   * Maps Open-Meteo weather codes to Material Icons
   * Weather codes reference: https://open-meteo.com/en/docs
   */
  const getWeatherIcon = (weatherCode: number): string => {
    if (weatherCode >= 0 && weatherCode <= 3) {
      return weatherCode <= 1 ? 'wb-sunny' : 'cloud'; //clear to partially cloudy
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      return 'blur-on'; //fog conditions
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      return 'grain'; //rain conditions (drizzle to heavy rain)
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      return 'ac-unit'; //snow conditions
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      return 'grain'; //rain showers
    } else if (weatherCode >= 85 && weatherCode <= 86) {
      return 'ac-unit';  // snow showers
    } else if (weatherCode >= 95 && weatherCode <= 99) {
      return 'flash-on'; // Thunderstorm conditions
    }
    return 'wb-sunny'; //default fallback
  };

  /**
   * Converts Open-Meteo weather codes to human-friendly descriptions
   */
  const getWeatherCondition = (weatherCode: number): string => {
    const conditions: { [key: number]: string } = {
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

  /**
   * Formats temperature based on user's unit preference (Celsius/Fahrenheit)
   * Handles null values and converts between units
   */
  const formatTemperature = (tempCelsius: number | null | string): string => {
    if(tempCelsius === null || tempCelsius === '--') return '--°';
    const temp = typeof tempCelsius === 'string' ? parseFloat(tempCelsius) : tempCelsius;
    return isCelsius 
      ? `${temp}°C`
      : `${Math.round((temp * 9) / 5 + 32)}°F`;
  }

  //------> API INTEGRATION:
  
  /**
   * Geocodes a location name to coordinates using Open-Meteo Geocoding API
   * Returns formatted location object with lat/lon and display name
   */
  const geocodeLocation = async (locationName: string): Promise<LocationData> => {
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

  /**
   * Fetches weather data from Open-Meteo API
   * Gets current weather, hourly forecast (12 hours), and daily forecast (5 days)
   */
  const fetchWeatherData = async (lat: number, lon: number): Promise<void> => {
    try {
      setLoading(true);
      
       // Comprehensive weather data request - current, hourly, and daily forecasts
      const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5&forecast_hours=12`
      );
      
      const data = await response.json();
      
      //Process current weather data
      setCurrentWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition: getWeatherCondition(data.current.weather_code),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        feelsLike: Math.round(data.current.apparent_temperature)
      });

      //Process hourly forecast data (next 12 hours)
      const hourlyData: HourlyForecastItem[] = data.hourly.time.slice(0, 12).map((time: string, index: number) => {
        const hour = new Date(time).getHours();
        return {
          id: index.toString(),
          time: `${hour.toString().padStart(2, '0')}:00`,
          temp: Math.round(data.hourly.temperature_2m[index]),
          condition: getWeatherIcon(data.hourly.weather_code[index])
        };
      });
      setHourlyForecast(hourlyData);

       // Process daily forecast data (5 days)
      const dailyData: DailyForecastItem[] = data.daily.time.map((date: string, index: number) => {
        
        // Format day names - Today, Tomorrow, then weekday names
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
      //set fallback values when API fails
      setCurrentWeather({
        temperature: null,
        condition: 'Unable to load weather',
        humidity: null,
        windSpeed: null,
        feelsLike: null
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches city suggestions for search autocomplete
   * Debounced through the search input's onChange handler
   */
  const fetchCitySuggestions = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    try {
      // Get up to 5 city suggestions from geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {

         // Format suggestions with full location names
        setSuggestions(data.results.map((city: any) => ({
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

  // SEARCH AND HISTORY HANDLERS
  
  /**
   * Handles selection of a city suggestion from the dropdown
   * Updates location, coordinates, and saves to search history
   */
  const handleSuggestionSelect = async (item: LocationData): Promise<void> => {
    setLocation(item.name);
    setCoordinates({ lat: item.lat, lon: item.lon });
    // Save complete location data to history (includes coordinates for faster access)
    await saveSearchToHistory({
      name: item.name,
      lat: item.lat,
      lon: item.lon
    });

        // Clear search UI state
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchFocused(false);
    setNoResults(false);
  };

  /**
   * Handles manual search submission (when user presses enter or search button)
   * Geocodes the search query and updates location
   */
  const handleSearch = async (): Promise<void> => {
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const locationData = await geocodeLocation(searchQuery);
        setLocation(locationData.name);
        setCoordinates({ lat: locationData.lat, lon: locationData.lon });
        

        // Save complete location data to history
        await saveSearchToHistory({
          name: locationData.name,
          lat: locationData.lat,
          lon: locationData.lon
        });
        // Clear search UI state
        setSearchQuery('');
        setSuggestions([]);
        setIsSearchFocused(false);
        setNoResults(false);
      } catch (error) {
        console.error('Search error:', error);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handles selection from search history
   * Uses stored coordinates to avoid re-geocoding
   */
  const handleHistorySelect = async (historyItem: LocationData): Promise<void> => {
    try {
      setLoading(true);
      
      // Use stored coordinates directly - no need to geocode again
      setLocation(historyItem.name);
      setCoordinates({ lat: historyItem.lat, lon: historyItem.lon });
      

      // Move selected item to top of history (most recently used)
      await saveSearchToHistory(historyItem);
      
       // Clear search UI state
      setSearchQuery('');
      setIsSearchFocused(false);
      setNoResults(false);
    } catch (error) {
      console.error('History selection error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ----> PERSISTENT STORAGE FUNCTIONS
  
  /**
   * Saves the locationdata to search history in asyncStorage
   * Maintains a maximum of 5 recent searches, with most recent first
   */
  const saveSearchToHistory = async (locationData: LocationData): Promise<boolean> => {
    try {

         // Remove existing entry and add to front, limit to 5 items
      const updated = [
        locationData, 
        ...searchHistory.filter(item => item.name !== locationData.name)
      ].slice(0, 5);
      
      setSearchHistory(updated);
      await AsyncStorage.setItem('weather_search_history', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save search:', error);
      return false;
    }
  };

  /**
   * Clears all search history from storage and state
   */
  const clearSearchHistory = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('weather_search_history');
      setSearchHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  //------> EFFECTS AND INITIALISATION
  
  useEffect(() => {
    fetchWeatherData(coordinates.lat, coordinates.lon);
    loadSearchHistory();
  }, []);

   // Fetch new weather data whenever coordinates change
  useEffect(() => {
    if (coordinates.lat && coordinates.lon) {
      fetchWeatherData(coordinates.lat, coordinates.lon);
    }
  }, [coordinates]);

  /**
   * Loads search history from AsyncStorage on app startup
   * Handles backward compatibility with old string-only format
   */
  const loadSearchHistory = async (): Promise<void> => {
    try {
      const history = await AsyncStorage.getItem('weather_search_history');
      if (history) {
        const parsedHistory = JSON.parse(history);

        // Handle both old format (strings) and new format (objects with coordinates)
        const formattedHistory = parsedHistory.map((item: any) => {
          if (typeof item === 'string') {
            
          // Convert old format to new format (coordinates will be 0 until first use)
            return { name: item, lat: 0, lon: 0 };
          }
          return item;
        });
        setSearchHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  // ------> FLATLIST RENDER FUNCTIONS
  
  /**
   * Renders individual hourly forecast items
   * Shows time, weather icon, and temperature
   */
  const renderHourlyItem = ({ item }: { item: HourlyForecastItem }) => (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{item.time}</Text>
      <MaterialIcons 
        name={item.condition as any} 
        size={24} 
        color="#ffffff" 
        style={styles.hourlyIcon}
      />
      <Text style={styles.hourlyTemp}>{formatTemperature(item.temp)}</Text>
    </View>
  );

  /**
   * Renders individual daily forecast items
   * Shows day, weather icon, condition, and high/low temperatures
   */
  const renderForecastItem = ({ item }: { item: DailyForecastItem }) => (
    <View style={styles.forecastItem}>
      <View style={styles.forecastLeft}>
        <MaterialIcons 
          name={item.icon as any} 
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

  // ----> MAIN COMPONENT RENDER

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
        {/* Main gradient background */}
      <LinearGradient
        colors={backgroundColors}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
           {/* App header with title and location icon */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Don't Rain On Me</Text>
          </View>

          {/* Search bar section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor="#E3F2FD"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delayed blur to allow click events on suggestions to register
                  setTimeout(() => setIsSearchFocused(false), 300);
                }}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  fetchCitySuggestions(text); // Live search suggestions functionality
                  setNoResults(false);
                }}
                onSubmitEditing={handleSearch}
              />

              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Feather name="search" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>


          {/* City suggestions dropdown - shows when typing */}      
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

           {/* Search history dropdown - shows when focused with empty search */}
          {isSearchFocused && searchQuery.trim() === '' && searchHistory.length > 0 && (
            <View style={styles.suggestionBox}>
              <Text style={styles.historyHeader}>Recent Searches</Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity 
                  key={`history-${index}`} 
                  style={styles.suggestionItem}
                  onPress={() => handleHistorySelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
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


           {/* Current location and date display */}
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
          
          {/* Main current weather display */}
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

          {/* Temperature unit toggle (Celsius/Fahrenheit) */}      
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

          {/* Weather details section (wind, humidity) */}      
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
          </View>

          {/* Hourly forecast section */}      
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


          {/* 5-day forecast section */}      
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

// ----> STYLESHEET DEFINITIONS

const styles = StyleSheet.create({
  // Main container and layout styles
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header section styles
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
  
  // Search bar styles
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
  
  // Location display styles
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
  
  // Main current weather display styles
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
  
  // Weather details section styles
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
  
  // Forecast section container styles
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
  
  // Hourly forecast styles
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
  
  // Daily forecast styles
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
  
  // Search suggestions and history styles
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