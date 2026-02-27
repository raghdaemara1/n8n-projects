import React, { useState } from 'react'

export default function ResultsTable({ columns = [], data = [], emptyMessage = 'No data available' }) {
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('asc')

    const handleSort = key => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }

    const sorted = sortKey
        ? [...data].sort((a, b) => {
            const av = a[sortKey]; const bv = b[sortKey]
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })
        : data

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                {col.label} {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{emptyMessage}</td></tr>
                    ) : sorted.map((row, i) => (
                        <tr key={i} id={`table-row-${i}`}>
                            {columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
