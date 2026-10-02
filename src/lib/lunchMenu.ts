import {
  Apple, Banana, Bean, Beef, Cake, Candy, Carrot, Cherry, Citrus, Coffee,
  Cookie, CookingPot, Croissant, CupSoda, Donut, Drumstick, Egg, Fish, Grape,
  Ham, IceCreamBowl, Milk, Pizza, Popcorn, Salad, Sandwich, Soup,
  UtensilsCrossed, Wheat, type LucideIcon,
} from "lucide-react";

export type MenuCategory = "main" | "side" | "salad" | "other";

type MatchRule<T> = { pattern: RegExp; value: T };

const ICON_RULES: MatchRule<LucideIcon>[] = [
  { pattern: /\b(salad|caesar|greens|slaw)\b/i, value: Salad },
  { pattern: /\b(soup|chowder|bisque|stew|chili|ramen|pho)\b/i, value: Soup },
  { pattern: /\b(protein bowls?|hot bar|stir[- ]?fry|dumplings?)\b/i, value: CookingPot },
  { pattern: /\b(pizza|flatbread|calzone)\b/i, value: Pizza },
  { pattern: /\b(salmon|fish|tuna|cod|shrimp|seafood|tilapia|sushi)\b/i, value: Fish },
  { pattern: /\b(chicken|wings?|nuggets?|tenders?|francese|turkey)\b/i, value: Drumstick },
  { pattern: /\b(steak|beef|meatballs?|burger|brisket|ribs?)\b/i, value: Beef },
  { pattern: /\b(pork|ham|bacon|sausage|schnitzel)\b/i, value: Ham },
  { pattern: /\b(sandwich|subs?|panini|hoagie|wrap|burrito|taco|quesadilla|melt|deli)\b/i, value: Sandwich },
  { pattern: /\b(ravioli|pasta|penne|spaghetti|tagliatelle|noodles?|mac(?:aroni)?|rice|risotto|couscous|polenta)\b/i, value: Wheat },
  { pattern: /\b(bread|rolls?|biscuits?|naan|pita|waffles?|croissants?)\b/i, value: Croissant },
  { pattern: /\b(beans?|peas?|lentils?)\b/i, value: Bean },
  { pattern: /\b(corn|popcorn)\b/i, value: Popcorn },
  { pattern: /\b(broccoli|broccolini|carrots?|zucchini|vegetables?|veggies|potatoes?|fries|bok choy|beets?|squash|eggplant|fennel|asparagus|cabbage|peppers?|spinach)\b/i, value: Carrot },
  { pattern: /\b(eggs?|omelets?|frittata|quiche)\b/i, value: Egg },
  { pattern: /\b(apples?|applesauce)\b/i, value: Apple },
  { pattern: /\b(bananas?)\b/i, value: Banana },
  { pattern: /\b(oranges?|lemons?|limes?|citrus|grapefruit)\b/i, value: Citrus },
  { pattern: /\b(grapes?|raisins?)\b/i, value: Grape },
  { pattern: /\b(cherries?|berries|strawberries|blueberries|raspberries|fruit|melon)\b/i, value: Cherry },
  { pattern: /\b(yogurt|milk|smoothie|parfait)\b/i, value: Milk },
  { pattern: /\b(ice cream|gelato|sorbet)\b/i, value: IceCreamBowl },
  { pattern: /\b(cookies?|brownies?)\b/i, value: Cookie },
  { pattern: /\b(donuts?|doughnuts?)\b/i, value: Donut },
  { pattern: /\b(cake|dessert|pie|pudding|cupcake)\b/i, value: Cake },
  { pattern: /\b(candy|chocolate)\b/i, value: Candy },
  { pattern: /\b(coffee|tea|cocoa)\b/i, value: Coffee },
  { pattern: /\b(soda|juice|lemonade)\b/i, value: CupSoda },
];

const CATEGORY_RULES: MatchRule<MenuCategory>[] = [
  // Whole-item concepts take precedence over ingredients listed later in the description.
  { pattern: /\b(build your own salad|salad bar|salad|caesar|greens|slaw)\b/i, value: "salad" },
  { pattern: /\b(seasonal fruit|fresh fruit|fruit salad|yogurt|granola|parfait)\b/i, value: "salad" },
  { pattern: /\b(protein bowls?|hot bar|soup|chowder|bisque|stew|chili|pizza|flatbread|calzone|ravioli|pasta|penne|spaghetti|tagliatelle|noodles?|mac(?:aroni)?|sandwich|subs?|panini|hoagie|wrap|burrito|tacos?|quesadilla|burger|deli)\b/i, value: "main" },
  { pattern: /\b(chicken|beef|steak|salmon|fish|pork|ham|turkey|meatballs?|sausage|schnitzel|brisket|ribs?|shrimp|tuna|wings?|dumplings?)\b/i, value: "main" },
  { pattern: /\b(rice|bread|rolls?|biscuits?|naan|pita|fries|potatoes?|polenta|corn|couscous|beans?|chips)\b/i, value: "side" },
  { pattern: /\b(broccoli|broccolini|carrots?|zucchini|vegetables?|veggies|bok choy|beets?|squash|eggplant|fennel|asparagus|cabbage|peas?|peppers?|spinach)\b/i, value: "side" },
  { pattern: /\b(steamed|sauteed|sautéed|mashed|roasted)\b/i, value: "side" },
];

export function getLunchIcon(item: string): LucideIcon {
  return ICON_RULES.find(({ pattern }) => pattern.test(item))?.value ?? UtensilsCrossed;
}

export function categorizeLunchItem(item: string): MenuCategory {
  return CATEGORY_RULES.find(({ pattern }) => pattern.test(item))?.value ?? "other";
}