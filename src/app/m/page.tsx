import bundled from "../../../content/en-ZA.json";
import { Journey } from "@/features/start/Journey";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";

export default function Page() {
  return (
    <ContentProvider content={contentSchema.parse(bundled)}>
      <Journey device="phone" />
    </ContentProvider>
  );
}
