import { describe, expect, it } from "vitest";
import { categorizeLunchItem, getLunchIcon } from "@/lib/lunchMenu";
import { Carrot, CookingPot, Drumstick, Salad, Soup } from "lucide-react";

describe("lunch menu classification", () => {
  it.each([
    ["Build Your Own Salad: Greens, Broccoli, Chicken Breast", "salad", Salad],
    ["Chicken Tomato Soup", "main", Soup],
    ["PROTEIN BOWL: Chipotle Chicken, Rice, Black Beans", "main", CookingPot],
    ["Chicken and Broccoli Stir Fry", "main", CookingPot],
    ["Baby Bok Choy", "side", Carrot],
    ["Roasted Butternut Squash", "side", Carrot],
    ["BBQ Chicken Legs", "main", Drumstick],
    ["Seasonal Fruit, Yogurt, Granola", "salad", expect.any(Function)],
  ])("sorts and illustrates %s", (item, category, icon) => {
    expect(categorizeLunchItem(item)).toBe(category);
    expect(getLunchIcon(item)).toEqual(icon);
  });
});