import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { AuthBootstrap } from './components/AuthBootstrap'
import { convexClient } from './convex/client'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/Register/RegisterPage'
import './styles/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true'
const content = convexClient && !useMockApi ? (
  <ConvexAuthProvider client={convexClient}>
    <AuthBootstrap>{app}</AuthBootstrap>
  </ConvexAuthProvider>
) : app

ReactDOM.createRoot(root).render(content)
