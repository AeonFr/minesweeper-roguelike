import type { ReactNode } from 'react'

export function Win({ title, children, className = '', onClose }: { title: string; children: ReactNode; className?: string; onClose?: () => void }) {
  return (
    <div className={`window ${className}`}>
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        {onClose && (
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose} />
          </div>
        )}
      </div>
      <div className="window-body">{children}</div>
    </div>
  )
}

export function Modal({ children, title, onClose }: { children: ReactNode; title: string; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <Win title={title} className="modal" onClose={onClose}>
        {children}
      </Win>
    </div>
  )
}
