import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Определяем __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Отдаём собранный фронт по /app
app.use('/app', express.static(path.join(__dirname, '../dist/app')));

// ✅ Заглушка на корень
app.get('/', (req, res) => {
  res.send('⚡ Widget is running. Перейди по /app/index.html');
});

// ✅ Подключаем OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// ✅ Чат без стрима (стабильный)
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📩 Запрос:', message);

    const thread = await openai.beta.threads.create();
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      additional_messages: [{ role: 'user', content: message }]
    });

    // Ждём завершения
    let runStatus;
    while (true) {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === 'completed') break;
      if (runStatus.status === 'failed') throw new Error('Run failed');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(m => m.role === 'assistant');
    const answer = lastMessage?.content?.[0]?.text?.value || '⚠️ Нет ответа';

    console.log('📤 Ответ:', answer);
    res.json({ content: answer });

  } catch (err) {
    console.error('🔥 Ошибка в /chat:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Заглушка под фидбэк
app.post('/feedback', (req, res) => {
  console.log('📝 Feedback получен:', req.body);
  res.status(200).json({ message: 'OK' });
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
