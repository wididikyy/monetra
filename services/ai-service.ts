import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE = 'groq_api_key';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RETRY_STATUSES = new Set([429, 503]);
const MAX_RETRIES = 3;

export async function getApiKey(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(API_KEY_STORAGE);
  return stored ?? process.env.EXPO_PUBLIC_GROQ_API_KEY ?? null;
}

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY_STORAGE, key);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(API_KEY_STORAGE);
}

export async function callAI(
  userMessage: string,
  financialContext: string
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key belum diset. Silakan tambahkan di Pengaturan.');

  const body = JSON.stringify({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: financialContext },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body,
    });

    if (response.ok) {
      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? 'Tidak ada respons dari AI.';
    }

    const err = await response.json().catch(() => ({}));
    const msg = (err as any)?.error?.message ?? `HTTP ${response.status}`;
    lastError = new Error(`Groq error: ${msg}`);

    if (!RETRY_STATUSES.has(response.status)) break;
  }

  throw lastError!;
}
