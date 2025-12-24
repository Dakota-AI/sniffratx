import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Profile, Dog } from '../../../types/database';

export default function ViewProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId)
      .single();

    setProfile(profileData);
    setDog(dogData);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            profile.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => router.push(`/(tabs)/messages/${userId}`)}
        >
          <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      {dog && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Their Dog</Text>
          <View style={styles.dogCard}>
            <Image
              source={
                dog.photo_url
                  ? { uri: dog.photo_url }
                  : require('../../../assets/icon.png')
              }
              style={styles.dogPhoto}
            />
            <View style={styles.dogInfo}>
              <Text style={styles.dogName}>{dog.name}</Text>
              {dog.breed && <Text style={styles.dogBreed}>{dog.breed}</Text>}
              {dog.age_years && (
                <Text style={styles.dogAge}>
                  {dog.age_years} year{dog.age_years > 1 ? 's' : ''} old
                </Text>
              )}
              {dog.bio && <Text style={styles.dogBio}>{dog.bio}</Text>}
            </View>
          </View>
        </View>
      )}

      {profile.favorite_places && profile.favorite_places.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Places</Text>
          <View style={styles.placesList}>
            {profile.favorite_places.map((place, index) => (
              <View key={index} style={styles.placeTag}>
                <Ionicons name="location" size={14} color="#4F46E5" />
                <Text style={styles.placeText}>{place}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  bio: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dogCard: {
    flexDirection: 'row',
    gap: 16,
  },
  dogPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dogBreed: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dogAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  dogBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  placesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  placeText: {
    fontSize: 14,
    color: '#4F46E5',
  },
});
