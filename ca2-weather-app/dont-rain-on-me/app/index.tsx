import React from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
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
      
        <Link href="/weather-app" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>🌐 Search for a City</Text>
          </Pressable>
        </Link>
        
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,                      // fill the entire screen
    justifyContent: 'center',     // center vertically
    alignItems: 'center',         // center horizontally
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
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
