import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Carte des FIJ — Familles d\'Impact',
  description:
    "Trouvez la Famille d'Impact Jeune (FIJ) la plus proche de chez vous sur une carte interactive.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
