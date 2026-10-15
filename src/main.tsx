import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Registra el service worker automáticamente para permitir uso 100% offline
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

