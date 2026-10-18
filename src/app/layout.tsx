import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppDialogsProvider } from "@/components/ui/app-dialogs";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAPEX Visibility Platform | Telecom",
  description:
    "Plan, track, and benchmark telecom CAPEX and license utilization in one place.",
  icons: {
    icon: "/capex logo.png",
    apple: "/capex logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <AppDialogsProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </AppDialogsProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
