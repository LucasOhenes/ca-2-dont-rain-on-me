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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';

export default function WeatherApp() {
  const [location, setLocation] = useState('New York, NY');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeather, setCurrentWeather] = useState({
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 8,
    visibility: 10,
    feelsLike: 24
  });

  const [forecast, setForecast] = useState([
    { id: '1', day: 'Today', high: 25, low: 18, condition: 'Partly Cloudy', icon: 'cloud' },
    { id: '2', day: 'Tomorrow', high: 28, low: 20, condition: 'Sunny', icon: 'sun' },
    { id: '3', day: 'Wednesday', high: 23, low: 16, condition: 'Rainy', icon: 'rain' },
    { id: '4', day: 'Thursday', high: 26, low: 19, condition: 'Sunny', icon: 'sun' },
    { id: '5', day: 'Friday', high: 24, low: 17, condition: 'Partly Cloudy', icon: 'cloud' },
  ]);

  const [hourlyForecast] = useState([
    { id: '1', time: '12:00', temp: 22, condition: 'cloud' },
    { id: '2', time: '13:00', temp: 24, condition: 'sun' },
    { id: '3', time: '14:00', temp: 26, condition: 'sun' },
    { id: '4', time: '15:00', temp: 25, condition: 'cloud' },
    { id: '5', time: '16:00', temp: 23, condition: 'rain' },
    { id: '6', time: '17:00', temp: 21, condition: 'rain' },
  ]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sun':
        return 'wb-sunny';
      case 'cloud':
        return 'cloud';
      case 'rain':
        return 'grain';
      default:
        return 'wb-sunny';
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(searchQuery);
      setSearchQuery('');
      // Here you would integrate with your weather API
      // fetchWeatherData(searchQuery);
    }
  };

  // API integration function (implement this with your weather API)
  const fetchWeatherData = async (location) => {
    try {
      // Example API call structure
      // const response = await fetch(https://api.weatherapi.com/v1/forecast.json?key=YOUR_API_KEY&q=${location}&days=5&aqi=no&alerts=no);
      // const data = await response.json();
      // setCurrentWeather({
      //   temperature: data.current.temp_c,
      //   condition: data.current.condition.text,
      //   humidity: data.current.humidity,
      //   windSpeed: data.current.wind_kph,
      //   visibility: data.current.vis_km,
      //   feelsLike: data.current.feelslike_c
      // });
      // setForecast(data.forecast.forecastday.map((day, index) => ({
      //   id: index.toString(),
      //   day: index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
      //   high: Math.round(day.day.maxtemp_c),
      //   low: Math.round(day.day.mintemp_c),
      //   condition: day.day.condition.text,
      //   icon: getConditionIcon(day.day.condition.text)
      // })));
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  useEffect(() => {
    // Fetch initial weather data
    // fetchWeatherData(location);
  }, []);

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
            <MaterialIcons name="cloud" size={80} color="#ffffff" style={styles.mainWeatherIcon} />
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
}); 