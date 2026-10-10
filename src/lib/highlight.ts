import "server-only";
import { codeToTokens, type BundledLanguage } from "shiki";

export interface CodeToken {
  content: string;
  /** Token color in the light and dark themes. */
  light?: string;
  dark?: string;
}

/** Tokenize code on the server so the client gets plain, serializable lines. */
export async function highlightLines(code: string, lang: BundledLanguage): Promise<CodeToken[][]> {
  "use cache";
  const { tokens } = await codeToTokens(code, {
    lang,
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: false,
  });
  return tokens.map((line) =>
    line.map(({ content, htmlStyle }) => ({
      content,
      light: htmlStyle?.["--shiki-light"],
      dark: htmlStyle?.["--shiki-dark"],
    })),
  );
}
