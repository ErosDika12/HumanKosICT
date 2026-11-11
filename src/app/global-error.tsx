"use client";

/**
 * Last-resort boundary: replaces the root layout, so it cannot use the locale
 * provider or app styles. Bilingual (Albanian / English) and self-contained.
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="sq">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "4rem 1.5rem", maxWidth: 640, marginInline: "auto" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Diçka shkoi keq · Something went wrong</h1>
        <p>Faqja nuk u ngarkua. Provo përsëri pas pak.</p>
        <p>The page could not be loaded. Please try again in a moment.</p>
        <button type="button" onClick={() => retry()} style={{ minHeight: 44, padding: "0 1.25rem", fontSize: "1rem", cursor: "pointer" }}>
          Provo përsëri · Try again
        </button>
      </body>
    </html>
  );
}
