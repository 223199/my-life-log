import React from 'react'
type Props = React.HTMLAttributes<HTMLDivElement>
export const Card: React.FC<Props> = ({ className = '', ...rest }) => (
  <div className={`rounded-xl border bg-white ${className}`} {...rest} />
)
export const CardContent: React.FC<Props> = ({ className = '', ...rest }) => (
  <div className={`p-4 ${className}`} {...rest} />
)
