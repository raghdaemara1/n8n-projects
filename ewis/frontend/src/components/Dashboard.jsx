import React, { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const COLORS = ['#6c63ff', '#00d4aa', '#ffd93d', '#ff6b6b', '#74b9ff', '#a29bfe']

const MOCK_STATS = {
    total_projects_week: 3,
    active_workflows: 4,
    agent_queries_today: 0,
    reports_generated: 1,
    category_breakdown: [
        { category: 'ai_automation', count: 1 },
        { category: 'cloud_migration', count: 1 },
        { category: 'iot', count: 1 },
    ],
    recent_workflows: [
        { name: 'Smart Intake Router', status: 'active', last_run: '2 min ago', duration: '3.2s' },
        { name: 'Document Analyzer', status: 'active', last_run: '15 min ago', duration: '8.1s' },
        { name: 'AI Agent Relay', status: 'active', last_run: '1 hr ago', duration: '12.4s' },
        { name: 'Weekly Report Generator', status: 'active', last_run: 'Monday 08:00', duration: '45.8s' },
    ],
}

const KPI_CONFIG = [
    { key: 'total_projects_week', label: 'Projects This Week', icon: '◑', color: '#6c63ff', sub: 'last 7 days' },
    { key: 'active_workflows', label: 'Active Workflows', icon: '⟳', color: '#00d4aa', sub: 'running in n8n' },
    { key: 'agent_queries_today', label: 'Agent Queries Today', icon: '◎', color: '#ffd93d', sub: 'ADK interactions' },
    { key: 'reports_generated', label: 'Reports Generated', icon: '▦', color: '#74b9ff', sub: 'total archived' },
]

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label?.replace('_', ' ')}</p>
            <p style={{ color: '#6c63ff', fontWeight: 700, fontSize: '1.1rem' }}>{payload[0].value}</p>
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API}/api/stats`)
            .then(r => r.json())
            .then(setStats)
            .catch(() => setStats(MOCK_STATS))
            .finally(() => setLoading(false))
    }, [])

    const data = stats || MOCK_STATS

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Real-time enterprise workflow intelligence — EWIS v1.0</p>
            </div>

            <div className="page-content">
                <div className="kpi-grid">
                    {KPI_CONFIG.map(cfg => (
                        <div
                            key={cfg.key}
                            className="kpi-card"
                            style={{ '--kpi-color': cfg.color }}
                            id={`kpi-${cfg.key}`}
                        >
                            <div className="kpi-label">
                                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                                {cfg.label}
                            </div>
                            <div className="kpi-value" style={{ color: cfg.color }}>
                                {loading ? '—' : data[cfg.key]}
                            </div>
                            <div className="kpi-sub">{cfg.sub}</div>
                            <div className="kpi-icon">{cfg.icon}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.25rem' }}>
                    <div className="card">
                        <div className="section-header">
                            <span className="section-title">⟳ &nbsp;Workflow Status</span>
                            <span className="badge badge-active">● Live</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {data.recent_workflows.map((wf, i) => (
                                <div
                                    key={i}
                                    id={`workflow-row-${i}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.875rem 1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                            {wf.name}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Last run: {wf.last_run} · {wf.duration}
                                        </div>
                                    </div>
                                    <span className="badge badge-active">● {wf.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="section-header">
                            <span className="section-title">◈ &nbsp;Project Categories</span>
                            <span className="section-sub">this week</span>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data.category_breakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="category"
                                    tick={{ fill: '#9090b8', fontSize: 11 }}
                                    tickFormatter={v => v.replace('_', ' ')}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis tick={{ fill: '#9090b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.06)' }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {data.category_breakdown.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card mt-4" style={{ marginTop: '1.25rem' }}>
                    <div className="section-header">
                        <span className="section-title">◑ &nbsp;System Architecture</span>
                    </div>
                    <div className="code-block" style={{ fontSize: '0.72rem', lineHeight: 1.9, color: '#a29bfe' }}>
                        {`                    ┌──────────────────────────┐
                    │     React Dashboard       │  ← localhost:3000
                    │   (this interface)        │
                    └─────────┬────────────────┘
                              │ REST API calls
                    ┌─────────▼────────────────┐
                    │     FastAPI Backend       │  ← localhost:8000
                    └──┬──────────┬─────────────┘
                       │          │
        ┌──────────────▼──┐   ┌───▼──────────────────┐
        │   n8n Workflows  │   │  Google ADK Agent     │  ← Gemini 1.5 Pro
        │  localhost:5679  │   │  Tools: classify,     │
        │                  │   │  estimate, recommend, │
        │ WF1: Intake      │   │  search_kb, analyze   │
        │ WF2: Documents   │◀──┤                       │
        │ WF3: Agent Relay │──▶│                       │
        │ WF4: Reports     │   └──────────────────────┘
        └────────┬─────────┘
                 │
        ┌────────▼──────────┐
        │    PostgreSQL     │  ← localhost:5432
        └───────────────────┘`}
                    </div>
                </div>
            </div>
        </div>
    )
}
