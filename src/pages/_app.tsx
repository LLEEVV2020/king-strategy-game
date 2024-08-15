// pages/_app.tsx
import '../styles/globals.css';  // Импортируем глобальные стили

import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;