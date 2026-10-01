import { StrictMode } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { queryClient } from './queryClient'

const loadMotionFeatures = () => import('./motion/features').then((mod) => mod.default)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Motion: base mínima agora, funcionalidades carregadas depois; respeita prefers-reduced-motion */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={loadMotionFeatures} strict>
          <App />
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)
