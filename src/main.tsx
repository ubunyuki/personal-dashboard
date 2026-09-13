import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { requestPersist } from './lib/storage/persistence'
import { initBackups } from './lib/backup/autoBackup'
import { useUiStore } from './store/uiStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void requestPersist().then((granted) => {
  useUiStore.getState().setStoragePersisted(granted)
})

void initBackups()
