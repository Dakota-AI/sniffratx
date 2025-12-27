import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { QRPayload, Profile, Dog } from '../../types/database';

interface ScannedUser {
  profile: Profile;
  dog: Dog | null;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes and connect with other dog owners.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Use ref for immediate blocking (state updates are async)
    if (isProcessing.current || scanned) return;
    isProcessing.current = true;
    setScanned(true);

    try {
      const payload: QRPayload = JSON.parse(data);

      if (payload.type !== 'sniffr-atx') {
        Alert.alert('Invalid QR Code', 'This is not a Sniffr ATX QR code.');
        setScanned(false);
        isProcessing.current = false;
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (payload.userId === user.id) {
        Alert.alert('Oops!', "That's your own QR code!");
        setScanned(false);
        isProcessing.current = false;
        return;
      }

      // Fetch the scanned user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payload.userId)
        .single();

      const { data: dog } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', payload.userId)
        .single();

      if (!profile) {
        Alert.alert('User Not Found', 'This user no longer exists.');
        setScanned(false);
        isProcessing.current = false;
        return;
      }

      // Check if already connected
      const { data: existing } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${payload.userId}),and(requester_id.eq.${payload.userId},addressee_id.eq.${user.id})`)
        .single();

      if (existing) {
        Alert.alert('Already Connected', `You're already connected with ${profile.display_name}!`);
        setScanned(false);
        isProcessing.current = false;
        return;
      }

      setScannedUser({ profile, dog });
      setShowModal(true);
    } catch (e) {
      Alert.alert('Invalid QR Code', 'Could not read this QR code.');
      setScanned(false);
      isProcessing.current = false;
    }
  };

  const sendConnectionRequest = async () => {
    if (!scannedUser) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        addressee_id: scannedUser.profile.id,
        status: 'pending',
      });

    setLoading(false);
    setShowModal(false);
    setScanned(false);
    setScannedUser(null);
    isProcessing.current = false;

    if (error) {
      Alert.alert('Error', 'Failed to send connection request.');
    } else {
      Alert.alert('Request Sent!', `Connection request sent to ${scannedUser.profile.display_name}!`);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>Point camera at a Sniffr ATX QR code</Text>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {scannedUser && (
              <>
                <Image
                  source={
                    scannedUser.profile.avatar_url
                      ? { uri: scannedUser.profile.avatar_url }
                      : require('../../assets/icon.png')
                  }
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalName}>{scannedUser.profile.display_name}</Text>
                {scannedUser.dog && (
                  <Text style={styles.modalDog}>
                    🐕 {scannedUser.dog.name}
                    {scannedUser.dog.breed && ` • ${scannedUser.dog.breed}`}
                  </Text>
                )}
                {scannedUser.profile.bio && (
                  <Text style={styles.modalBio}>{scannedUser.profile.bio}</Text>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowModal(false);
                      setScanned(false);
                      setScannedUser(null);
                      isProcessing.current = false;
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.connectButton, loading && styles.buttonDisabled]}
                    onPress={sendConnectionRequest}
                    disabled={loading}
                  >
                    <Text style={styles.connectButtonText}>
                      {loading ? 'Sending...' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
  },
  modalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  modalDog: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  modalBio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
