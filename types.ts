
import * as THREE from 'three';

export interface CatSettings {
  body: { baseLength: number; baseHeight: number; baseWidth: number };
  head: { sizeFactor: number; forwardOffset: number; upwardOffset: number };
  ear: { sizeFactor: number; heightFactor: number; spreadFactor: number; topOffsetFactor: number; backOffsetFactor: number };
  eye: { sizeFactor: number; spreadFactor: number; forwardOffsetFactor: number; topOffsetFactor: number };
  paw: { sizeFactor: number; underOffsetFactor: number; frontBackSpreadFactor: number; sideSpreadFactor: number };
  tail: { lengthFactor: number; radiusFactor: number; tipFactor: number; upwardAngle: number };
}

export interface CatInstance {
  id: string;
  name: string;
  type: string;
  mesh: THREE.Group;
  spawnTime: number;
  rotationSpeed: THREE.Vector3;
  targetScale: number;
}
