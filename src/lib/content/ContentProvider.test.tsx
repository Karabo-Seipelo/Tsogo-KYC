import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import bundled from "../../../content/en-ZA.json";
import { ContentProvider } from "./ContentProvider";
import { contentSchema } from "./schema";
import { useContent } from "./useContent";

function Attempt() {
  const { t } = useContent();
  return <p>{t("common.attempt", { attempt: 2, max: 3 })}</p>;
}

test("R-09.2 useContent reads the copy passed through ContentProvider", () => {
  render(
    <ContentProvider content={contentSchema.parse(bundled)}>
      <Attempt />
    </ContentProvider>,
  );

  expect(screen.getByText("Attempt 2 of 3")).toBeDefined();
});
