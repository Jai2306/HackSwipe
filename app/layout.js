import "./globals.css";

export const metadata = {
  title: "Hackathon Tinder",
  description: "Connect with developers, find projects, join hackathons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}