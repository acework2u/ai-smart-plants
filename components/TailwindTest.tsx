import { View, Text, ScrollView } from 'react-native';

export function TailwindTest() {
  return (
    <ScrollView className="flex-1 bg-blue-600">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-white text-3xl font-bold mb-4">
          Tailwind CSS v4 ✅
        </Text>
        <Text className="text-white/90 text-xl mb-8">
          NativeWind v5 Preview
        </Text>

        {/* Card Example */}
        <View className="w-full bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <Text className="text-gray-900 text-xl font-semibold mb-2">
            Card Component
          </Text>
          <Text className="text-gray-600 mb-4">
            This card demonstrates Tailwind CSS v4 working perfectly with React Native!
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 bg-blue-500 rounded-lg py-3 items-center">
              <Text className="text-white font-medium">Button 1</Text>
            </View>
            <View className="flex-1 bg-purple-500 rounded-lg py-3 items-center">
              <Text className="text-white font-medium">Button 2</Text>
            </View>
          </View>
        </View>

        {/* Feature List */}
        <View className="w-full bg-white/10 rounded-xl p-6">
          <Text className="text-white text-lg font-semibold mb-3">
            Features:
          </Text>
          {['Tailwind CSS v4.1.13', 'NativeWind v5 Preview', 'Full TypeScript Support', 'Hot Reload Enabled'].map((feature, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-green-400 rounded-full mr-3" />
              <Text className="text-white/90">{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
