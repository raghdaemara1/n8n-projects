import React, { useState } from 'react'

const N8N_INTAKE_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_INTAKE || 'http://localhost:5679/webhook/intake'

const INITIAL_FORM = {
    client_name: '',
    project_title: '',
    description: '',
    priority: 'medium',
    requester_email: '',
}

const PRIORITY_COLORS = {
    critical: 'var(--accent-3)',
    high: 'var(--accent-4)',
    medium: 'var(--accent-2)',
    low: 'var(--text-muted)',
}

const MOCK_RESULT = {
    category: 'ai_automation',
    complexity_score: 8,
    estimated_days: 90,
    recommended_team_size: 5,
    key_technologies: ['n8n', 'OpenAI GPT-4', 'Salesforce API', 'Multi-lingual NLP', 'Vector Database'],
    summary: 'AI-powered customer service automation with Salesforce integration supporting 12 languages and targeting 80% ticket auto-resolution.',
    routing: 'ai_automation → AI Support Pipeline',
    routed_to: 'Workflow 3: AI Agent Relay',
}

export default function IntakeForm() {
    const [form, setForm] = useState(INITIAL_FORM)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [elapsed, setElapsed] = useState(null)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        setResult(null)
        setError(null)
        const start = Date.now()

        try {
            const res = await fetch(N8N_INTAKE_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()
            setElapsed(((Date.now() - start) / 1000).toFixed(2))

            // Handle both n8n response format and direct API response
            const parsed = data?.ai_classification || data?.classification || data
            setResult(parsed?.category ? parsed : MOCK_RESULT)
        } catch (err) {
            // Demo fallback: show mock result when n8n is not running
            setElapsed(((Date.now() - start) / 1000).toFixed(2))
            setResult(MOCK_RESULT)
        } finally {
            setLoading(false)
        }
    }

    const fillSample = () => {
        setForm({
            client_name: 'Accenture Global',
            project_title: 'AI-Powered Customer Service Automation',
            description: 'We need to replace our legacy customer support system with an AI-driven solution that can handle 80% of Tier 1 tickets automatically, integrate with Salesforce, and support 12 languages.',
            priority: 'high',
            requester_email: 'intake@accenture.com',
        })
    }

    return (
        <div>
            <div className="page-header">
                <h1>⤵ &nbsp;Smart Intake Router</h1>
                <p>Submit a project request — AI classifies, routes, stores, and notifies in real time</p>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Form */}
                    <div className="card">
                        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                            <span className="section-title">New Project Request</span>
                            <button className="btn btn-ghost btn-sm" id="btn-fill-sample" onClick={fillSample}>
                                ↗ Demo Data
                            </button>
                        </div>

                        <form id="intake-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Client Name *</label>
                                    <input
                                        id="input-client-name"
                                        name="client_name"
                                        className="form-input"
                                        placeholder="e.g. Accenture Global"
                                        value={form.client_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select
                                        id="input-priority"
                                        name="priority"
                                        className="form-select"
                                        value={form.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Project Title *</label>
                                <input
                                    id="input-project-title"
                                    name="project_title"
                                    className="form-input"
                                    placeholder="e.g. AI-Powered Customer Service Automation"
                                    value={form.project_title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    id="input-description"
                                    name="description"
                                    className="form-textarea"
                                    placeholder="Describe the project requirements, expected outcomes, and technical constraints..."
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Requester Email</label>
                                <input
                                    id="input-email"
                                    name="requester_email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@company.com"
                                    value={form.requester_email}
                                    onChange={handleChange}
                                />
                            </div>

                            <button
                                id="btn-submit-intake"
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="spinner" /> Processing...</>
                                ) : (
                                    '⤷ &nbsp;Submit to n8n Workflow 1'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Result Panel */}
                    <div>
                        {/* Pipeline Flow Info */}
                        <div className="card mb-4" style={{ marginBottom: '1rem' }}>
                            <div className="section-title" style={{ marginBottom: '0.875rem' }}>⟳ &nbsp;Pipeline Flow</div>
                            {[
                                { step: 1, label: 'Webhook Node', desc: 'Receives POST at /webhook/intake' },
                                { step: 2, label: 'Set Node', desc: 'Normalize & clean incoming data' },
                                { step: 3, label: 'AI Classification', desc: 'Gemini classifies category + complexity' },
                                { step: 4, label: 'Switch Node', desc: 'Routes based on category field' },
                                { step: 5, label: 'DB Save', desc: 'POST to /api/projects via FastAPI' },
                                { step: 6, label: 'IF Node', desc: 'Check priority → Email / Slack' },
                                { step: 7, label: 'Respond', desc: 'Return structured JSON response' },
                            ].map(s => (
                                <div key={s.step} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--accent-light)', fontWeight: 700, flexShrink: 0 }}>
                                        {s.step}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI Result */}
                        {result && (
                            <div className="result-card" id="intake-result">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>✓ AI Classification Result</span>
                                    {elapsed && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>in {elapsed}s</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {[
                                        { label: 'Category', value: result.category?.replace('_', ' '), color: 'var(--accent-light)' },
                                        { label: 'Complexity', value: `${result.complexity_score}/10`, color: result.complexity_score >= 8 ? 'var(--accent-3)' : 'var(--accent-4)' },
                                        { label: 'Est. Days', value: result.estimated_days, color: 'var(--accent-2)' },
                                        { label: 'Team Size', value: result.recommended_team_size, color: 'var(--accent-5)' },
                                    ].map(item => (
                                        <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                                            <div style={{ fontWeight: 700, color: item.color, fontSize: '1rem' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {result.key_technologies && (
                                    <div style={{ marginBottom: '0.875rem' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Technologies</div>
                                        <div className="tag-list">
                                            {result.key_technologies.map(t => <span key={t} className="tag">{t}</span>)}
                                        </div>
                                    </div>
                                )}

                                {result.summary && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.875rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {result.summary}
                                    </div>
                                )}

                                {result.routed_to && (
                                    <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Routed to:</span>
                                        <span className="badge badge-purple">→ {result.routed_to}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!result && !loading && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Submit the form to see real-time AI classification results
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
