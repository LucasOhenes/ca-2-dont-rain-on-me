## REACT NATIVE WEATHER APP
This weather app is a cross-platform mobile application that was created through React Native and allows users to search for the weather conditions based on their locations.

## FEATURES
- Search weather by city name
- A search history that saves up to 5 searches between sessions.
- A toggle to change from Celsius to Fahrenheit
- Day and Night Modes (depending on what time it is, it changes colour and it follows around the world, e.g if you reseaerch a city that it is nighttime the layout gets dark)
- 5 day forecast with visual representation and daily highs and lows. 


This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## COMPONENT OVERVIEW

- layout.tsx - Import the expo-router

- index.tsx - Home screen configuration

- weather-app.tsx - General Functionalities

## API INTEGRATION
- Service : openmeteo

## TESTING
- Unit and component test explained in test.md

## CONTRIBUTORS

- Renan de Castilhos da Silva
- Ueslei Deiveson Monteiro de Oliveira
- Wanderson Lucas Ohenes
