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

// dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static app
app.use('/app', express.static(path.join(__dirname, '../dist/app')));

app.get('/', (req, res) => {
  res.send('✅ Widget is running. Go to /app/index.html');
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const ASSISTANT_ID = process.env.ASSISTANT_ID;

if (!ASSISTANT_ID || !process.env.OPENAI_API_KEY) {
  console.error('❌ ASSISTANT_ID or OPENAI_API_KEY not set!');
}

// POST /chat
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    let threadId = req.headers['x-thread-id'] || null;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('📩 Incoming message:', message);

    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      console.log('🧵 New thread created:', threadId);
      res.write(`data: ${JSON.stringify({ info: { id: threadId } })}\n\n`);
      res.flush?.();
    }

    console.log('🤖 Launching run with assistant:', ASSISTANT_ID);

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      additional_messages: [{ role: "user", content: message }],
      stream: true,
    });

    for await (const event of run) {
      if (event.event === 'thread.message.delta') {
        const delta = event.data?.delta?.content?.[0];
        if (delta?.type === 'text') {
          let chunk = delta.text.value;
          chunk = chunk.replace(/【\d+:\d+†[^\s】]+】/g, '');
          if (chunk.trim()) {
            console.log('📤 Sending chunk:', chunk);
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            res.flush?.();
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
    console.log('✅ Stream finished');

  } catch (error) {
    console.error('🔥 ERROR in /chat:', error.message, error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.post('/feedback', (req, res) => {
  console.log('📝 Feedback received:', req.body);
  res.status(200).json({ message: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
