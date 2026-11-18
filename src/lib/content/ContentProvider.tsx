"use client";

import { createContext, type ReactNode } from "react";
import type { Content } from "./schema";
import { createT, type ContentKey } from "./t";

// The server loads the copy and passes it in. This file is a client component
// so children can call useContent().
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
// Source: https://react.dev/reference/react/createContext#provider

type ContentContextValue = {
  t: (key: ContentKey, values?: Record<string, string | number>) => string;
};

export const ContentContext = createContext<ContentContextValue | null>(null);

type Props = {
  content: Content;
  children: ReactNode;
};

export function ContentProvider({ content, children }: Props) {
  return (
    <ContentContext.Provider value={{ t: createT(content) }}>
      {children}
    </ContentContext.Provider>
  );
}
