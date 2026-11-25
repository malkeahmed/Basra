/* خريطة البصرة: خريطة جوجل مدمجة فقط */
import React, { useEffect, useRef, useState } from 'react'
import './mapsection.css'

export default function MapSection() {
  const root = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.2 })
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  return (
    <section className={'mp' + (seen ? ' in' : '')} id="map" ref={root}>
      <header className="mp-hd"><h2><b>خريطة البصرة</b></h2></header>
      <div className="mp-map">
        {seen && (
          <iframe
            title="خريطة البصرة"
            src="https://www.google.com/maps?ll=30.5085,47.7835&hl=ar&z=11&output=embed"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </section>
  )
}
