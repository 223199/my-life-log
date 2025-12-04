import React from 'react'

type Props = {
  checked?: boolean
  onCheckedChange?: (v: boolean) => void
}

export const Checkbox: React.FC<Props> = ({
  checked = false,
  onCheckedChange,
}) => (
  <input
    type="checkbox"
    className="h-4 w-4 accent-emerald-600"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
  />
)
