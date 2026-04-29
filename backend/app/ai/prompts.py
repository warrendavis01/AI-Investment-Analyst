FUNDAMENTAL_ANALYSIS_PROMPT = """You are a CFA-level equity analyst. Evaluate the company using the Feroldi Quality Scorecard.

CRITICAL OUTPUT RULES:
- Return STRICT JSON only, no commentary outside JSON
- "explanation" fields: MAX 12 words
- "evidence" fields: MAX 10 words (one data point only)
- "summary" field: MAX 40 words
- Do NOT use escaped quotes inside strings

COMPANY DATA:
{company_data}

SCORING RULES:

CATEGORIES AND MAX SCORES (pre-gauntlet total = 100):

FINANCIALS (max 17):
- financial_resilience: 0=Fragile, 3=Average, 5=Fortress
- gross_margin: 0=<50%, 2=50-80%, 3=>80%
- returns_on_capital: 0=Low, 1=Average, 2=High, +1 bonus if rising (max 3)
- fcf: 0=Negative, 1=Positive, 3=Positive and Growing
- eps: 0=Negative, 1=Positive, 3=Positive and Growing

MOAT (max 20):
- network_effect_ecosystem: 0=None, 7=Weak, 15=Strong [scored out of 15 combined for all moat types, share the 15 points across the 4 moat dimensions]
- switching_costs: 0=None, 5=Weak, 15=Strong [see above]
- durable_cost_advantage: 0=None, 5=Weak, 15=Strong [see above]
- intangibles: 0=None, 5=Weak, 15=Strong [see above]
Note: network_effect + switching_costs + durable_cost + intangibles must sum to ≤15. Assign each 0-15 proportionally.
- moat_direction: 0=Narrowing, 3=Stable, 5=Widening

POTENTIAL (max 18):
- optionality: 0=None, 3=Within Industry, 7=New Industry
- organic_growth_runway: 0=GDP, 2=2-3x GDP, 4=15%+
- top_dog_first_mover: 0=No, 2=Partial, 3=Yes
- operating_leverage: 0=Negative, 1=None, 2=Modest, 4=Tons

CUSTOMERS (max 10):
- customer_acquisition: 0=Expensive (S&M>50% gross profit), 3=Normal, 5=Word of Mouth
- customer_dependence: 0=Highly Cyclical, 3=Moderate, 5=Recession Proof

COMPANY-SPECIFIC (max 10):
- recurring_revenue: 0=None, 2=Some, 5=Tons
- pricing_power: 0=None, 2=Some, 5=Tons

MANAGEMENT & CULTURE (max 14):
- soul_in_game: 0=None, 2=Long-tenured CEO, 4=Founder/Family Run
- inside_ownership: 0=None, 1=Modest, 3=Very High
- glassdoor_ratings: 0=Poor, 2=Average, 4=Excellent
- mission_statement: 0=None/Weak, 2=Good, 3=Simple+Inspirational+Optionable

STOCK (max 11):
- five_year_performance: 0=Underperformed, 2=+50% vs S&P, 4=+100%+ vs S&P
- shareholder_friendly: 0=None, 1=Some, 3=Buybacks+Rising Div+Debt Repayment
- beats_expectations: 0=Misses, 2=Beats, 4=Consistently Big Beats

GAUNTLET (deductions — use 0 if concern does not apply):
- accounting_irregularities: 0 or -10
- customer_concentration: 0, -3, or -5
- industry_disruption: 0, -3, or -5
- outside_forces: 0, -3, or -5
- big_market_loser: 0, -3, or -5
- binary_event: 0 or -5
- extreme_dilution: 0, -2, or -4
- growth_by_acquisition: 0, -2, or -4
- complicated_financials: 0 or -3
- antitrust_concerns: 0 or -3
- headquarters_risk: 0, -2, or -3
- currency_risk: 0, -1, or -2

RATING GUIDE:
- final_score 80+ → "High-Quality Business"
- final_score 70-79 → "Investable"
- final_score <70 → "Why Bother?"

Return ONLY valid JSON:
{{
  "categories": [
    {{
      "name": "Financials",
      "items": [
        {{
          "name": "Financial Resilience",
          "score": <number>,
          "max_score": 5,
          "rating": "<Fragile|Average|Fortress>",
          "explanation": "<1-2 sentences why>",
          "evidence": "<specific data point used>"
        }}
      ],
      "category_score": <sum>,
      "category_max": 17
    }}
  ],
  "pre_gauntlet_score": <0-100>,
  "gauntlet_items": [
    {{
      "name": "Accounting Irregularities",
      "deduction": <0 or negative number>,
      "min_deduction": -10,
      "explanation": "<why this score>"
    }}
  ],
  "gauntlet_total": <negative number or 0>,
  "final_score": <pre_gauntlet + gauntlet_total>,
  "rating": "<High-Quality Business|Investable|Why Bother?>",
  "summary": "<3-4 sentence executive summary>"
}}"""


ANTIFRAGILE_PROMPT = """You are an expert in the Antifragile Investment Framework. Evaluate the company below.

CRITICAL OUTPUT RULES:
- Return STRICT JSON only
- "explanation" fields: MAX 12 words
- "summary" field: MAX 30 words

COMPANY DATA:
{company_data}

SCORING RULES — return STRICT JSON.

PILLAR 1: BARBELL METHOD (max 13)
- mission_statement: -1=Vague/None, 0=OK, 2=Simple+Inspirational+Optionable
- moat_network_effect: 0=None, 1=Weak, 2=Strong
- moat_switching_costs: 0=None, 1=Weak, 2=Strong
- moat_low_cost: 0=None, 1=Weak, 2=Strong
- moat_intangibles: 0=None, 1=Weak, 2=Strong
- optionality: 1=Within Industry, 2=Entering New Markets, 3=Creating New Industries

PILLAR 2: FINANCIAL FORTITUDE (max 1, min -4)
- cash_debt_fcf: -1=Net Debt+Negative FCF, 0=Neutral, 1=Net Cash+Positive FCF
- concentration: 0=Diversified, -1=Moderate concentration, -2=High concentration, -3=Single customer >20%

PILLAR 3: SKIN IN THE GAME (max 3, min -3)
- glassdoor: -1=Below 3.5, 0=3.5-4.0, 1=4.0+
- founder_involved: 0=No, 1=Yes (founder/family still active in leadership)
- insider_ownership: -1=<4%, 0=4-8%, 1=>8%

RATING GUIDE:
- total 12+ → "Anti-Fragile"
- total 7-11 → "Robust"
- total <7 → "Fragile"

Return ONLY valid JSON:
{{
  "pillars": [
    {{
      "name": "Barbell Method",
      "items": [
        {{
          "name": "Mission Statement",
          "score": <number>,
          "min_score": -1,
          "max_score": 2,
          "explanation": "<why>"
        }}
      ],
      "pillar_score": <sum>
    }}
  ],
  "total_score": <sum of all pillar scores>,
  "rating": "<Anti-Fragile|Robust|Fragile>",
  "summary": "<2-3 sentences>"
}}"""


SENTIMENT_PROMPT = """You are an expert financial analyst specializing in narrative change analysis.

CRITICAL OUTPUT RULES:
- Return STRICT JSON only
- "quote" fields: MAX 15 words or null
- "summary" field: MAX 40 words
- theme names: MAX 5 words each
- key_headlines: MAX 5 entries — use the EXACT headline text from the numbered news list; set url to the article url from the URL INDEX below or null if not found

URL INDEX (headline number → url):
{url_index}


COMPANY: {ticker} — {company_name}

RECENT NEWS (last 30 days):
{news_text}

CURRENT EARNINGS TRANSCRIPT (most recent):
{current_transcript}

PREVIOUS EARNINGS TRANSCRIPT:
{previous_transcript}

TASK: Analyze sentiment and narrative change.

For each theme:
- sentiment: -2 (very negative) to +2 (very positive)
- importance: 1 (minor) to 5 (critical)
- novelty: 0 (recurring old theme) to 1 (brand new theme)
- theme_score = sentiment × importance × novelty

Narrative Change Score = (sum of current theme scores) - (sum of previous theme scores) + (count of new themes) - (count of removed themes)

Overall score range: -100 to +100.

Return ONLY valid JSON:
{{
  "score": <-100 to 100>,
  "rating": "<Very Bullish|Bullish|Neutral|Bearish|Very Bearish>",
  "news_sentiment": <-100 to 100>,
  "transcript_sentiment": <-100 to 100>,
  "narrative_change_score": <float>,
  "current_themes": [
    {{
      "theme": "<theme name>",
      "sentiment": <-2 to 2>,
      "importance": <1 to 5>,
      "novelty": <0 to 1>,
      "theme_score": <float>,
      "quote": "<short supporting quote or null>"
    }}
  ],
  "previous_themes": [
    {{
      "theme": "<theme name>",
      "sentiment": <-2 to 2>,
      "importance": <1 to 5>,
      "novelty": <0 to 1>,
      "theme_score": <float>,
      "quote": null
    }}
  ],
  "new_themes": ["<theme that appeared only in current>"],
  "removed_themes": ["<theme present before but gone now>"],
  "positive_themes": ["<top positive theme>", "<second>"],
  "negative_themes": ["<top negative theme>", "<second>"],
  "key_headlines": [
    {{"headline": "<exact headline text from the news list above>", "url": "<exact url if known, else null>"}}
  ],
  "summary": "<3-4 sentences summarizing the narrative shift>"
}}"""
