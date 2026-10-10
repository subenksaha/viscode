import type { CategoryId } from "../categories";

export interface ListSection {
  /** Topic of the section; its heading links to the category page. */
  category?: CategoryId;
  /** Section heading; required when there is no category. */
  title?: string;
  /** Problem slugs, in display order. Must exist in the problem registry. */
  problems: string[];
}

export interface ProblemList {
  id: string;
  name: string;
  description: string;
  source?: string;
  sections: ListSection[];
}
