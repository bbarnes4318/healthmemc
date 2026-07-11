import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { FamilyMemberProvider } from '@/context/FamilyMemberContext'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <FamilyMemberProvider>
    <App />
  </FamilyMemberProvider>
)