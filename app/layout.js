import './globals.css';

export const metadata = {
  title: 'LMS Bina Sejahtera',
  description: 'Platform pembelajaran digital yang sederhana, interaktif, dan dapat diakses kapan saja.',
  keywords: 'LMS, learning management system, Bina Sejahtera, belajar online, sekolah digital',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
