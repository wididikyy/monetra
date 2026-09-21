import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE = 'groq_api_key';
const GROQ_MODEL = 'openai/gpt-oss-20b';
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
  financialContext: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key belum diset. Silakan tambahkan di Pengaturan.');

  const streaming = typeof onChunk === 'function';

  const body = JSON.stringify({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: financialContext },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 300,
    temperature: 0.7,
    ...(streaming && { stream: true }),
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

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = (err as any)?.error?.message ?? `HTTP ${response.status}`;
      lastError = new Error(`Groq error: ${msg}`);
      if (!RETRY_STATUSES.has(response.status)) break;
      continue;
    }

    if (streaming) {
      const raw = await response.text();
      // Use true streaming when body is a ReadableStream; otherwise parse the
      // full SSE text at once (React Native fetch may not expose response.body).
      if (response.body) {
        return readStream(response.body, onChunk!);
      }
      return parseSSEText(raw, onChunk!);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? 'Tidak ada respons dari AI.';
  }

  throw lastError!;
}

function parseSSEText(raw: string, onChunk: (chunk: string) => void): string {
  let full = '';
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(data);
      const text = parsed?.choices?.[0]?.delta?.content ?? '';
      if (text) {
        full += text;
        onChunk(text);
      }
    } catch {
      // ignore malformed SSE chunks
    }
  }
  return full || 'Tidak ada respons dari AI.';
}

async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.choices?.[0]?.delta?.content ?? '';
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  return full || 'Tidak ada respons dari AI.';
}
