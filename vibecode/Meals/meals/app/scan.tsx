import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { MealType } from '@/types';

export default function Scan() {
  const params = useLocalSearchParams<{ meal: MealType; date: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    router.replace(`/add-food?meal=${params.meal ?? 'snack'}&date=${params.date ?? ''}&barcode=${data}`);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={Colors.textDim} />
        <Text style={styles.permText}>Camera access required to scan barcodes</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
      />

      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>

        <Text style={styles.hint}>
          {scanned ? 'Looking up product…' : 'Point camera at barcode'}
        </Text>
      </View>
    </View>
  );
}

const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  permText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  cancelBtn: { marginTop: 8 },
  cancelText: { fontSize: 15, color: Colors.textSecondary },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 56, left: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  viewfinder: {
    width: 260, height: 160, position: 'relative',
    marginBottom: 40,
  },
  hint: { color: '#fff', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER,
    borderColor: Colors.primary,
  },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 4 },
});
