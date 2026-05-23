import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Dummy data for JSON import testing
export const DUMMY_PLAYERS = `[
  { "id": "p1", "name": "Lionel Messi", "position": "ST", "country": "Argentina", "rating": 93, "basePrice": 2.0, "category": "Marquee" },
  { "id": "p2", "name": "Kevin De Bruyne", "position": "MID", "country": "Belgium", "rating": 91, "basePrice": 2.0, "category": "Marquee" },
  { "id": "p3", "name": "Virgil van Dijk", "position": "DEF", "country": "Netherlands", "rating": 89, "basePrice": 1.5, "category": "Marquee" },
  { "id": "p4", "name": "Alisson Becker", "position": "GK", "country": "Brazil", "rating": 89, "basePrice": 1.5, "category": "Marquee" },
  { "id": "p5", "name": "Jude Bellingham", "position": "MID", "country": "England", "rating": 90, "basePrice": 1.5, "category": "Wonderkids" },
  { "id": "p6", "name": "Vinicius Jr.", "position": "ST", "country": "Brazil", "rating": 89, "basePrice": 1.5, "category": "Wonderkids" },
  { "id": "p7", "name": "Rodri", "position": "MID", "country": "Spain", "rating": 91, "basePrice": 1.5, "category": "Marquee" },
  { "id": "p8", "name": "Erling Haaland", "position": "ST", "country": "Norway", "rating": 92, "basePrice": 2.0, "category": "Marquee" },
  { "id": "p9", "name": "Trent Alexander-Arnold", "position": "DEF", "country": "England", "rating": 87, "basePrice": 1.0, "category": "Defenders" },
  { "id": "p10", "name": "Thibaut Courtois", "position": "GK", "country": "Belgium", "rating": 90, "basePrice": 1.5, "category": "Goalkeepers" }
]`;
