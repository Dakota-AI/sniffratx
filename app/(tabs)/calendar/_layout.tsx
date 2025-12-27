import { Stack } from 'expo-router';
import { colors } from '../../../lib/theme';

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Calendar' }} />
      <Stack.Screen name="create" options={{ title: 'New Event', presentation: 'modal' }} />
      <Stack.Screen name="[eventId]" options={{ title: 'Event Details' }} />
      <Stack.Screen name="invitations" options={{ title: 'Playdate Invitations' }} />
    </Stack>
  );
}
