"use client";

import { useContext } from "react";
import { ContentContext } from "./ContentProvider";

// Source: https://react.dev/reference/react/useContext
export function useContent() {
  const value = useContext(ContentContext);
  if (!value) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return value;
}
