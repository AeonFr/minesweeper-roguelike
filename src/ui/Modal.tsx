import type { ReactNode } from 'react'

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">{children}</div>
    </div>
  )
}
