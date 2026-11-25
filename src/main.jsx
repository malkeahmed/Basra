import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { installPatterns } from './patterns.js'
import { installSmoothScroll } from './smoothscroll.js'
import './styles.css'

installPatterns()
installSmoothScroll()
createRoot(document.getElementById('root')).render(<App />)

/* بعد أن يستقر المدخل نحمّل بقية الأقسام في وقت الفراغ حتى لا يتأخر التمرير */
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200))
idle(() => { import('./FolkloreSection.jsx'); import('./Figures.jsx'); import('./Guide.jsx'); import('./Album.jsx') })
