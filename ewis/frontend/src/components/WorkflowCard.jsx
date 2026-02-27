import React from 'react'

export default function WorkflowCard({ name, status, lastRun, duration, index }) {
    return (
        <div
            id={`wf-card-${index}`}
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
                    {name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Last: {lastRun} · {duration}
                </div>
            </div>
            <span className={`badge badge-${status === 'active' ? 'active' : status === 'running' ? 'running' : 'error'}`}>
                ● {status}
            </span>
        </div>
    )
}
