import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

const variantClassName = {
  primary:
    'bg-[#2f5d50] text-white shadow-[0_8px_0_#1f4037] active:translate-y-1 active:shadow-[0_4px_0_#1f4037]',
  secondary:
    'bg-[#fff4d9] text-[#3b2a1b] shadow-[0_8px_0_#d8b77a] active:translate-y-1 active:shadow-[0_4px_0_#d8b77a]',
  danger:
    'bg-[#b94a34] text-white shadow-[0_8px_0_#7c2f22] active:translate-y-1 active:shadow-[0_4px_0_#7c2f22]',
}

/** 卓上カード風の主要アクションボタンを描画する。 */
export function PrimaryButton({ children, variant = 'primary', className = '', ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`min-h-12 rounded-xl px-4 py-3 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
