const { rewrite } = require('../src/prompt-engine');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'A non-empty prompt is required.' }) };
    }

    const result = rewrite(prompt);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
