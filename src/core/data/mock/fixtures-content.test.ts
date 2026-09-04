import { describe, expect, it } from "vitest";

import { MOCK_ACTIVITIES, MOCK_ITEMS } from "@/core/data/mock/fixtures";

describe("conteúdo de demonstração", () => {
  it("oferece seis questões e os quatro formatos em cada atividade", () => {
    for (const activity of MOCK_ACTIVITIES) {
      const items = MOCK_ITEMS.filter((item) => item.activityId === activity.id);
      expect(items, activity.id).toHaveLength(6);
      expect(new Set(items.map((item) => item.type)), activity.id).toEqual(
        new Set(["multiple_choice", "column_match", "fill_blanks", "short_answer"]),
      );
    }
  });
});
