import React from 'react';
import { View, Text, Button, StyleSheet, ImageBackground} from 'react-native';
import { Link } from 'expo-router';

const HomeScreen = () => {
  return (

    <ImageBackground 
      source={require('./beyonce-in-the-rain.png')} 
      style={styles.background}
      resizeMode="cover"
    >
    <View style={styles.container}>
      <Text style={styles.title}>Don't Rain on Me ☀️</Text>
      <Text style={styles.subtitle}>Your personal weather assistant, anywhere you go.</Text>
      <Link href="/weather-app">
        <Button title="🌐 Search for a City" />
      </Link>
      
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,                // fill the entire screen
    justifyContent: 'center', // center vertically
    alignItems: 'center',     // center horizontally
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
});

export default HomeScreen;