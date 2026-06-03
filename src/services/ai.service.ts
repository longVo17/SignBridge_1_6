const AI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export async function askGemini(
  prompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> {
  return askAI(prompt, history);
}

export async function askAI(
  prompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> {
  const apiKey = AI_API_KEY;
  if (!apiKey) {
    console.warn('[AI Service] EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env.');
    return "Error: AI API Key is missing. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.";
  }

  // Specialized system instructions about SignBridge
  const systemInstructionText = `You are an AI Sign Language Assistant named SignBridge AI, embedded inside the SignBridge ASL learning mobile application.
SignBridge is an educational application designed to help users learn American Sign Language (ASL). It features vocabulary lessons, video guides, finger-spelling, AI practice via camera feedback, and a sentence visualizer.
The app was created by a talented software developer as their Graduation Project (Đồ án tốt nghiệp / DACN1) to bridge the communication gap between the deaf/hard-of-hearing and the hearing community.

Your behavior guidelines:
1. Be friendly, encouraging, and highly supportive.
2. Specialize in answering questions about ASL (American Sign Language), sign language history, learning tips, grammar rules (like topic-comment, SVO, time-first structure), and deaf culture/community.
3. Keep answers concise, clear, and formatted nicely with bullet points where appropriate so they are easily readable on a mobile screen.
4. Respond in the language the user speaks to you (Vietnamese or English).
5. If the user asks questions unrelated to ASL, deaf culture, or this application, politely remind them that you are an ASL learning assistant and guide them back to ASL topics.`;

  // Convert history to OpenAI message format
  const messages = [
    { role: 'system', content: systemInstructionText },
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts?.[0]?.text || ''
    })),
    { role: 'user', content: prompt }
  ];

  try {
    // OpenRouter completions endpoint
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/anonymous/SignBridgeApp',
        'X-Title': 'SignBridge App',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OpenRouter API Error Response]', errText);
      let errMsg = `HTTP error! status: ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    const candidateText = data.choices?.[0]?.message?.content;
    if (!candidateText) {
      throw new Error('Invalid response structure from OpenRouter API');
    }

    return candidateText;
  } catch (error: any) {
    console.error('[AI Service] Error calling OpenRouter:', error);
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('limit') || msg.includes('credits') || msg.includes('payment')) {
      return "⚠️ [Lỗi Hạn Mức OpenRouter]\nTài khoản OpenRouter của bạn đã hết hạn mức hoặc hết số dư (credits).\nVui lòng kiểm tra lại tài khoản hoặc nạp thêm tín dụng tại https://openrouter.ai/.";
    }
    if (msg.includes('401') || msg.includes('API key') || msg.includes('Unauthorized')) {
      return "⚠️ [Lỗi Xác Thực OpenRouter]\nAPI Key của OpenRouter không hợp lệ hoặc đã bị vô hiệu hóa.\nVui lòng kiểm tra lại cấu hình EXPO_PUBLIC_GEMINI_API_KEY trong file .env.";
    }
    return `Xin lỗi, Trợ lý AI đang gặp sự cố kết nối: ${msg}. Vui lòng kiểm tra kết nối mạng hoặc khóa API của bạn.`;
  }
}
