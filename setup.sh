#!/bin/bash
# CodeQuest — GitHub Repo Setup Script
# Run this from inside the codequest/ directory

echo "🚀 Setting up CodeQuest repo..."

# Initialize git
git init
git add .
git commit -m "feat: initial commit — CodeQuest AI-powered coding game

- Landing page with editorial UI
- 7-section game (Variables → APIs)
- AI question generation via Claude Sonnet
- Global leaderboard with persistent storage
- XP system, streaks, combo multiplier"

echo ""
echo "✅ Git repo initialized!"
echo ""
echo "Next steps:"
echo ""
echo "1. Create a new repo on GitHub:"
echo "   → Go to https://github.com/new"
echo "   → Name it: codequest"
echo "   → Don't add README (we already have one)"
echo ""
echo "2. Push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/codequest.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   → Settings → Pages → Source: main / root"
echo "   → Live at: https://YOUR_USERNAME.github.io/codequest"
echo ""
echo "🎮 That's it. Your game is live!"
