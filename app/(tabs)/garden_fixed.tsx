import React from 'react';
import { View, Text } from 'react-native';

export default function GardenFixedPlaceholder() {
  // Placeholder screen to satisfy expo-router route requirements.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Garden Fixed (Placeholder)</Text>
    </View>
  );
}

