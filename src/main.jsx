import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { installPatterns } from './patterns.js'
import { installSmoothScroll } from './smoothscroll.js'
import './styles.css'

installPatterns()
installSmoothScroll()
createRoot(document.getElementById('root')).render(<App />)
