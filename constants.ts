
import { CatSettings } from './types';

export const CAT_SETTINGS: CatSettings = {
    body: { baseLength: 1.0, baseHeight: 0.8, baseWidth: 1.2 }, // Adjusted to match snippet proportions
    head: { sizeFactor: 0.6, forwardOffset: 0.5, upwardOffset: 0.3 },
    ear: { sizeFactor: 0.1, heightFactor: 0.2, spreadFactor: 0.15, topOffsetFactor: 0.5, backOffsetFactor: 0.6 },
    eye: { sizeFactor: 0.05, spreadFactor: 0.12, forwardOffsetFactor: 0.75, topOffsetFactor: 0.35 },
    paw: { sizeFactor: 0.16, underOffsetFactor: 0.5, frontBackSpreadFactor: 0.3, sideSpreadFactor: 0.2 },
    tail: { lengthFactor: 1.0, radiusFactor: 0.04, tipFactor: 1.0, upwardAngle: 0 }
};

export const INITIAL_SPAWN_INTERVAL_MS = 3000;
export const INITIAL_DESPAWN_TIMEOUT_MS = 9000;

export const CAT_VARIANTS = [
  {name: 'Tabby', color: 0xA0522D, eyeColor: 0x00FF00},
  {name: 'Siamese', color: 0xFDF5E6, eyeColor: 0x0000FF},
  {name: 'Persian', color: 0xFFFFFF, eyeColor: 0xFFA500},
  {name: 'Bengal', color: 0xD2691E, eyeColor: 0xFFD700},
  {name: 'Sphynx', color: 0xFFC0CB, eyeColor: 0x00FFFF},
  {name: 'Scottish Fold', color: 0x808080, eyeColor: 0xFFFF00},
  {name: 'Maine Coon', color: 0x8B4513, eyeColor: 0x8B4513},
  {name: 'Russian Blue', color: 0x4682B4, eyeColor: 0x00FF00},
  {name: 'Ragdoll', color: 0xF0F8FF, eyeColor: 0x0000FF},
  {name: 'British Shorthair', color: 0x708090, eyeColor: 0xFFA500}
];

export const CAT_COLORS = CAT_VARIANTS.map(v => v.color);
export const EYE_COLORS = CAT_VARIANTS.map(v => v.eyeColor);

export const CAT_NAMES = [
    "Whiskers", "Shadow", "Ginger", "Smokey", "Tiger", "Mittens", "Leo", "Bella", "Luna", "Oliver", 
    "Cleo", "Simba", "Lucy", "Max", "Nala", "Charlie", "Chloe", "Milo", "Sophie", "Oscar", 
    "Zoe", "Jasper", "Lily", "Rocky", "Gracie", "Coco", "Bandit", "Sadie", "Gizmo", "Ruby", "Thor"
];

export const INITIAL_CAT_TYPES = CAT_VARIANTS.map(v => v.name);
