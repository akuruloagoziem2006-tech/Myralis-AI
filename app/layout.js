export const metadata = {
  title: "Myralis AI",
  description: "Your helpful AI companion for learning, writing, planning, and everyday questions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
