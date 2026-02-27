"""
EWIS ADK Agent Tools — 5 custom tool implementations
"""
import os
import json
import google.generativeai as genai
from agent.prompts import CLASSIFY_PROMPT, EFFORT_PROMPT, RECOMMEND_PROMPT, RISK_PROMPT

# Configure Gemini
_gemini_api_key = os.getenv("GOOGLE_API_KEY", "")
if _gemini_api_key:
    genai.configure(api_key=_gemini_api_key)

_model = genai.GenerativeModel("gemini-1.5-pro") if _gemini_api_key else None


def _gemini_call(prompt: str) -> dict:
    """Make a Gemini API call and parse the JSON response."""
    if not _model:
        return {"error": "GOOGLE_API_KEY not configured", "mock": True}
    try:
        response = _model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}


def classify_project(description: str) -> dict:
    """
    Classifies a project description into category, complexity, tech stack.

    Args:
        description: The project description to classify.

    Returns:
        dict with: category, complexity_score, estimated_days,
                   recommended_team_size, key_technologies, summary
    """
    # Mock response for demo when API key not set
    if not _model:
        return {
            "category": "ai_automation",
            "complexity_score": 8,
            "estimated_days": 90,
            "recommended_team_size": 5,
            "key_technologies": ["n8n", "Gemini", "FastAPI", "PostgreSQL"],
            "summary": "AI-powered automation system for enterprise workflows. Integrates multiple AI services with robust error handling and monitoring.",
            "mock": True
        }
    prompt = f"{CLASSIFY_PROMPT}\n\nProject Description:\n{description}"
    return _gemini_call(prompt)


def estimate_effort(category: str, complexity: int, team_size: int) -> dict:
    """
    Returns effort estimate for a project.

    Args:
        category: Project category (e.g., ai_automation, cloud_migration)
        complexity: Complexity score from 1-10
        team_size: Recommended team size

    Returns:
        dict with: timeline_weeks, cost_range, risk_level
    """
    if not _model:
        timelines = {"ai_automation": 16, "cloud_migration": 24, "data_analytics": 12}
        weeks = timelines.get(category, 20) + complexity
        return {
            "timeline_weeks": weeks,
            "cost_range": f"${weeks * team_size * 8}k-${weeks * team_size * 15}k",
            "risk_level": "high" if complexity >= 7 else "medium" if complexity >= 4 else "low",
            "mock": True
        }
    prompt = f"{EFFORT_PROMPT}\n\nCategory: {category}\nComplexity Score: {complexity}/10\nTeam Size: {team_size}"
    return _gemini_call(prompt)


def recommend_tech_stack(requirements: str, constraints: str) -> dict:
    """
    Returns recommended technologies and architecture pattern.

    Args:
        requirements: Project requirements description
        constraints: Technical or business constraints

    Returns:
        dict with: primary_technologies, architecture_pattern, integration_approach, rationale
    """
    if not _model:
        return {
            "primary_technologies": ["n8n", "FastAPI", "PostgreSQL", "React", "Google ADK", "Docker"],
            "architecture_pattern": "Event-driven microservices with workflow orchestration",
            "integration_approach": "Webhook-based event ingestion with async processing queues",
            "rationale": "This stack balances rapid development velocity with enterprise scalability. n8n provides visual workflow management while FastAPI and ADK handle AI reasoning. Docker ensures consistent deployment across environments.",
            "mock": True
        }
    prompt = f"{RECOMMEND_PROMPT}\n\nRequirements: {requirements}\nConstraints: {constraints}"
    return _gemini_call(prompt)


def search_knowledge_base(query: str, db_session=None) -> list:
    """
    Searches internal PostgreSQL knowledge base for similar past projects.

    Args:
        query: Search query string

    Returns:
        list of relevant project summaries
    """
    # In production this would do semantic search; for demo, return mock results
    mock_results = [
        {
            "project_title": "AI Customer Service Automation — Retail",
            "category": "ai_automation",
            "complexity_score": 7,
            "ai_summary": "Deployed n8n-based ticket classification with GPT-4, achieving 78% auto-resolution rate.",
            "similarity_score": 0.92
        },
        {
            "project_title": "Legacy ERP Migration to Cloud — Manufacturing",
            "category": "cloud_migration",
            "complexity_score": 9,
            "ai_summary": "SAP S/4HANA migration for 800-user manufacturing plant, completed in 28 weeks.",
            "similarity_score": 0.81
        },
        {
            "project_title": "Real-time Analytics Platform — BFSI",
            "category": "data_analytics",
            "complexity_score": 8,
            "ai_summary": "Streaming analytics platform processing 2M events/day with sub-second latency dashboards.",
            "similarity_score": 0.74
        }
    ]
    # Simple keyword filter
    query_lower = query.lower()
    return [r for r in mock_results if any(
        kw in query_lower for kw in [r["category"].replace("_", " "), r["project_title"].split(" ")[0].lower()]
    )] or mock_results[:2]


def analyze_risk(project_description: str, timeline_weeks: int) -> dict:
    """
    Assesses delivery, technical, and integration risks for a project.

    Args:
        project_description: Full project description
        timeline_weeks: Estimated timeline in weeks

    Returns:
        dict with: delivery_risk, technical_risk, integration_risk, top_mitigations
    """
    if not _model:
        tight_timeline = timeline_weeks < 12
        return {
            "delivery_risk": 8 if tight_timeline else 6,
            "technical_risk": 7,
            "integration_risk": 6,
            "top_mitigations": [
                "Conduct a 2-week discovery spike before full development begins",
                "Implement CI/CD pipeline from day one to reduce integration failures",
                "Establish weekly client checkpoints with a defined escalation path"
            ],
            "mock": True
        }
    prompt = f"{RISK_PROMPT}\n\nProject Description: {project_description}\nTimeline: {timeline_weeks} weeks"
    return _gemini_call(prompt)
