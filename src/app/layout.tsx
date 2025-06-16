import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './globals.css';
import { Lexend, Roboto } from 'next/font/google';
import { Web3Provider } from '../components/Web3Provider';

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
    <html lang="en">
      <body className={`${roboto.variable} ${lexend.variable}  antialiased`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
