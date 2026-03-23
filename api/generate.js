// api/generate.js
// Vercel serverless function — proxies Claude API for question generation
// API key stays server-side, never exposed to the browser

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sectionTitle, sectionDesc, sectionId } = req.body;

  if (!sectionTitle) {
    return res.status(400).json({ error: 'sectionTitle is required' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are generating quiz questions for a Python learning game about "${sectionTitle}".

Generate exactly 5 questions as a JSON array. Each question must be one of these types:

1. type "learn" — a concept card:
   {"type":"learn","title":"...","body":"explanation text","code":"optional code as HTML with these span classes: cs-kw cs-fn cs-var cs-str cs-num cs-cm"}

2. type "quiz" — multiple choice:
   {"type":"quiz","q":"question text","opts":["A","B","C","D"],"answer":0,"explain":"why correct answer is right"}

3. type "fill" — fill in the blank:
   {"type":"fill","q":"question text","answer":"exact answer","hint":"a short hint","explain":"explanation"}

Rules:
- Start with exactly 1 "learn" card, then 4 questions (mix of quiz and fill)
- Questions must be practical, real Python scenarios — not trivial
- Code in learn cards must use the span classes listed above (e.g. <span class="cs-kw">def</span>)
- Fill answers should be single words or very short expressions (e.g. "append", "return", "==")
- answer in quiz is a 0-based index into opts array
- Cover interesting aspects of: ${sectionDesc}
- Make questions varied — different difficulty, different angles on the concept

Respond with ONLY the raw JSON array. No markdown. No explanation. No backticks.`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/gi, '').trim();

    let questions;
    try {
      questions = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse failed:', clean);
      return res.status(502).json({ error: 'Failed to parse AI response' });
    }

    if (!Array.isArray(questions) || questions.length < 3) {
      return res.status(502).json({ error: 'Invalid question format from AI' });
    }

    // Cache for 1 hour — same section can be cached briefly
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ questions });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
