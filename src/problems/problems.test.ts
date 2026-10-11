import { describe, expect, it } from "vitest";
import { categories } from "@/catalog/categories";
import { lists } from "@/catalog/lists";
import { getProblem, problems } from "@/catalog/problems";
import { findKeyStep, runSolution } from "@/core/trace";

describe("catalog", () => {
  it("every list references registered problems and known categories", () => {
    for (const list of lists)
      for (const section of list.sections) {
        if (section.category) expect(categories).toHaveProperty(section.category);
        else expect(section.title, `${list.id}: untitled section`).toBeTruthy();
        for (const slug of section.problems) expect(getProblem(slug), slug).toBeDefined();
      }
  });

  it("lists have no duplicate problems", () => {
    for (const list of lists) {
      const slugs = list.sections.flatMap((s) => s.problems);
      expect(new Set(slugs).size, list.id).toBe(slugs.length);
    }
  });

  it("slugs are unique", () => {
    expect(new Set(problems.map((p) => p.slug)).size).toBe(problems.length);
  });
});

describe.each(problems.map((p) => [p.slug, p] as const))("%s", (_, entry) => {
  it("solutions produce correct answers and valid traces", async () => {
    const problem = (await entry.load()).default;
    const norm = (v: unknown) => JSON.stringify(problem.normalize ? problem.normalize(v) : v);
    expect(problem.solutions.length).toBeGreaterThan(0);
    expect(new Set(problem.solutions.map((s) => s.id)).size).toBe(problem.solutions.length);

    for (const solution of problem.solutions) {
      const def = runSolution(problem, solution, problem.input.default);
      expect(def.steps.length, `${solution.id}: default input has steps`).toBeGreaterThan(0);
      const lineCount = solution.code.source.split("\n").length;
      for (const step of def.steps) expect(step.line).toBeLessThanOrEqual(lineCount);

      expect(solution.approach.length, `${solution.id}: approach stages`).toBeGreaterThanOrEqual(3);
      expect(
        solution.approach.some((a) => a.at),
        `${solution.id}: approach visualizes a critical step`,
      ).toBe(true);
      for (const stage of solution.approach) {
        if (!stage.at) continue;
        expect(solution.code.lines, `${solution.id}: approach marker`).toHaveProperty(stage.at);
        expect(
          findKeyStep(def.steps, stage),
          `${solution.id}: "${stage.title}" reached on default input`,
        ).toBeGreaterThanOrEqual(0);
      }

      for (const ex of problem.examples) {
        const { result } = runSolution(problem, solution, ex.input);
        expect(norm(result), `${solution.id} on ${ex.input}`).toBe(norm(ex.output));
      }
    }
  });
});
