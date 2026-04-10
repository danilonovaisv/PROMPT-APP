import { describe, it, expect } from "@jest/globals";
import { MenuOptionSchema, FewShotExampleSchema } from "../promptSchema";

describe("promptSchema Validation", () => {
  describe("MenuOptionSchema", () => {
    it("should allow adding multiple empty sub-options without uniqueness error", () => {
      const data = {
        label: "Menu",
        value: "menu",
        sub_options: [
          { label: "", value: "", description: "" },
          { label: "", value: "", description: "" }
        ]
      };
      
      const result = MenuOptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should still fail if values are non-empty and identical", () => {
      const data = {
        label: "Menu",
        value: "menu",
        sub_options: [
          { label: "Opt 1", value: "slug_1", description: "" },
          { label: "Opt 2", value: "slug_1", description: "" }
        ]
      };
      
      const result = MenuOptionSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Sub-option value deve ser único");
      }
    });
  });

  describe("FewShotExampleSchema", () => {
    it("should allow empty input and output", () => {
      const data = { input: "", output: "" };
      const result = FewShotExampleSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
