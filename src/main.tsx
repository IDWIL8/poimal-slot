import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ManagePage } from './pages/ManagePage'
import { SuccessPage } from './pages/SuccessPage'
import './index.css'

const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))

const router = createBrowserRouter([{
  element: <Layout />,
  children: [
    { path: '/', element: <HomePage /> },
    { path: '/success/:token', element: <SuccessPage /> },
    { path: '/manage/:token', element: <ManagePage /> },
    { path: '/admin', element: <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm font-bold text-black/35">Открываем панель…</div>}><AdminPage /></Suspense> },
    { path: '*', element: <HomePage /> },
  ],
}])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>,
)
