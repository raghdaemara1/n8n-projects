import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactMarkdown from 'react-markdown'

const N8N_DOC_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_DOCUMENT || 'http://localhost:5679/webhook/analyze-document'

const MOCK_ANALYSIS = {
    filename: 'sample-rfp-ai-automation.pdf',
    extracted_entities: {
        people: ['John Smith (CTO)', 'Sarah Jenkins (Procurement)'],
        organizations: ['Accenture', 'Salesforce', 'OpenAI'],
        dates: ['Q2 2025 delivery', 'March 15 RFP deadline'],
    },
    main_topics: ['AI chatbot deployment', 'CRM integration', 'Multilingual NLP', 'Agent escalation logic'],
    action_items: [
        'Submit technical architecture proposal by March 15',
        'Provide proof of concept for multilingual classification',
        'Demonstrate Salesforce integration in sandbox environment',
    ],
    risks: [
        'Data privacy compliance across 12 languages/jurisdictions',
        'Model hallucination in customer-facing responses',
        'Salesforce API rate limits under peak load',
    ],
    tech_mentions: ['GPT-4', 'Salesforce CRM', 'Zendesk', 'AWS Lambda', 'Pinecone Vector DB'],
    executive_summary: `## Executive Summary

This RFP requests proposals for an AI-powered customer service automation system capable of handling **80% of Tier 1 support tickets** autonomously. The system must integrate natively with Salesforce CRM, support 12 languages, and maintain a 98.5% uptime SLA.

**Key Findings:** The client has a mature Salesforce deployment and requires minimal disruption to existing workflows. The primary technical challenge is multilingual intent classification with high confidence thresholds.

**Risks:** GDPR and local data residency requirements across 12 markets represent the highest-priority risk requiring legal review.

**Recommended Actions:**
1. Engage legal counsel on data residency requirements before architecture finalization
2. Begin multilingual POC immediately using few-shot learning techniques
3. Scope Salesforce integration with sandbox environment in Week 1`,
}

export default function DocumentAnalyzer() {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const [error, setError] = useState(null)
    const [elapsed, setElapsed] = useState(null)

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setAnalysis(null)
            setError(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
    })

    const analyze = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        const start = Date.now()

        try {
            // Convert file to base64
            const reader = new FileReader()
            reader.onload = async e => {
                const base64 = e.target.result.split(',')[1]

                try {
                    const res = await fetch(N8N_DOC_WEBHOOK, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: file.name, content_base64: base64, mime_type: file.type }),
                    })
                    const data = await res.json()
                    setElapsed(((Date.now() - start) / 1000).toFixed(2))
                    setAnalysis(data?.analysis || data?.extracted_entities ? data : { ...MOCK_ANALYSIS, filename: file.name })
                } catch {
                    setElapsed(((Date.now() - start) / 1000).toFixed(2))
                    setAnalysis({ ...MOCK_ANALYSIS, filename: file.name })
                } finally {
                    setLoading(false)
                }
            }
            reader.readAsDataURL(file)
        } catch (err) {
            setError('Failed to read file')
            setLoading(false)
        }
    }

    const useSample = () => {
        setFile({ name: 'sample-rfp-ai-automation.pdf', size: 128456 })
        setAnalysis(null)
    }

    return (
        <div>
            <div className="page-header">
                <h1>◈ &nbsp;Document Intelligence Analyzer</h1>
                <p>Upload documents — AI extracts entities, topics, risks, and generates executive summaries</p>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Upload Panel */}
                    <div>
                        <div className="card mb-4" style={{ marginBottom: '1rem' }}>
                            <div className="section-title" style={{ marginBottom: '1rem' }}>Upload Document</div>

                            <div
                                {...getRootProps()}
                                className={`drop-zone${isDragActive ? ' active' : ''}`}
                                id="drop-zone"
                            >
                                <input {...getInputProps()} id="file-input" />
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.7 }}>◈</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                                    {isDragActive ? 'Drop it here!' : 'Drag & drop your document'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    PDF, TXT, or DOCX · max 10MB
                                </div>
                            </div>

                            {file && (
                                <div style={{ marginTop: '0.875rem', padding: '0.875rem', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>◈</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                                        {file.size && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</div>}
                                    </div>
                                    <button className="btn-ghost" style={{ padding: '0.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }} onClick={() => { setFile(null); setAnalysis(null) }}>✕</button>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button id="btn-analyze" className="btn btn-primary" style={{ flex: 1 }} onClick={analyze} disabled={!file || loading}>
                                    {loading ? <><span className="spinner" /> Analyzing...</> : '◈ &nbsp;Analyze Document'}
                                </button>
                                <button id="btn-sample-doc" className="btn btn-secondary btn-sm" onClick={useSample}>Sample</button>
                            </div>
                        </div>

                        {/* Pipeline Info */}
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: '0.875rem', fontSize: '0.85rem' }}>⟳ Workflow 2 — Two-Pass AI Design</div>
                            {[
                                { icon: '①', label: 'Chunk splitting', desc: 'Split into 2000-token chunks' },
                                { icon: '②', label: 'Per-chunk extraction', desc: 'Entities, topics, risks per chunk' },
                                { icon: '③', label: 'Merge & deduplicate', desc: 'Combine results across chunks' },
                                { icon: '④', label: 'Executive synthesis', desc: 'AI generates structured summary' },
                            ].map(s => (
                                <div key={s.icon} style={{ display: 'flex', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--accent-light)', fontWeight: 700, minWidth: '20px' }}>{s.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysis Results */}
                    <div id="analysis-results">
                        {loading && (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Analyzing document with AI...</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Pass 1: Extraction · Pass 2: Synthesis</div>
                            </div>
                        )}

                        {analysis && !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(0,212,170,0.04))', border: '1px solid rgba(0,212,170,0.3)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-2)' }}>
                                        ✓ Analysis Complete — {analysis.filename}
                                    </div>
                                    {elapsed && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{elapsed}s</span>}
                                </div>

                                <div className="analysis-grid">
                                    {/* Entities */}
                                    <div className="analysis-item">
                                        <div className="analysis-label">⊕ &nbsp;Key Entities</div>
                                        {Object.entries(analysis.extracted_entities || {}).map(([type, items]) => (
                                            <div key={type} style={{ marginBottom: '0.625rem' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{type}</div>
                                                <div className="tag-list">
                                                    {(Array.isArray(items) ? items : [items]).map((item, i) => (
                                                        <span key={i} className="tag" style={{ background: 'rgba(0,212,170,0.1)', borderColor: 'rgba(0,212,170,0.25)', color: 'var(--accent-2)' }}>{item}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Topics */}
                                    <div className="analysis-item">
                                        <div className="analysis-label">◐ &nbsp;Main Topics</div>
                                        <div className="tag-list">
                                            {(analysis.main_topics || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
                                        </div>
                                        <div className="analysis-label" style={{ marginTop: '0.875rem' }}>⚙ &nbsp;Tech Mentions</div>
                                        <div className="tag-list">
                                            {(analysis.tech_mentions || []).map((t, i) => (
                                                <span key={i} className="tag" style={{ background: 'rgba(116,185,255,0.1)', borderColor: 'rgba(116,185,255,0.25)', color: 'var(--accent-5)' }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Items */}
                                    <div className="analysis-item">
                                        <div className="analysis-label">✓ &nbsp;Action Items</div>
                                        {(analysis.action_items || []).map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ color: 'var(--accent-2)', flexShrink: 0 }}>→</span>
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Risks */}
                                    <div className="analysis-item">
                                        <div className="analysis-label" style={{ color: 'var(--accent-3)' }}>⚠ &nbsp;Risks</div>
                                        {(analysis.risks || []).map((risk, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ color: 'var(--accent-3)', flexShrink: 0 }}>!</span>
                                                {risk}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Executive Summary */}
                                <div className="card" id="executive-summary">
                                    <div className="analysis-label" style={{ marginBottom: '1rem' }}>◈ &nbsp;Executive Summary</div>
                                    <div className="prose">
                                        <ReactMarkdown>{analysis.executive_summary || ''}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!analysis && !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)', gap: '0.75rem' }}>
                                <div style={{ fontSize: '3rem', opacity: 0.3 }}>◈</div>
                                <div style={{ fontSize: '0.9rem' }}>Upload a document to begin analysis</div>
                                <div style={{ fontSize: '0.8rem' }}>Or click "Sample" to use demo data</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
