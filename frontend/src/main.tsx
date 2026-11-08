import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { CartProvider } from './context/CartContext.tsx';
import './index.css';

// Ensure global Buffer is always available
if (typeof window !== 'undefined') {
  (window as any).global = window;
  if (typeof (window as any).Buffer === 'undefined') {
    (window as any).Buffer = {
      from: function (data: any, encoding?: string) {
        if (typeof data === 'string') {
          if (encoding === 'base64') {
            const binary = window.atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
          }
          return new TextEncoder().encode(data);
        }
        if (data instanceof Uint8Array) return data;
        if (Array.isArray(data)) return new Uint8Array(data);
        return new Uint8Array(data || []);
      },
      isBuffer: function (obj: any) {
        return obj instanceof Uint8Array;
      },
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
