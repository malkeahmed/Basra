import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { installPatterns } from './patterns.js'
import './styles.css'

installPatterns()
createRoot(document.getElementById('root')).render(<App />)
