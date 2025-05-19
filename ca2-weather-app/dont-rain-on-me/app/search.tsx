import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const router = useRouter();

  const searchCity = async () => {
    try {
      const response = await axios.get(`https://api.api-ninjas.com/v1/city?name=${query}`, {
        headers: {
          'X-Api-Key': 'YOUR_API_KEY' // Replace with your actual API Key
        }
      });
      setResults(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search for a city..."
        style={styles.input}
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={searchCity} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/weather-details?city=${item.name}`)}
            style={styles.cityButton}
          >
            <Text>{item.name}, {item.country}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginVertical: 10,
    borderRadius: 5,
  },
  cityButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#dcdcdc',
  },
});

export default SearchScreen;
