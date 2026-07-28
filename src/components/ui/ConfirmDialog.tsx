import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Excluir' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-suave text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 bg-elevado text-marca rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
          Cancelar
        </button>
        <button onClick={() => { onConfirm(); onClose() }} className="flex-1 bg-perigo text-white rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
