import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="my-qr" options={{ title: 'My QR Code' }} />
      <Stack.Screen name="[userId]" options={{ title: 'Profile' }} />
      <Stack.Screen name="requests" options={{ title: 'Connection Requests' }} />
    </Stack>
  );
}
