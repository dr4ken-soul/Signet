import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Signet | Verify the invoice before money moves',
  description:
    'AI-assisted signed-invoice payment control. ML-DSA verification runs off-chain, a buyer approves the payment, and Aevum anchors the document digest and verification-record hash.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
