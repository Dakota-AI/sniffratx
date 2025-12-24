import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Profile, Dog } from '../../../types/database';

export default function MyProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: dogData } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    setProfile(profileData);
    setDog(dogData);
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require('../../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.display_name}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Ionicons name="pencil" size={16} color="#4F46E5" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push('/(tabs)/profile/my-qr')}
          >
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            <Text style={styles.qrButtonText}>My QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {dog ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Dog</Text>
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
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Dog</Text>
          <TouchableOpacity
            style={styles.addDogButton}
            onPress={() => router.push('/(tabs)/profile/edit')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.addDogText}>Add your dog</Text>
          </TouchableOpacity>
        </View>
      )}

      {profile?.favorite_places && profile.favorite_places.length > 0 && (
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

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
    gap: 6,
  },
  editButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  addDogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  addDogText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    gap: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
});
