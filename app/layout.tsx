import type { Metadata } from "next";
import { Cinzel, Montserrat } from "next/font/google";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HackUTA Odyssey",
  description:
    "HackUTA is the University of Texas at Arlington's student hackathon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${cinzel.variable} h-full`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
