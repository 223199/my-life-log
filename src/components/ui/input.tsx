import React from 'react'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className='', ...rest }, ref) => (
    <input ref={ref} className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm ${className}`} {...rest}/>
  )
)
Input.displayName = 'Input'
