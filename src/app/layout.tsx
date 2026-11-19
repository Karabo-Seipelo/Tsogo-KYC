import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import bundled from "../../content/en-ZA.json";
import { DemoBanner } from "@/components/DemoBanner";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";
import { demoModeEnabled } from "@/lib/demoMode";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const content = contentSchema.parse(bundled);

// Description only. A title here would replace the per-screen document.title
// (R-09.10). noindex stays on the response header.
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export const metadata: Metadata = {
  description: content.common.description,
};

type Props = { children: React.ReactNode };

// The root layout wraps every route, including /privacy, the saved page and
// segment error pages. Source: https://nextjs.org/docs/app/api-reference/file-conventions/layout
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en-ZA" className={montserrat.variable}>
      <body className="bg-canvas text-ink">
        <ContentProvider content={content}>
          {demoModeEnabled() ? <DemoBanner /> : null}
          {children}
        </ContentProvider>
      </body>
    </html>
  );
}
