 import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { useSearchParams } from 'expo-router';

const WeatherDetailsScreen = () => {
  const { city } = useSearchParams();
  const [weather, setWeather] = useState(null);

  const getWeather = async () => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY&units=metric`);
      setWeather(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (city) getWeather();
  }, [city]);

  return (
    <View style={styles.container}>
      {weather ? (
        <>
          <Text style={styles.title}>{weather.name}</Text>
          <Text>Temperature: {weather.main.temp}°C</Text>
          <Text>Min: {weather.main.temp_min}°C | Max: {weather.main.temp_max}°C</Text>
          <Text>Condition: {weather.weather[0].description}</Text>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default WeatherDetailsScreen;
