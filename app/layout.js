export const metadata = {
  title: "Myralis AI",
  description: "Your helpful AI companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a" }}>
        {children}
      </body>
    </html>
  );
}
