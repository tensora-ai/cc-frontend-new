import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tensora Count | Crowd Counting Solution",
  description: "Tensora Count is an AI-powered crowd counting solution for event management and facility monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {/* Header Component - will handle auth state internally */}
            <Header />
            
            {/* Main content */}
            <div className="flex-grow">
              {children}
            </div>
            
            {/* Footer Component */}
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}