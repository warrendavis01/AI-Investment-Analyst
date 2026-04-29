#!/bin/bash
set -e

echo "=== AI Investment Analyst — Setup ==="

# Backend
echo ""
echo "--- Setting up Python backend ---"
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created backend/.env — fill in your API keys before running"
fi

python3 -m venv venv
source venv/bin/activate
pip install --quiet -r requirements.txt
echo "Backend dependencies installed"
cd ..

# Frontend
echo ""
echo "--- Setting up Next.js frontend ---"
cd frontend
npm install --silent
echo "Frontend dependencies installed"
cd ..

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env and add your API keys:"
echo "       ANTHROPIC_API_KEY=..."
echo "       FMP_API_KEY=...         (free at financialmodelingprep.com)"
echo "       NEWS_API_KEY=...        (free at newsapi.org)"
echo ""
echo "  2. Start the backend:"
echo "       cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "  3. Start the frontend (new terminal):"
echo "       cd frontend && npm run dev"
echo ""
echo "  4. Open http://localhost:3000"
