import React, { useMemo, useState } from 'react'

type Props = {
  mode?: 'single'
  selected?: Date
  onSelect?: (d: Date | undefined) => void
  renderDay?: (d: Date) => React.ReactNode
}

const JP_WD = ['日','月','火','水','木','金','土']
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const addDays      = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n)
const sameDay      = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()

export const Calendar: React.FC<Props> = ({ selected, onSelect, renderDay }) => {
  const [ref, setRef] = useState<Date>(selected ?? new Date())
  const days = useMemo(()=>{
    const som = startOfMonth(ref)
    const first = addDays(som, -som.getDay())        // 月初を含む週の「日曜」から開始
    return Array.from({length: 42}, (_,i)=> addDays(first, i)) // 6週間固定
  }, [ref])

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button className="text-sm underline" onClick={()=>setRef(new Date(ref.getFullYear(), ref.getMonth()-1, 1))}>← 前月</button>
        <div className="font-semibold">{ref.getFullYear()}年 {ref.getMonth()+1}月</div>
        <button className="text-sm underline" onClick={()=>setRef(new Date(ref.getFullYear(), ref.getMonth()+1, 1))}>次月 →</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
        {JP_WD.map((w)=> <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d,i)=>{
          const inMonth = d.getMonth()===ref.getMonth()
          const isToday = sameDay(d, new Date())
          return (
            <button
              key={i}
              onClick={()=>onSelect?.(d)}
              className={`aspect-square rounded-lg border text-[10px] flex flex-col items-center justify-start p-1 ${isToday?'outline outline-2 outline-indigo-500':''} ${inMonth?'bg-white':'bg-white/70 opacity-60'}`}
            >
              {renderDay ? renderDay(d) : <span className="text-xs">{d.getDate()}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
