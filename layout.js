export const metadata = {
  title: "Savills – Global Footprint",
  description: "Interactive landing page with global heatmap and Viadex Distribution Centres.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
