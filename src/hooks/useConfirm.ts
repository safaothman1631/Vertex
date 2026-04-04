import { useState, useCallback } from 'react'

interface ConfirmState {
  open: boolean
  message: string
  title: string
  variant: 'danger' | 'warning' | 'info'
  confirmLabel: string
  cancelLabel: string
  resolve: ((value: boolean) => void) | null
}

const INITIAL: ConfirmState = {
  open: false,
  message: '',
  title: 'Confirm',
  variant: 'danger',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  resolve: null,
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(INITIAL)

  const confirm = useCallback((opts: {
    message: string
    title?: string
    variant?: 'danger' | 'warning' | 'info'
    confirmLabel?: string
    cancelLabel?: string
  }): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        message: opts.message,
        title: opts.title ?? 'Confirm',
        variant: opts.variant ?? 'danger',
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        resolve,
      })
    })
  }, [])

  const onConfirm = useCallback(() => {
    state.resolve?.(true)
    setState(INITIAL)
  }, [state.resolve])

  const onCancel = useCallback(() => {
    state.resolve?.(false)
    setState(INITIAL)
  }, [state.resolve])

  return {
    confirm,
    confirmProps: {
      open: state.open,
      message: state.message,
      title: state.title,
      variant: state.variant,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      onConfirm,
      onCancel,
    },
  }
}
