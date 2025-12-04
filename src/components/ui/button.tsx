import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
}

export const Button: React.FC<Props> = ({
  className = '',
  variant = 'default',
  size = 'md',
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus:outline-none px-3 py-2'
  const styles =
    {
      default: 'bg-slate-900 text-white border-slate-900 hover:opacity-90',
      outline: 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50',
      ghost: 'bg-white/70 border-slate-200 hover:bg-white',
    }[variant] || ''
  const sizeCls = size === 'sm' ? 'px-2 py-1 text-xs' : ''
  return (
    <button
      className={`${base} ${styles} ${sizeCls} ${className}`}
      {...rest}
    />
  )
}
