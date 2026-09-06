import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050805",
};

export const metadata: Metadata = {
  title: {
    default: "StarX Study",
    template: "%s | StarX Study",
  },
  description: "StarX Study — Chat. Share. Learn. Together. BEYOND TOMORROW.",
  keywords: ["StarX", "StarX Study", "education", "student", "teacher", "communication", "platform", "beyond tomorrow"],
  applicationName: "StarX Study",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StarX Study",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/starx-emblem.png",
    apple: "/images/starx-emblem.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "bg-card text-card-foreground border-border shadow-2xl rounded-2xl",
                title: "text-foreground font-semibold text-sm",
                description: "text-muted-foreground text-xs",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
