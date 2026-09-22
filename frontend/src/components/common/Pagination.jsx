import React from 'react'

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 15,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100]
}) {
  if (totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (currentPage <= 3) {
        start = 2
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }
      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '12px 18px',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderTop: 'none',
      borderRadius: '0 0 10px 10px',
      fontSize: '13px',
      color: '#475569'
    }}>
      {/* Left: Range info & page size selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <span>
          Showing <strong style={{ color: '#0f172a' }}>{startItem}–{endItem}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> records
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                onPageChange(1)
              }}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === 1 ? '#f8fafc' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s'
          }}
          title="First Page"
        >
          ⏮ First
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === 1 ? '#f8fafc' : '#ffffff',
            color: currentPage === 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s'
          }}
          title="Previous Page"
        >
          ◀ Prev
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
          }
          const isActive = p === currentPage
          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 6px',
                fontSize: '12px',
                borderRadius: '6px',
                border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: isActive ? '#2563eb' : '#ffffff',
                color: isActive ? '#ffffff' : '#0f172a',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s'
              }}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s'
          }}
          title="Next Page"
        >
          Next ▶
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s'
          }}
          title="Last Page"
        >
          Last ⏭
        </button>
      </div>
    </div>
  )
}
