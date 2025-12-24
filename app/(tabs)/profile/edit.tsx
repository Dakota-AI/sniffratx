import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Profile, Dog } from '../../../types/database';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Dog fields
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogAge, setDogAge] = useState('');
  const [dogBio, setDogBio] = useState('');
  const [dogPhotoUrl, setDogPhotoUrl] = useState<string | null>(null);
  const [dogId, setDogId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url);
    }

    const { data: dog } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (dog) {
      setDogId(dog.id);
      setDogName(dog.name);
      setDogBreed(dog.breed || '');
      setDogAge(dog.age_years?.toString() || '');
      setDogBio(dog.bio || '');
      setDogPhotoUrl(dog.photo_url);
    }
  };

  const pickImage = async (type: 'avatar' | 'dog') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'avatar') {
        setAvatarUrl(result.assets[0].uri);
      } else {
        setDogPhotoUrl(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update or create dog
      if (dogName.trim()) {
        const dogData = {
          name: dogName.trim(),
          breed: dogBreed.trim() || null,
          age_years: dogAge ? parseInt(dogAge) : null,
          bio: dogBio.trim() || null,
          updated_at: new Date().toISOString(),
        };

        if (dogId) {
          const { error: dogError } = await supabase
            .from('dogs')
            .update(dogData)
            .eq('id', dogId);

          if (dogError) throw dogError;
        } else {
          const { error: dogError } = await supabase
            .from('dogs')
            .insert({
              ...dogData,
              owner_id: user.id,
            });

          if (dogError) throw dogError;
        }
      }

      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profile</Text>

        <TouchableOpacity
          style={styles.avatarPicker}
          onPress={() => pickImage('avatar')}
        >
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require('../../../assets/icon.png')
            }
            style={styles.avatar}
          />
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#9CA3AF"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Bio (optional)"
          placeholderTextColor="#9CA3AF"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Dog</Text>

        <TouchableOpacity
          style={styles.dogPhotoPicker}
          onPress={() => pickImage('dog')}
        >
          {dogPhotoUrl ? (
            <Image source={{ uri: dogPhotoUrl }} style={styles.dogPhoto} />
          ) : (
            <View style={styles.dogPhotoPlaceholder}>
              <Ionicons name="paw" size={32} color="#9CA3AF" />
              <Text style={styles.dogPhotoText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Dog's Name"
          placeholderTextColor="#9CA3AF"
          value={dogName}
          onChangeText={setDogName}
        />

        <TextInput
          style={styles.input}
          placeholder="Breed (optional)"
          placeholderTextColor="#9CA3AF"
          value={dogBreed}
          onChangeText={setDogBreed}
        />

        <TextInput
          style={styles.input}
          placeholder="Age in years (optional)"
          placeholderTextColor="#9CA3AF"
          value={dogAge}
          onChangeText={setDogAge}
          keyboardType="numeric"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="About your dog (optional)"
          placeholderTextColor="#9CA3AF"
          value={dogBio}
          onChangeText={setDogBio}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogPhotoPicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  dogPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  dogPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogPhotoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 48,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
