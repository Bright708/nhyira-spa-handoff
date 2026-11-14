import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'

// The booking page loads on demand, so the homepage ships less JavaScript.
const Book = lazy(() => import('./pages/Book'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/book"
          element={
            <Suspense fallback={<div className="min-h-svh bg-paper" />}>
              <Book />
            </Suspense>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
