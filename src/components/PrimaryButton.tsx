import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

const variantClassName = {
  primary:
    'border-[#d0a65c]/60 bg-[linear-gradient(180deg,#32705f_0%,#235747_100%)] text-white shadow-[0_8px_0_#173a31,0_12px_22px_rgba(35,26,14,0.22)] active:translate-y-1 active:shadow-[0_4px_0_#173a31,0_8px_16px_rgba(35,26,14,0.18)]',
  secondary:
    'border-[#c39a61]/60 bg-[linear-gradient(180deg,#fff8e9_0%,#f5e2bd_100%)] text-[#352113] shadow-[0_8px_0_#c59d5b,0_12px_20px_rgba(35,26,14,0.15)] active:translate-y-1 active:shadow-[0_4px_0_#c59d5b,0_8px_16px_rgba(35,26,14,0.12)]',
  danger:
    'border-[#efc09a]/60 bg-[linear-gradient(180deg,#bd5038_0%,#943823_100%)] text-white shadow-[0_8px_0_#6d271a,0_12px_20px_rgba(35,26,14,0.18)] active:translate-y-1 active:shadow-[0_4px_0_#6d271a,0_8px_16px_rgba(35,26,14,0.14)]',
}

/** 卓上カード風の主要アクションボタンを描画する。 */
export function PrimaryButton({ children, variant = 'primary', className = '', ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`min-h-12 rounded-2xl border px-4 py-3 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
