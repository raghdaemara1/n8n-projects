"""
EWIS Database Seed Script — load demo fixture data
Run: python seed.py
"""
import os
import sys
import json
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.database import SessionLocal, init_db
from db.models import Project, Document, Report

import markdown as md_lib


def seed():
    init_db()
    db = SessionLocal()

    try:
        # ── Projects ───────────────────────────────────────────────────────────
        projects_data = [
            {
                "client_name": "Accenture Global",
                "project_title": "AI-Powered Customer Service Automation",
                "description": "Replace legacy customer support system with AI-driven solution handling 80% of Tier 1 tickets, Salesforce integration, 12-language support.",
                "priority": "high",
                "requester_email": "intake@accenture.com",
                "category": "ai_automation",
                "complexity_score": 8,
                "estimated_days": 90,
                "recommended_team_size": 5,
                "key_technologies": ["n8n", "OpenAI GPT-4", "Salesforce API", "Multi-lingual NLP", "Vector Database"],
                "ai_summary": "AI-powered customer service automation with Salesforce integration supporting 12 languages and targeting 80% ticket auto-resolution.",
            },
            {
                "client_name": "Toyota Motors Europe",
                "project_title": "Manufacturing IoT Data Platform",
                "description": "Real-time telemetry collection from 2,000+ factory floor sensors, predictive maintenance ML models, executive dashboards.",
                "priority": "critical",
                "requester_email": "digital@toyota-europe.com",
                "category": "iot",
                "complexity_score": 9,
                "estimated_days": 120,
                "recommended_team_size": 7,
                "key_technologies": ["AWS IoT Core", "Apache Kafka", "InfluxDB", "TensorFlow", "Grafana"],
                "ai_summary": "IoT data platform ingesting 2,000+ sensor streams for predictive maintenance and real-time factory intelligence.",
            },
            {
                "client_name": "HSBC Holdings",
                "project_title": "Legacy Core Banking Cloud Migration",
                "description": "Migrate core banking system from on-premise IBM mainframe to Azure cloud, zero-downtime cutover, full regulatory compliance.",
                "priority": "critical",
                "requester_email": "cto-office@hsbc.com",
                "category": "cloud_migration",
                "complexity_score": 10,
                "estimated_days": 180,
                "recommended_team_size": 12,
                "key_technologies": ["Azure", "IBM MQ", "Apache Kafka", "Terraform", "Azure DevOps", "COBOL Migration"],
                "ai_summary": "Core banking migration from IBM mainframe to Azure with zero-downtime strategy and full Basel III compliance maintenance.",
            },
        ]

        for p in projects_data:
            existing = db.query(Project).filter(Project.project_title == p["project_title"]).first()
            if not existing:
                project = Project(**p)
                db.add(project)

        # ── Documents ─────────────────────────────────────────────────────────
        docs_data = [
            {
                "filename": "sample-rfp-ai-automation.pdf",
                "extracted_entities": {
                    "people": ["John Smith (CTO)", "Sarah Jenkins (Procurement)"],
                    "organizations": ["Accenture", "Salesforce", "OpenAI"],
                    "dates": ["Q2 2025 delivery", "March 15 RFP deadline"],
                },
                "main_topics": ["AI chatbot deployment", "CRM integration", "Multilingual NLP", "Agent escalation logic"],
                "action_items": [
                    "Submit technical architecture proposal by March 15",
                    "Provide proof of concept for multilingual classification",
                    "Demonstrate Salesforce integration in sandbox environment",
                ],
                "risks": [
                    "Data privacy compliance across 12 languages/jurisdictions",
                    "Model hallucination in customer-facing responses",
                    "Salesforce API rate limits under peak load",
                ],
                "tech_mentions": ["GPT-4", "Salesforce CRM", "Zendesk", "AWS Lambda", "Pinecone Vector DB"],
                "executive_summary": "## Executive Summary\n\nThis RFP requests proposals for an AI-powered customer service automation system capable of handling 80% of Tier 1 support tickets autonomously. The system must integrate natively with Salesforce CRM, support 12 languages, and maintain a 98.5% uptime SLA.\n\n**Key Findings:** The client has a mature Salesforce deployment and requires minimal disruption to existing workflows. The primary technical challenge is multilingual intent classification with high confidence thresholds.\n\n**Risks:** GDPR and local data residency requirements across 12 markets represent the highest-priority risk requiring legal review.",
            },
            {
                "filename": "cloud-migration-architecture-spec.txt",
                "extracted_entities": {
                    "people": ["Michael Chen (Lead Architect)"],
                    "organizations": ["HSBC", "IBM", "Microsoft Azure"],
                    "dates": ["6-month migration window", "Weekend cutover slots"],
                },
                "main_topics": ["Mainframe modernisation", "Azure landing zone", "Data integrity validation", "Compliance"],
                "action_items": [
                    "Complete COBOL-to-Java transpilation audit for 450,000 LOC",
                    "Establish Azure landing zone with Hub-Spoke network topology",
                    "Define rollback procedures for each migration phase",
                ],
                "risks": [
                    "COBOL modernisation introduces logic errors in financial calculations",
                    "Regulatory reporting continuity during cutover window",
                    "Staff retraining for cloud-native operational model",
                ],
                "tech_mentions": ["COBOL", "IBM z/OS", "Azure", "Terraform", "Azure Monitor", "SonarQube"],
                "executive_summary": "## Executive Summary\n\nThis architecture specification outlines a phased approach to migrating HSBC's core banking ledger from IBM z/OS mainframe to Microsoft Azure. The migration covers 450,000 lines of COBOL business logic, 18 TB of transactional data, and 340 downstream system integrations.\n\n**Approach:** Blue-green deployment with shadow-mode validation at each phase gate ensures zero financial discrepancy before production cutover.\n\n**Recommended Actions:** Prioritise COBOL audit immediately; regulatory pre-approval for cloud hosting of Tier 1 banking data must be secured in Month 1.",
            },
        ]

        for d in docs_data:
            existing = db.query(Document).filter(Document.filename == d["filename"]).first()
            if not existing:
                doc = Document(**d)
                db.add(doc)

        # ── Report ────────────────────────────────────────────────────────────
        report_md = """# 📊 Weekly Intelligence Report — Week of Feb 24, 2025

## Executive Summary
This week saw strong project intake across AI Automation and Cloud Migration categories. Three high-complexity projects were onboarded from Tier 1 Fortune 500 clients, with total estimated delivery value exceeding $2.8M.

## Project Volume & Category Breakdown

| Category | Count | Avg Complexity |
|---|---|---|
| AI Automation | 1 | 8/10 |
| IoT | 1 | 9/10 |
| Cloud Migration | 1 | 10/10 |

## Key Themes This Week
- **AI-first client demand accelerating**: 2 of 3 projects have significant AI/ML components
- **Data residency compliance** emerging as a critical requirement across EMEA projects
- **Mainframe modernisation** pipeline growing — 3 qualified leads in backlog

## 🚨 Risk Alerts
- HSBC migration project is complexity-10; ensure senior architect allocation confirmed by EOD Friday
- Toyota IoT platform requires proprietary AWS IoT Core expertise — validate team skill gap

## Top Recommended Actions
1. Allocate Senior Cloud Architect to HSBC project immediately
2. Initiate AWS IoT Core training for Toyota project team
3. Prepare multilingual NLP POC for Accenture RFP submission (deadline: March 15)
4. Escalate Toyota delivery risk to delivery manager — timeline is aggressive

## KPI Summary

| KPI | This Week | Target | Status |
|---|---|---|---|
| New Projects | 3 | 3+ | ✅ On Track |
| Avg Response Time | 4.2s | <10s | ✅ On Track |
| Agent Queries | 12 | — | — |
| Error Rate | 0% | <1% | ✅ On Track |
"""
        report_html = """<html><head><style>
body { font-family: Inter, sans-serif; max-width: 900px; margin: 2rem auto; padding: 2rem; color: #1a1a2e; background: #f8f9fa; }
h1 { color: #6c63ff; border-bottom: 3px solid #6c63ff; padding-bottom: 0.5rem; }
h2 { color: #2d2d4e; margin-top: 2rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th { background: #6c63ff; color: white; padding: 10px; text-align: left; }
td { border: 1px solid #ddd; padding: 8px; }
tr:nth-child(even) { background: #f2f0ff; }
.alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin: 1rem 0; }
</style></head><body>""" + md_lib.markdown(report_md, extensions=["tables", "fenced_code"]) + "</body></html>"

        existing_report = db.query(Report).first()
        if not existing_report:
            report = Report(
                report_markdown=report_md,
                report_html=report_html,
                week_start=date.today() - timedelta(days=3),
                project_count=3,
                doc_count=2,
            )
            db.add(report)

        db.commit()
        print("✅ Seed data loaded successfully!")
        print(f"   → 3 projects, 2 documents, 1 report")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
