# 📸 Camera & Media Agent

## Agent Profile
**Name:** David Park
**Title:** Senior iOS Engineer, Tesla (Autopilot Vision)
**Experience:** 6 years at Tesla, Computer Vision Pipelines, Real-time Image Processing
**Specialization:** Advanced Camera APIs, Image Optimization, Memory Management

---

## 🎯 Primary Responsibilities

### 1. Camera Integration
- Implement high-performance camera capture system
- Handle camera permissions and error states gracefully
- Optimize image quality for AI analysis
- Support multiple capture modes and settings

### 2. Image Processing Pipeline
- Real-time image optimization and compression
- Memory-efficient image handling
- Format conversion and validation
- Batch processing for multiple images

---

## 🛠️ Technical Implementation

### Camera Service Architecture
```typescript
// services/CameraService.ts - Production-grade camera implementation
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { haptic } from '../core/haptics';

export interface CameraConfig {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png';
  enableHighQuality: boolean;
}

export interface CaptureResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

class CameraService {
  private static instance: CameraService;
  private cameraRef: CameraView | null = null;
  private isCapturing = false;

  private readonly defaultConfig: CameraConfig = {
    quality: 0.8,
    maxWidth: 1024,
    maxHeight: 1024,
    format: 'jpeg',
    enableHighQuality: true,
  };

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  setCameraRef(ref: CameraView | null): void {
    this.cameraRef = ref;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      return cameraResult.status === 'granted' && mediaLibraryResult.status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    try {
      const [cameraPermission, mediaPermission] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      return {
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaPermission.status === 'granted',
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  async capturePhoto(config: Partial<CameraConfig> = {}): Promise<CaptureResult> {
    if (!this.cameraRef) {
      throw new Error('Camera reference not set');
    }

    if (this.isCapturing) {
      throw new Error('Capture already in progress');
    }

    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      this.isCapturing = true;

      // Trigger haptic feedback
      await haptic('medium');

      // Capture with optimal settings
      const photo = await this.cameraRef.takePictureAsync({
        quality: finalConfig.quality,
        base64: false, // Optimize memory usage
        skipProcessing: false,
        imageType: finalConfig.format === 'png' ? ImagePicker.ImageType.png : ImagePicker.ImageType.jpeg,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Process and optimize the image
      const optimizedResult = await this.processImage(photo.uri, finalConfig);

      // Log capture analytics
      this.logCaptureMetrics(optimizedResult);

      return optimizedResult;
    } catch (error) {
      console.error('Photo capture failed:', error);
      throw error;
    } finally {
      this.isCapturing = false;
    }
  }

  async pickFromGallery(config: Partial<CameraConfig> = {}): Promise<CaptureResult> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect for plant photos
        quality: finalConfig.quality,
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error('Image selection cancelled');
      }

      const asset = result.assets[0];

      // Process and optimize the selected image
      const optimizedResult = await this.processImage(asset.uri, finalConfig);

      // Log selection analytics
      this.logSelectionMetrics(optimizedResult);

      return optimizedResult;
    } catch (error) {
      console.error('Gallery selection failed:', error);
      throw error;
    }
  }

  private async processImage(uri: string, config: CameraConfig): Promise<CaptureResult> {
    try {
      // Get original image info
      const imageInfo = await FileSystem.getInfoAsync(uri);

      if (!imageInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // Optimize image dimensions and quality
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: config.maxWidth,
              height: config.maxHeight,
            },
          },
        ],
        {
          compress: config.quality,
          format: config.format === 'png'
            ? ImageManipulator.SaveFormat.PNG
            : ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Get processed image info
      const processedInfo = await FileSystem.getInfoAsync(manipulated.uri);

      return {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        fileSize: processedInfo.size || 0,
        format: config.format,
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  async validateImage(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);

      if (!info.exists) {
        return false;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if ((info.size || 0) > maxSize) {
        return false;
      }

      // Additional validation can be added here
      return true;
    } catch (error) {
      console.error('Image validation failed:', error);
      return false;
    }
  }

  async deleteImage(uri: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(uri);

      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch (error) {
      console.error('Image deletion failed:', error);
      // Don't throw - deletion failure shouldn't break the app
    }
  }

  private logCaptureMetrics(result: CaptureResult): void {
    // Analytics tracking for capture events
    const metrics = {
      action: 'camera_capture',
      fileSize: result.fileSize,
      width: result.width,
      height: result.height,
      format: result.format,
      timestamp: new Date().toISOString(),
    };

    // Send to analytics service
    console.log('Capture metrics:', metrics);
  }

  private logSelectionMetrics(result: CaptureResult): void {
    // Analytics tracking for gallery selection events
    const metrics = {
      action: 'gallery_selection',
      fileSize: result.fileSize,
      width: result.width,
      height: result.height,
      format: result.format,
      timestamp: new Date().toISOString(),
    };

    // Send to analytics service
    console.log('Selection metrics:', metrics);
  }
}

export default CameraService;
```

### Camera View Component
```typescript
// components/organisms/CameraView.tsx - Production camera interface
import { Camera, CameraType, CameraView } from 'expo-camera';
import { useCameraPermissions } from 'expo-camera';

interface CameraViewProps {
  onCapture: (result: CaptureResult) => void;
  onGallerySelect: (result: CaptureResult) => void;
  onClose: () => void;
}

export const SmartCameraView = memo<CameraViewProps>(({
  onCapture,
  onGallerySelect,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);

  const cameraRef = useRef<CameraView>(null);
  const cameraService = CameraService.getInstance();

  useEffect(() => {
    cameraService.setCameraRef(cameraRef.current);
  }, []);

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);
      const result = await cameraService.capturePhoto();
      onCapture(result);
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถถ่ายรูปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture]);

  const handleGallerySelect = useCallback(async () => {
    try {
      const result = await cameraService.pickFromGallery();
      onGallerySelect(result);
    } catch (error) {
      console.error('Gallery selection failed:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    }
  }, [onGallerySelect]);

  const toggleCameraType = useCallback(() => {
    setCameraType(current =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
    haptic('selection');
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode(current => {
      const modes = [FlashMode.off, FlashMode.on, FlashMode.auto];
      const currentIndex = modes.indexOf(current);
      const nextIndex = (currentIndex + 1) % modes.length;
      return modes[nextIndex];
    });
    haptic('selection');
  }, []);

  if (!permission) {
    return <View style={styles.container}><Text>กำลังขอสิทธิ์การเข้าถึงกล้อง...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          แอปต้องการสิทธิ์ในการเข้าถึงกล้องเพื่อสแกนพืช
        </Text>
        <Button
          variant="primary"
          size="md"
          onPress={requestPermission}
        >
          อนุญาตการเข้าถึงกล้อง
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
      >
        {/* Camera overlay */}
        <View style={styles.overlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.white} />
            </Pressable>
            <Pressable onPress={toggleFlash} style={styles.flashButton}>
              <Zap size={24} color={flashMode === FlashMode.off ? colors.gray[400] : colors.white} />
            </Pressable>
          </View>

          {/* Center guide */}
          <View style={styles.centerGuide}>
            <View style={styles.guideBorder} />
            <Text style={styles.guideText}>จัดพืชให้อยู่ในกรอบ</Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <Pressable onPress={handleGallerySelect} style={styles.galleryButton}>
              <Image size={24} color={colors.white} />
            </Pressable>

            <Pressable
              onPress={handleCapture}
              style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.captureInner} />
              )}
            </Pressable>

            <Pressable onPress={toggleCameraType} style={styles.flipButton}>
              <RotateCcw size={24} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    paddingHorizontal: spacing[4],
  },
  closeButton: {
    padding: spacing[2],
    backgroundColor: colors.black + '40',
    borderRadius: radius.full,
  },
  flashButton: {
    padding: spacing[2],
    backgroundColor: colors.black + '40',
    borderRadius: radius.full,
  },
  centerGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBorder: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
  },
  guideText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing[4],
    backgroundColor: colors.black + '60',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[8],
  },
  galleryButton: {
    padding: spacing[3],
    backgroundColor: colors.black + '40',
    borderRadius: radius.full,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.gray[300],
  },
  captureButtonActive: {
    backgroundColor: colors.gray[200],
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  flipButton: {
    padding: spacing[3],
    backgroundColor: colors.black + '40',
    borderRadius: radius.full,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  permissionText: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    color: colors.gray[700],
    marginBottom: spacing[6],
    lineHeight: typography.lineHeight.relaxed,
  },
});
```

### Image Preview Component
```typescript
// components/molecules/ImagePreview.tsx - Preview captured images
interface ImagePreviewProps {
  uri: string;
  onConfirm: () => void;
  onRetake: () => void;
  isAnalyzing?: boolean;
}

export const ImagePreview = memo<ImagePreviewProps>(({
  uri,
  onConfirm,
  onRetake,
  isAnalyzing = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.errorText}>ไม่สามารถแสดงรูปภาพได้</Text>
        <Button variant="secondary" size="md" onPress={onRetake}>
          ถ่ายใหม่
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.previewContainer}>
      <Image
        source={{ uri }}
        style={styles.previewImage}
        resizeMode="cover"
        onError={handleImageError}
      />

      {!isAnalyzing && (
        <View style={styles.previewActions}>
          <Button
            variant="secondary"
            size="md"
            onPress={onRetake}
            leftIcon={<RotateCcw size={20} />}
          >
            ถ่ายใหม่
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={onConfirm}
            leftIcon={<Check size={20} />}
          >
            ใช้รูปนี้
          </Button>
        </View>
      )}

      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.analyzingText}>กำลังวิเคราะห์...</Text>
        </View>
      )}
    </View>
  );
});
```

---

## 🧪 Testing Strategy

```typescript
describe('CameraService', () => {
  let cameraService: CameraService;

  beforeEach(() => {
    cameraService = CameraService.getInstance();
  });

  describe('Permission handling', () => {
    it('should request camera permissions', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue({ status: 'granted' });
      Camera.requestCameraPermissionsAsync = mockRequestPermission;

      const result = await cameraService.requestPermissions();

      expect(result).toBe(true);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should handle permission denial gracefully', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue({ status: 'denied' });
      Camera.requestCameraPermissionsAsync = mockRequestPermission;

      const result = await cameraService.requestPermissions();

      expect(result).toBe(false);
    });
  });

  describe('Image processing', () => {
    it('should optimize image dimensions', async () => {
      const mockUri = 'test-image-uri';
      const mockConfig = {
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        format: 'jpeg' as const,
        enableHighQuality: true,
      };

      // Mock ImageManipulator
      const mockManipulate = jest.fn().mockResolvedValue({
        uri: 'optimized-uri',
        width: 1024,
        height: 768,
      });
      ImageManipulator.manipulateAsync = mockManipulate;

      const result = await (cameraService as any).processImage(mockUri, mockConfig);

      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
      expect(mockManipulate).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1024, height: 1024 } }],
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle capture errors gracefully', async () => {
      // Mock camera ref that throws error
      cameraService.setCameraRef({
        takePictureAsync: jest.fn().mockRejectedValue(new Error('Camera error')),
      } as any);

      await expect(cameraService.capturePhoto()).rejects.toThrow('Camera error');
    });
  });
});
```

---

## 📋 Performance Optimization

### Memory Management
```typescript
// utils/imageCache.ts - Intelligent image caching
class ImageCache {
  private cache = new Map<string, string>();
  private readonly maxCacheSize = 50; // Maximum cached images
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours

  async cacheImage(originalUri: string, processedUri: string): Promise<void> {
    // Cleanup old cache entries
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }

    this.cache.set(originalUri, processedUri);
  }

  getCachedImage(originalUri: string): string | null {
    return this.cache.get(originalUri) || null;
  }

  private cleanup(): void {
    // Remove oldest 25% of cache entries
    const entriesToRemove = Math.floor(this.cache.size * 0.25);
    const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);

    keys.forEach(key => {
      this.cache.delete(key);
    });
  }

  async clearCache(): Promise<void> {
    // Delete cached image files
    for (const uri of this.cache.values()) {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to delete cached image:', error);
      }
    }

    this.cache.clear();
  }
}
```

---

## 📋 Delivery Checklist

### Phase 1 Deliverables
- ✅ Camera service with permission handling
- ✅ Image capture and gallery selection
- ✅ Image processing and optimization
- ✅ Memory-efficient image handling
- ✅ Comprehensive error handling

### Quality Standards
- Camera startup time < 1 second
- Image processing time < 500ms
- Memory usage optimization
- Cross-platform compatibility
- Accessibility support

---

**Next Steps:** Integration with AI Services Agent for plant analysis pipeline