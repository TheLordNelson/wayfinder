import React from 'react'
import { createRoot } from 'react-dom/client'
import Wayfinder from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Wayfinder />
  </React.StrictMode>
)
