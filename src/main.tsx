import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { convexClient } from './convex/client'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterRedirect from './pages/RegisterRedirect'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(root).render(
  convexClient ? <ConvexProvider client={convexClient}>{app}</ConvexProvider> : app,
)
