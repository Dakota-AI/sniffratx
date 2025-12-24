import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { QRPayload } from '../../../types/database';

export default function MyQRScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setDisplayName(profile.display_name);
        }
      }
    };
    fetchUser();
  }, []);

  const qrPayload: QRPayload = {
    type: 'sniffr-atx',
    version: 1,
    userId: userId || '',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with me on Sniffr ATX! My profile: ${displayName}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrCard}>
        <View style={styles.qrContainer}>
          <QRCode
            value={JSON.stringify(qrPayload)}
            size={250}
            color="#1F2937"
            backgroundColor="#FFFFFF"
          />
        </View>

        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.instructions}>
          Show this QR code to connect with other dog owners at the park!
        </Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color="#4F46E5" />
        <Text style={styles.shareButtonText}>Share Profile</Text>
      </TouchableOpacity>

      <View style={styles.tipContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.tipText}>
          The other person will need to accept your connection request before you can message each other.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
    gap: 8,
  },
  shareButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
