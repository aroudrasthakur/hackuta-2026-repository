import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { AuthBootstrap } from './components/AuthBootstrap'
import HomePage from './pages/HomePage'
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
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

const convexUrl = import.meta.env.VITE_CONVEX_URL
const content = convexUrl ? (
  <ConvexAuthProvider client={new ConvexReactClient(convexUrl)}>
    <AuthBootstrap>{app}</AuthBootstrap>
  </ConvexAuthProvider>
) : app

ReactDOM.createRoot(root).render(content)
