# Summer Project: AI-Powered Financial Asset Management Toolkit

## Overview

Build a lightweight AI-powered toolkit that helps asset managers analyze portfolios, summarize market data, and surface insights using Claude as the intelligence layer.

## Goals

- Reduce time spent on manual portfolio analysis and reporting
- Provide natural-language Q&A over financial data
- Generate structured summaries and risk flags automatically

## Toolkit Structure

The project is organized as a skill-based toolkit — each financial capability lives in its own folder under `finance-skills/`, with shared scripts and templates at the root level.

```
finance-toolkit/
├── finance-skills/
│   ├── portfolio-analyzer/       # Allocation breakdown, performance summary
│   ├── market-brief/             # Daily/weekly AI-generated market summaries
│   ├── risk-flag/                # Threshold monitoring and alerts
│   ├── nl-query/                 # Natural language Q&A over portfolio data
│   ├── sector-exposure/          # Sector and asset class breakdown
│   └── benchmark-compare/        # Performance vs benchmark (S&P 500, etc.)
├── scripts/
│   ├── run-skill.sh              # Run any skill by name
│   ├── install-deps.sh           # Install all Python dependencies
│   └── test-skills.sh            # Run tests across all skills
├── templates/
│   ├── PORTFOLIO.csv             # Sample portfolio input
│   └── SKILL.md                  # Template for adding a new skill
├── docs/
│   └── skills-guide.md           # How to use and extend the toolkit
├── output/                        # Generated reports and briefs
└── README.md
```

Each skill folder contains:
- `skill.py` — the core logic
- `prompt.md` — the Claude prompt template
- `README.md` — what the skill does and how to run it

## Core Skills

1. **portfolio-analyzer** — Upload a CSV, get AI-generated summaries: allocation breakdown, concentration risk, performance vs benchmark.
2. **market-brief** — Pull recent market data and generate a daily/weekly plain-English brief for a given set of tickers or asset classes.
3. **risk-flag** — Monitor portfolio positions and surface alerts when thresholds are breached (e.g., single asset > 20% weight, sector overexposure).
4. **nl-query** — Ask questions like "What's my exposure to tech?" or "Which positions are underperforming YTD?" and get structured answers.
5. **sector-exposure** — Break down portfolio by sector and asset class.
6. **benchmark-compare** — Compare portfolio performance against a chosen benchmark.

## Tech Stack

- **Backend:** Python, FastAPI
- **AI:** Claude API (claude-sonnet-4-6) with tool use for structured outputs
- **Data:** yfinance or Alpha Vantage for market data; CSV upload for portfolio data
- **Storage:** SQLite for local persistence
- **Frontend:** Simple HTML/JS interface or CLI (your choice)

## Out of Scope

- Live trading or order execution
- Real-time streaming data feeds
- Multi-user auth (single user only for now)

## Deliverables

- Working FastAPI app with the four features above
- Clean README with setup instructions
- Sample portfolio CSV for testing

## Timeline

| Week | Focus |
|------|-------|
| 1 | Project setup, environment, data ingestion pipeline |
| 2 | Portfolio analyzer — allocation breakdown and performance summary |
| 3 | Portfolio analyzer — concentration risk and benchmark comparison |
| 4 | Market brief generator — data pull and AI summary generation |
| 5 | Risk flag agent — threshold monitoring and alert system |
| 6 | Natural language query feature |
| 7 | Frontend / CLI interface and API integration |
| 8 | Polish, testing, documentation, final demo |

## For the Developer

**Who this is for:** A developer with working knowledge of Python and REST APIs. No prior finance experience required — the AI handles the domain reasoning.

**Expectations:**
- Weekly check-ins to share progress and blockers
- Commit code to a private GitHub repo with clear commit messages
- Ask early if requirements are unclear — don't build in the wrong direction for a week

**Getting started:**
1. Clone the repo and set up a Python virtual environment
2. Add your `ANTHROPIC_API_KEY` to a `.env` file
3. Run the sample portfolio CSV through the analyzer to verify the setup works

**Coding guidelines:**
- Keep functions small and focused — one responsibility per function
- Use Claude tool use (structured JSON) for all AI responses — no free-text parsing
- Write a short docstring only when the purpose isn't obvious from the name
- Don't add features beyond what's scoped here without checking first

**Questions or blockers:** Reach out via email at majidraza@gmail.com

---

## Success Criteria

- All four features functional end-to-end with sample data
- Claude responses return structured JSON (not free text) where applicable
- README allows a new developer to run the project from scratch in under 10 minutes
