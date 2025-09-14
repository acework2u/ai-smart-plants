import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, X, RotateCw, Circle, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, radius, getSpacing } from '../core/theme';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถถ่ายรูปได้ โปรดลองอีกครั้ง');
      console.error('Camera error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้ โปรดลองอีกครั้ง');
      console.error('Gallery error:', error);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleUsePhoto = () => {
    if (capturedPhoto) {
      // Navigate to analyzing screen with the captured photo
      router.push({
        pathname: '/analyzing',
        params: { imageUri: capturedPhoto }
      });
    }
  };

  // Permission handling
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.gray[400]} style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>ต้องการสิทธิ์ใช้กล้อง</Text>
          <Text style={styles.permissionDescription}>
            แอปต้องการใช้กล้องเพื่อถ่ายรูปพืชของคุณสำหรับการวิเคราะห์
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>อนุญาต</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Photo preview screen
  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          {/* Header */}
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRetake}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>ตรวจสอบภาพ</Text>
            <View style={styles.headerButton} />
          </View>

          {/* Photo */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.photo} />
          </View>

          {/* Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
            >
              <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.usePhotoButton}
              onPress={handleUsePhoto}
            >
              <Text style={styles.usePhotoButtonText}>ใช้ภาพนี้</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera screen
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        {/* Header */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
          >
            <X size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>สแกนต้นไม้</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleCameraFacing}
          >
            <RotateCw size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            จัดกรอบให้ต้นไม้อยู่ตรงกลาง
          </Text>
          <Text style={styles.instructionSubtext}>
            ถ่ายรูปใกล้ๆ เพื่อผลการวิเคราะห์ที่แม่นยำ
          </Text>
        </View>

        {/* Camera frame overlay */}
        <View style={styles.frameOverlay}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
        </View>

        {/* Bottom controls */}
        <View style={styles.cameraControls}>
          {/* Gallery button */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickFromGallery}
          >
            <ImageIcon size={28} color={colors.white} />
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleTakePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner}>
              {isCapturing ? (
                <View style={styles.captureButtonLoading} />
              ) : (
                <Circle size={32} color={colors.white} fill={colors.white} />
              )}
            </View>
          </TouchableOpacity>

          {/* Placeholder for symmetry */}
          <View style={styles.galleryButton} />
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },

  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(6),
    backgroundColor: colors.background.primary,
  },
  permissionIcon: {
    marginBottom: getSpacing(4),
  },
  permissionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: getSpacing(3),
  },
  permissionDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
    marginBottom: getSpacing(6),
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(3),
    borderRadius: radius.lg,
    marginBottom: getSpacing(3),
  },
  permissionButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(2),
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Camera styles
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getSpacing(3),
    paddingHorizontal: getSpacing(4),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cameraTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.white,
    textAlign: 'center',
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: getSpacing(4),
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: getSpacing(1),
  },
  instructionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.8,
  },

  // Frame overlay
  frameOverlay: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '40%',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.white,
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    transform: [{ rotate: '90deg' }],
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    transform: [{ rotate: '-90deg' }],
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    transform: [{ rotate: '180deg' }],
  },

  // Camera controls
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(8),
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonLoading: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    opacity: 0.7,
  },

  // Preview styles
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getSpacing(3),
    paddingHorizontal: getSpacing(4),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.white,
    textAlign: 'center',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  photo: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: radius.lg,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: getSpacing(6),
    paddingHorizontal: getSpacing(4),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(3),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  usePhotoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(3),
    borderRadius: radius.lg,
  },
  usePhotoButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    textAlign: 'center',
  },
});