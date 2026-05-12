import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Toaster } from '@/components/ui/sonner';

// Lock app to light theme
document.documentElement.classList.add('light');
document.documentElement.classList.remove('dark');

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        style: {
          zIndex: 9999,
        },
      }}
    />
  </>
);
