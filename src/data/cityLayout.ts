/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RoadNode {
  id: string;
  x: number;
  z: number;
}

export interface RoadSegment {
  id: string;
  from: string;
  to: string;
}

export interface BuildingPlacement {
  chapterId: number;
  segmentId: string;
  t: number;
  side: 1 | -1;
}

// Smooth GTA-style rolling hills terrain elevation (tanjakan & turunan)
export function getElevation(x: number, z: number): number {
  const wave = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 1.8;
  const northSlope = Math.max(0, (-z - 10) * 0.045);
  const eastHill = Math.max(0, (x - 20) * 0.035);
  return wave + northSlope + eastHill;
}

// Connected city intersection nodes (forming organic GTA-style ring + winding inner avenues)
export const ROAD_NODES: Record<string, RoadNode> = {
  N0: { id: 'N0', x: 0, z: 0 },       // Central Plaza
  N1: { id: 'N1', x: 0, z: -34 },     // North Hill Junction
  N2: { id: 'N2', x: -38, z: -44 },   // Northwest Overlook
  N3: { id: 'N3', x: -56, z: -12 },   // West Ridge
  N4: { id: 'N4', x: -44, z: 34 },    // Southwest Valley
  N5: { id: 'N5', x: 0, z: 40 },      // South Boulevard
  N6: { id: 'N6', x: 44, z: 32 },     // Southeast District
  N7: { id: 'N7', x: 54, z: -8 },     // East Bay Ridge
  N8: { id: 'N8', x: 38, z: -46 },    // Northeast Heights
  N9: { id: 'N9', x: -26, z: 6 },     // Mid-West Bend
  N10: { id: 'N10', x: 28, z: -4 },   // Mid-East Bend
};

// Every road segment connects two nodes cleanly (paved asphalt + sidewalks + yellow centerlines)
export const ROAD_SEGMENTS: RoadSegment[] = [
  // Outer Scenic Ring Road (Counter-clockwise: R0..R7)
  { id: 'R0', from: 'N1', to: 'N2' },
  { id: 'R1', from: 'N2', to: 'N3' },
  { id: 'R2', from: 'N3', to: 'N4' },
  { id: 'R3', from: 'N4', to: 'N5' },
  { id: 'R4', from: 'N5', to: 'N6' },
  { id: 'R5', from: 'N6', to: 'N7' },
  { id: 'R6', from: 'N7', to: 'N8' },
  { id: 'R7', from: 'N8', to: 'N1' },
  // Inner City Avenues (R8..R15)
  { id: 'R8', from: 'N1', to: 'N0' },
  { id: 'R9', from: 'N0', to: 'N5' },
  { id: 'R10', from: 'N3', to: 'N9' },
  { id: 'R11', from: 'N9', to: 'N0' },
  { id: 'R12', from: 'N0', to: 'N10' },
  { id: 'R13', from: 'N10', to: 'N7' },
  { id: 'R14', from: 'N9', to: 'N4' },
  { id: 'R15', from: 'N10', to: 'N6' },
];

// Placement of all 11 Chapter Buildings right alongside paved roads (never on grass field or inside roads!)
export const CHAPTER_BUILDING_PLACEMENTS: BuildingPlacement[] = [
  { chapterId: 1, segmentId: 'R11', t: 0.50, side: -1 }, // Inner West Ave near Central Plaza
  { chapterId: 2, segmentId: 'R8', t: 0.52, side: -1 },  // Inner North Main St (East side)
  { chapterId: 3, segmentId: 'R12', t: 0.52, side: 1 },  // Inner East Ave (South side)
  { chapterId: 4, segmentId: 'R0', t: 0.50, side: 1 },   // Outer Northwest Hilltop
  { chapterId: 5, segmentId: 'R1', t: 0.50, side: 1 },   // Outer West Scenic Ridge
  { chapterId: 6, segmentId: 'R2', t: 0.50, side: 1 },   // Outer Southwest Avenue
  { chapterId: 7, segmentId: 'R3', t: 0.50, side: 1 },   // Outer South Boulevard
  { chapterId: 8, segmentId: 'R4', t: 0.50, side: 1 },   // Outer Southeast Avenue
  { chapterId: 9, segmentId: 'R5', t: 0.50, side: 1 },   // Outer East Bay Ridge
  { chapterId: 10, segmentId: 'R6', t: 0.50, side: 1 },  // Outer Northeast Heights
  { chapterId: 11, segmentId: 'R7', t: 0.50, side: 1 },  // Outer North Summit
];

// Compute exact world position, terrain Y, and facing rotation toward the road
export function getRoadsidePlacement(
  segmentId: string,
  t: number,
  side: 1 | -1,
  offsetFromCenter = 9.5
): { x: number; y: number; z: number; facingAngle: number; roadX: number; roadZ: number } {
  const seg = ROAD_SEGMENTS.find((s) => s.id === segmentId)!;
  const a = ROAD_NODES[seg.from];
  const b = ROAD_NODES[seg.to];

  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;

  // Left-hand perpendicular (-uz, ux) points outward for CCW outer loop
  const px = -uz;
  const pz = ux;

  const roadX = a.x + dx * t;
  const roadZ = a.z + dz * t;

  const x = roadX + px * side * offsetFromCenter;
  const z = roadZ + pz * side * offsetFromCenter;
  const y = getElevation(x, z);

  // Building front (+Z local) faces directly toward the road (-perp * side)
  const toRoadX = -px * side;
  const toRoadZ = -pz * side;
  const facingAngle = Math.atan2(toRoadX, toRoadZ);

  return { x, y, z, facingAngle, roadX, roadZ };
}

// Closed vehicle driving loops covering EVERY SINGLE road segment (R0..R15)
export const VEHICLE_ROUTES: string[][] = [
  // Outer Ring Loop Clockwise (covers R0..R7)
  ['N1', 'N8', 'N7', 'N6', 'N5', 'N4', 'N3', 'N2'],
  // Outer Ring Loop Counter-Clockwise (covers R0..R7 opposite lane)
  ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'],
  // West-to-East Cross Boulevard + North Return (covers R10, R11, R12, R13, R6, R7, R0, R1)
  ['N3', 'N9', 'N0', 'N10', 'N7', 'N8', 'N1', 'N2'],
  // North-South Central Main Street + West Return (covers R8, R9, R3, R2, R1, R0)
  ['N1', 'N0', 'N5', 'N4', 'N3', 'N2'],
  // Southwest Connector Loop (covers R14, R3, R9, R11)
  ['N9', 'N4', 'N5', 'N0'],
  // Southeast Connector Loop (covers R15, R4, R9, R12)
  ['N10', 'N6', 'N5', 'N0'],
];

export const TRAFFIC_LIGHT_NODES = ['N0', 'N1', 'N3', 'N4', 'N5', 'N6', 'N7', 'N9', 'N10'];
