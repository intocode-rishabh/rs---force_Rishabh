const router = require('express').Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required.' });
  next();
}

// POST /api/ai/enhance-bio
router.post('/enhance-bio', requireAuth, async (req, res) => {
  try {
    const { bio } = req.body;
    if (!bio || bio.trim().length < 5)
      return res.status(400).json({ error: 'Bio too short to enhance.' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'You are a professional bio writer. Rewrite the given profile bio to be more professional, engaging, and polished. Keep it concise (2-3 sentences max), natural, first-person, and appropriate for a local services marketplace. Return ONLY the rewritten bio, no explanations. write in genz language and keep it nonchalant and use some of the emojies also'
          },
          {
            role: 'user',
            content: bio
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq API error');

    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (!enhanced) throw new Error('No response from AI');

    res.json({ enhanced });
  } catch (err) {
    console.error('AI enhance error:', err.message);
    res.status(500).json({ error: 'AI enhancement failed. Try again.' });
  }
});

module.exports = router;
