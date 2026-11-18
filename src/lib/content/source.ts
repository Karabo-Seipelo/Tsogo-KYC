import type { Content } from "./schema";

export interface ContentSource {
  read(locale: string): Promise<Content>;
}
