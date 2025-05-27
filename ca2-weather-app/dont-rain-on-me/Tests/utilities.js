
const getWeatherIcon = (weatherCode) => {
  if (weatherCode >= 0 && weatherCode <= 3) {
    return weatherCode <= 1 ? 'wb-sunny' : 'cloud';
  } else if (weatherCode >= 45 && weatherCode <= 48) {
    return 'blur-on';
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    return 'grain';
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return 'ac-unit';
  } else if (weatherCode >= 80 && weatherCode <= 82) {
    return 'grain';
  } else if (weatherCode >= 85 && weatherCode <= 86) {
    return 'ac-unit';
  } else if (weatherCode >= 95 && weatherCode <= 99) {
    return 'flash-on';
  }
  return 'wb-sunny'; // default
};

const getWeatherCondition = (code) => {
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
  return conditions[code] || 'Unknown';
};

const formatTemperature = (tempCelsius, isCelsius) => {
  if (tempCelsius === null || tempCelsius === '--') return '--°';
  const temp = typeof tempCelsius === 'string' ? parseFloat(tempCelsius) : tempCelsius;
  return isCelsius
    ? `${temp}°C`
    : `${Math.round((temp * 9) / 5 + 32)}°F`;
};

// Unit Tests
describe('Utility Functions', () => {
  test('getWeatherIcon returns correct icon', () => {
    expect(getWeatherIcon(0)).toBe('wb-sunny');
    expect(getWeatherIcon(2)).toBe('cloud');
    expect(getWeatherIcon(45)).toBe('blur-on');
    expect(getWeatherIcon(67)).toBe('grain');
    expect(getWeatherIcon(75)).toBe('ac-unit');
    expect(getWeatherIcon(95)).toBe('flash-on');
    expect(getWeatherIcon(200)).toBe('wb-sunny'); // fallback
  });

  test('getWeatherCondition returns correct description', () => {
    expect(getWeatherCondition(0)).toBe('Clear sky');
    expect(getWeatherCondition(3)).toBe('Overcast');
    expect(getWeatherCondition(75)).toBe('Heavy snow fall');
    expect(getWeatherCondition(95)).toBe('Thunderstorm');
    expect(getWeatherCondition(999)).toBe('Unknown'); // fallback
  });

  test('formatTemperature works with numbers and strings', () => {
    expect(formatTemperature(25, true)).toBe('25°C');
    expect(formatTemperature(25, false)).toBe('77°F');
    expect(formatTemperature('30', true)).toBe('30°C');
    expect(formatTemperature('30', false)).toBe('86°F');
    expect(formatTemperature('--', true)).toBe('--°');
    expect(formatTemperature(null, false)).toBe('--°');
  });
});

