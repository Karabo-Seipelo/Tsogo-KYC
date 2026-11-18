import bundled from "../../content/en-ZA.json";
import { StartScreen } from "@/features/start/StartScreen";
import { ContentProvider } from "@/lib/content/ContentProvider";
import { contentSchema } from "@/lib/content/schema";

export default function Page() {
  return (
    <ContentProvider content={contentSchema.parse(bundled)}>
      <StartScreen />
    </ContentProvider>
  );
}
