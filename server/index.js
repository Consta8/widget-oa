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

// Для __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Раздача собранного сайта (виджет)
app.use('/app', express.static(path.join(__dirname, '../dist/app')));

// ✅ Заглушка на корень
app.get('/', (req, res) => {
  res.send('⚡ Widget is running. Try /app/index.html');
});

// 🔑 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// 🤖 Чат-бот
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    let threadId = req.headers['x-thread-id'] || null;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      res.write(`data: ${JSON.stringify({ info: { id: threadId } })}\n\n`);
      res.flush?.();
    }

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      additional_messages: [{ role: "user", content: message }],
      stream: true,
    });

    for await (const event of run) {
      if (event.event === 'thread.message.delta') {
        if (event.data?.delta?.content?.[0]?.type === 'text') {
          let chunk = event.data?.delta?.content[0].text.value;
          const annotationRegex = /【\d+:\d+†[^\s】]+】/g;
          chunk = chunk.replace(annotationRegex, "");
          if (chunk.trim() !== "") {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            res.flush?.();
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📬 Заглушка под фидбэк
app.post('/feedback', (req, res) => {
  res.status(200).json({ message: 'Feedback received' });
});

// 🔥 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
