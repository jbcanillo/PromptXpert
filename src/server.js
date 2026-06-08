const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/dist', express.static(path.join(__dirname, '..', 'dist')));

const promptEngine = require('./prompt-engine');

app.post('/api/rewrite', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'A non-empty prompt is required.' });
    }
    const result = promptEngine.rewrite(prompt);
    res.json(result);
  } catch (err) {
    console.error('Rewrite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PromptXpert running on http://localhost:${PORT}`);
});
