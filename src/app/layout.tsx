import { AuthProvider } from "../../context/AuthProvider";
import "./globals.css";
import { Poppins } from 'next/font/google'

export const metadata = {
  title: "connext",
  description: "Next.js minimal setup",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}
