"use client";

export default function GlobalError() {
  return <html lang="en"><body><main style={{ fontFamily: "sans-serif", margin: "4rem auto", maxWidth: "36rem", padding: "1rem", textAlign: "center" }}><h1>SafeSpend could not start</h1><p>Check the database path, file permissions, migrations, and server logs, then reload the page.</p></main></body></html>;
}
