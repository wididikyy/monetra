import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView, Platform,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Theme } from '@/constants/theme';
import { buildCacheKey, getCache, saveCache } from '@/db/ai-cache';
import { callAI } from '@/services/ai-service';
import { buildFinancialContext } from '@/services/context-builder';
import { useAppStore } from '@/store/use-app-store';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

const QUICK_QUESTIONS = [
  'Berapa pengeluaran terbesar bulan ini?',
  'Apakah pengeluaran saya normal?',
  'Beri saran penghematan',
  'Prediksi pengeluaran bulan depan',
];

export default function AiScreen() {
  const { isOnline, selectedBulan, selectedTahun } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Halo! Saya Monetra AI, asisten keuangan personalmu. Tanya apa saja tentang keuanganmu, atau pilih pertanyaan cepat di bawah.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');

    const userEntry: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMsg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userEntry]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    if (!isOnline) {
      // Try cache first
      const key = buildCacheKey(userMsg, selectedBulan, selectedTahun);
      const cached = await getCache(key);
      if (cached) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', text: cached.respons, timestamp: new Date() },
        ]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: 'Kamu sedang offline. Butuh koneksi internet untuk mendapatkan respons AI baru.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const cacheKey = buildCacheKey(userMsg, selectedBulan, selectedTahun);
      const cached = await getCache(cacheKey);

      let respons: string;
      if (cached) {
        respons = cached.respons;
      } else {
        const ctx = await buildFinancialContext();
        respons = await callAI(userMsg, ctx);
        await saveCache(cacheKey, respons, `${selectedBulan}-${selectedTahun}`);
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: respons, timestamp: new Date() },
      ]);
    } catch (e: any) {
      const errMsg = e?.message?.includes('API key')
        ? 'API key belum diset. Tambahkan Gemini API key di Pengaturan.'
        : 'Gagal mendapatkan respons. Coba lagi nanti.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: errMsg, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [loading, isOnline, selectedBulan, selectedTahun]);

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
            <IconSymbol name="sparkles" size={14} color="#fff" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: AppColors.primary }]
              : [styles.bubbleAssistant, { backgroundColor: Theme.card, borderColor: Theme.border }],
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? '#fff' : Theme.text }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Theme.background }]} edges={[]}>
      {/* Offline banner */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: AppColors.warning }]}>
          <IconSymbol name="wifi.slash" size={14} color="#fff" />
          <Text style={styles.offlineBannerText}>Mode offline — hanya cache tersedia</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <View style={styles.typingRow}>
              <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
                <IconSymbol name="sparkles" size={14} color="#fff" />
              </View>
              <View style={[styles.typingBubble, { backgroundColor: Theme.card, borderColor: Theme.border }]}>
                <ActivityIndicator size="small" color={AppColors.primary} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick questions */}
      {messages.length <= 1 && (
        <View style={styles.quickRow}>
          {QUICK_QUESTIONS.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.quickChip, { backgroundColor: Theme.card, borderColor: Theme.border }]}
              onPress={() => sendMessage(q)}
            >
              <Text style={[styles.quickChipText, { color: Theme.text }]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input row */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputRow, { backgroundColor: Theme.card, borderTopColor: Theme.border }]}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/pengaturan')}
          >
            <IconSymbol name="gearshape.fill" size={22} color={Theme.subtext} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: Theme.background, color: Theme.text, borderColor: Theme.border }]}
            placeholder="Tanya tentang keuanganmu..."
            placeholderTextColor={Theme.subtext}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() ? AppColors.primary : Theme.skeleton },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <IconSymbol name="arrow.up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  offlineBannerText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  listContent: { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  bubble: {
    maxWidth: '78%', padding: 12, borderRadius: 16,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { padding: 12, borderRadius: 16, borderWidth: 1 },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  quickChipText: { fontSize: 13 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1,
  },
  settingsBtn: { padding: 4, marginBottom: 6 },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 2,
  },
});
