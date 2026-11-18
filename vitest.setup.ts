import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest does not unmount Testing Library renders between tests unless this
// runs. Source: https://testing-library.com/docs/react-testing-library/setup
afterEach(() => {
  cleanup();
});
