import React from 'react'

const fronds = [-105, -78, -52, -26, 0, 26, 52, 78, 105]

export function Palm({ className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 140 220" aria-hidden="true" focusable="false">
      <path d="M62 220 C64 170 66 120 62 76 L72 76 C74 122 72 172 78 220Z" />
      {fronds.map((a) => (
        <path key={a} transform={`rotate(${a} 67 74)`} d="M67 74 C70 40 92 14 126 22 C100 26 84 44 67 74Z" />
      ))}
      <circle cx="62" cy="82" r="5" />
      <circle cx="74" cy="84" r="5" />
      <circle cx="68" cy="92" r="5" />
    </svg>
  )
}

export function PalmGrove({ count = 26 }) {
  const items = Array.from({ length: count }, (_, i) => ({ h: 70 + ((i * 37) % 55), o: (i * 53) % 9 }))
  return (
    <div className="grove" aria-hidden="true">
      {items.map((p, i) => (
        <Palm key={i} className="grove-palm" style={{ height: `${p.h}%`, marginBlockEnd: `-${p.o}px` }} />
      ))}
    </div>
  )
}
