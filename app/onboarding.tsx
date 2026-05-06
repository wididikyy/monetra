import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Theme } from '@/constants/theme';
import { getProfil, saveProfil } from '@/db/profil';
import { useAppStore } from '@/store/use-app-store';

const MATA_UANG_OPTIONS = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];

export default function OnboardingScreen() {
  const [nama, setNama] = useState('');
  const [matauang, setMatauang] = useState('IDR');
  const [penghasilan, setPenghasilan] = useState('');
  const [loading, setLoading] = useState(false);

  const setProfil = useAppStore((s) => s.setProfil);

  async function handleMulai() {
    if (!nama.trim()) {
      Alert.alert('Oops', 'Masukkan nama kamu terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const nominal = parseFloat(penghasilan.replace(/\D/g, '')) || 0;
      await saveProfil(nama.trim(), matauang, nominal);
      const profil = await getProfil();
      setProfil(profil);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan profil. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: Theme.background }]}>
              <Image
                source={require('../assets/images/icon.png')}
                style={{ width: 100, height: 100 }}
              />
            </View>
            <Text style={[styles.title, { color: Theme.text }]}>Selamat datang di Monetra</Text>
            <Text style={[styles.subtitle, { color: Theme.subtext }]}>
              Kelola keuanganmu dengan cerdas.{'\n'}Mari mulai dengan beberapa info dasar.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, { color: Theme.text }]}>Nama kamu</Text>
            <TextInput
              style={[styles.input, { backgroundColor: Theme.card, color: Theme.text, borderColor: Theme.border }]}
              placeholder="Contoh: Budi Santoso"
              placeholderTextColor={Theme.subtext}
              value={nama}
              onChangeText={setNama}
              autoFocus
            />

            <Text style={[styles.label, { color: Theme.text }]}>Mata uang</Text>
            <View style={styles.chipRow}>
              {MATA_UANG_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    { borderColor: Theme.border, backgroundColor: Theme.card },
                    matauang === c && { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
                  ]}
                  onPress={() => setMatauang(c)}
                >
                  <Text style={[styles.chipText, { color: matauang === c ? '#fff' : Theme.text }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: Theme.text }]}>
              Penghasilan bulanan <Text style={{ color: Theme.subtext }}>(opsional)</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: Theme.card, color: Theme.text, borderColor: Theme.border }]}
              placeholder="Contoh: 5000000"
              placeholderTextColor={Theme.subtext}
              value={penghasilan}
              onChangeText={setPenghasilan}
              keyboardType="numeric"
            />
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleMulai}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Menyimpan...' : 'Mulai Sekarang'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 32, marginBottom: 40 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    overflow: 'hidden',
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  form: { gap: 6, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '500' },
  btn: {
    backgroundColor: AppColors.primary,
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
