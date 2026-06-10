import type { IHttpClient } from '../core/http/HttpClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  response: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  } | null;
}

export interface DashboardInsights {
  insight: string;
  trend_percentage: number;
  trend_direction: 'up' | 'down';
  trend_comparison: string;
  timestamp: string;
}

export class AiService {
  constructor(private httpClient: IHttpClient) {}

  async askStream(message: string, conversation: ChatMessage[] = [], onChunk: (text: string) => void): Promise<void> {
    const url = `${this.httpClient.baseURL}/ai/ask`;
    
    const token = localStorage.getItem('kiora_token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': localStorage.getItem('api_key') || '',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, conversation })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Error al contactar al asistente (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') {
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                onChunk(data.content);
              }
            } catch (e) {
              // Ignore incomplete chunks
            }
          }
        }
      }
    }
  }

  // Mantenemos esto por si acaso, aunque ahora el componente usará askStream
  async ask(message: string, conversation: ChatMessage[] = []): Promise<AiResponse> {
    let fullResponse = '';
    await this.askStream(message, conversation, (chunk) => { fullResponse += chunk; });
    return { response: fullResponse };
  }

  async getInsights(): Promise<DashboardInsights> {
    const response = await this.httpClient.get<DashboardInsights>('/ai/insights');

    if (!response.ok || !response.data) {
      throw new Error(response.error ?? 'Error al obtener insights');
    }

    return response.data;
  }
}
