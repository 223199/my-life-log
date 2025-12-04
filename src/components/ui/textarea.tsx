import React from 'react'
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className='', ...rest }, ref) => (
    <textarea ref={ref} className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm ${className}`} {...rest}/>
  )
)
Textarea.displayName = 'Textarea'
