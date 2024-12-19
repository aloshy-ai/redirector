import './globals.css'

export const metadata = {
  title: 'aloshy.🅰🅸 | Redirector',
  description:
    'Edge function middleware for dynamic DNS-based redirects with TXT record configuration.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="logo">aloshy.🅰🅸</div>
      </body>
    </html>
  )
}
