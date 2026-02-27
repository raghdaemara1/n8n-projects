import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const MOCK_REPORTS = [
    {
        id: 'mock-1',
        week_start: '2025-02-24',
        project_count: 3,
        doc_count: 2,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        report_markdown: `# 📊 Weekly Intelligence Report — Week of Feb 24, 2025

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
4. Escalate Toyota delivery risk to delivery manager

## KPI Summary

| KPI | This Week | Target | Status |
|---|---|---|---|
| New Projects | 3 | 3+ | ✅ On Track |
| Avg Response Time | 4.2s | <10s | ✅ On Track |
| Agent Queries | 12 | — | — |
| Error Rate | 0% | <1% | ✅ On Track |`,
    },
]

export default function ReportsArchive() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [viewMode, setViewMode] = useState('markdown') // 'markdown' | 'html'

    useEffect(() => {
        fetch(`${API}/api/reports`)
            .then(r => r.json())
            .then(data => setReports(data.length ? data : MOCK_REPORTS))
            .catch(() => setReports(MOCK_REPORTS))
            .finally(() => setLoading(false))
    }, [])

    const downloadPDF = report => {
        const html = report.report_html || `<html><body><pre>${report.report_markdown}</pre></body></html>`
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `EWIS-Report-${report.week_start || 'latest'}.html`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            <div className="page-header">
                <h1>▦ &nbsp;Reports Archive</h1>
                <p>AI-generated weekly intelligence reports — executive briefings for every Monday</p>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Reports List */}
                    <div className="card" style={{ padding: '1rem' }}>
                        <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                            <span className="section-title" style={{ fontSize: '0.9rem' }}>▦ All Reports ({reports.length})</span>
                        </div>

                        {loading && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                                Loading...
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {reports.map(report => (
                                <button
                                    key={report.id}
                                    id={`report-${report.id}`}
                                    onClick={() => setSelected(report)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        padding: '0.875rem 1rem',
                                        background: selected?.id === report.id ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${selected?.id === report.id ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        text: 'left',
                                        transition: 'var(--transition)',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: selected?.id === report.id ? 'var(--accent-light)' : 'var(--text-primary)' }}>
                                        Week of {report.week_start || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                                        <span>◑ {report.project_count} projects</span>
                                        <span>◈ {report.doc_count} docs</span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                                    </div>
                                </button>
                            ))}

                            {!loading && reports.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    No reports yet. Run Workflow 4 in n8n to generate the first report.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Report Viewer */}
                    <div>
                        {selected ? (
                            <div>
                                {/* Toolbar */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            id="btn-view-markdown"
                                            className={`btn btn-sm ${viewMode === 'markdown' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setViewMode('markdown')}
                                        >
                                            ◐ Markdown
                                        </button>
                                        <button
                                            id="btn-view-html"
                                            className={`btn btn-sm ${viewMode === 'html' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setViewMode('html')}
                                        >
                                            ◑ HTML Preview
                                        </button>
                                    </div>
                                    <button
                                        id="btn-download-report"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => downloadPDF(selected)}
                                    >
                                        ↓ Download HTML
                                    </button>
                                </div>

                                <div id="report-viewer" className="card" style={{ minHeight: '500px' }}>
                                    {viewMode === 'markdown' ? (
                                        <div className="prose">
                                            <ReactMarkdown>{selected.report_markdown || '*No markdown content available.*'}</ReactMarkdown>
                                        </div>
                                    ) : selected.report_html ? (
                                        <iframe
                                            srcDoc={selected.report_html}
                                            style={{ width: '100%', minHeight: '500px', border: 'none', borderRadius: 'var(--radius-md)', background: 'white' }}
                                            title="Report HTML Preview"
                                        />
                                    ) : (
                                        <div className="prose">
                                            <ReactMarkdown>{selected.report_markdown || ''}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)', gap: '0.75rem' }}>
                                <div style={{ fontSize: '3rem', opacity: 0.3 }}>▦</div>
                                <div style={{ fontSize: '0.9rem' }}>Select a report to view</div>
                                <div style={{ fontSize: '0.78rem' }}>Reports are generated every Monday at 8:00 AM</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
