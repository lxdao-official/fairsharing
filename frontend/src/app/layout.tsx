import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import './globals.css';
import { Lexend, Roboto } from 'next/font/google';
import ClientWrapper from '../components/ClientWrapper';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});
const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FairSharing',
  description: 'Grow the Pie Together Share the Reward Fairly',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${lexend.variable}  antialiased`} suppressHydrationWarning>
        <ClientWrapper>
          <MantineProvider theme={theme}>{children}</MantineProvider>
        </ClientWrapper>
      </body>
    </html>
  );
}
