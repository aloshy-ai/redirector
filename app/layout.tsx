import './globals.css'

export const metadata = {
  title: 'Redirect App',
  description: 'A simple redirect application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="logo">
          aloshy.🅰🅸
        </div>
      </body>
    </html>
  )
}

