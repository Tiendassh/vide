import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Nocturnal - Premium Video Visualizer & Nginx Configurator',
  description: 'Visualizador de videos nocturno de máxima calidad con soporte para embeds, sección de comentarios interactiva y plantillas listas para Nginx y Render.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#050506] text-white min-h-screen font-sans selection:bg-blue-600/30 selection:text-blue-200 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
