import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { FamilyMemberProvider } from '@/context/FamilyMemberContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <FamilyMemberProvider>
      <App />
    </FamilyMemberProvider>
  </ErrorBoundary>
)