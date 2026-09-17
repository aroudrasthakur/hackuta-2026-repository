import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/Register/RegisterPage'
import ProfileGate from './pages/Profile/ProfileGate'
import YouPage from './pages/Profile/YouPage'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfileGate />} />
        <Route path="/you" element={<YouPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
