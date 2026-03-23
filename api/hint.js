// api/hint.js
// Vercel serverless function — proxies Claude API for contextual hints

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, section, fallbackHint } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'question is required' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    // Gracefully fall back instead of hard failing
    return res.status(200).json({ hint: fallbackHint || 'Think carefully about the concept being tested.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Give a one-sentence hint (max 20 words) for this Python ${section} question: "${question}". 
          
          Be helpful but don't give away the answer directly. Just a nudge in the right direction.
          Respond with the hint text only — no preamble, no quotes.`
        }],
      }),
    });

    if (!response.ok) {
      return res.status(200).json({ hint: fallbackHint || 'Think about what Python built-in functions might help here.' });
    }

    const data = await response.json();
    const hint = data.content?.[0]?.text?.trim() || fallbackHint || 'Think carefully!';

    res.setHeader('Cache-Control', 'no-store'); // hints should be fresh
    return res.status(200).json({ hint });

  } catch (err) {
    console.error('Hint handler error:', err);
    // Always return something useful even on error
    return res.status(200).json({ hint: fallbackHint || 'Think about what Python built-in functions might help here.' });
  }
}
