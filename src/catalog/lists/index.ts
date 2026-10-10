// All curated lists. To add one: create a file next to this one and add it here.
import { blind75 } from "./blind-75";
import { grind75 } from "./grind-75";
import { neetcode150 } from "./neetcode-150";
import type { ProblemList } from "./types";

export type { ListSection, ProblemList } from "./types";

export const lists: ProblemList[] = [blind75, grind75, neetcode150];

/** Problem slugs in a list, in list order. */
export const listSlugs = (list: ProblemList) => list.sections.flatMap((s) => s.problems);
