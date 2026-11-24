import * as THREE from "three";

/**
 * Katlyn as a little 3D character: blue puffer jacket over a black top,
 * long brown hair with a centre part, round glasses, and a boba in her hand.
 * Built from simple shapes, about 1.8 m tall, facing +z.
 *
 * To change her colours, edit COLORS.
 */
export const COLORS = {
  jacket: "#3f7fd9",
  jacketPuff: "#5592e6",
  top: "#1b1b20",
  pants: "#2b2f3d",
  shoes: "#f2f2f2",
  skin: "#f3cfae",
  hair: "#8b4a2b",
  glasses: "#c8b27e",
  eyes: "#2a1d18",
  tea: "#d7b08a",
  pearls: "#3a2418",
  straw: "#e8d6ac",
};

export type Character = {
  root: THREE.Group;
  /** `speed` is metres per second; 0 means standing still. */
  update: (dt: number, speed: number) => void;
  /** Fires on each footstep, so a sound can play. */
  onStep: (listener: () => void) => void;
  dispose: () => void;
};

export function createCharacter(): Character {
  const materials = new Map<string, THREE.MeshLambertMaterial>();
  const material = (color: string) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color)!;
  };
  const geometries: THREE.BufferGeometry[] = [];
  const mesh = (geometry: THREE.BufferGeometry, color: string) => {
    geometries.push(geometry);
    return new THREE.Mesh(geometry, material(color));
  };

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Legs swing from the hips.
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.11, 0.78, 0);
    const leg = mesh(new THREE.CapsuleGeometry(0.085, 0.55, 4, 10), COLORS.pants);
    leg.position.y = -0.36;
    const shoe = mesh(new THREE.BoxGeometry(0.15, 0.1, 0.26), COLORS.shoes);
    shoe.position.set(0, -0.72, 0.04);
    hip.add(leg, shoe);
    body.add(hip);
    return hip;
  });

  // Puffer jacket: a rounded body with puffy rings around it.
  const torso = new THREE.Group();
  torso.position.y = 1.08;
  body.add(torso);
  const jacket = mesh(new THREE.CapsuleGeometry(0.25, 0.36, 6, 16), COLORS.jacket);
  jacket.scale.set(1, 1, 0.78);
  torso.add(jacket);
  [-0.16, 0, 0.16].forEach((y) => {
    const ring = mesh(new THREE.TorusGeometry(0.245, 0.035, 8, 24), COLORS.jacketPuff);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(1, 0.78, 1);
    ring.position.y = y;
    torso.add(ring);
  });
  // The open zip shows her black top.
  const top = mesh(new THREE.BoxGeometry(0.11, 0.5, 0.02), COLORS.top);
  top.position.set(0, 0.02, 0.2);
  torso.add(top);
  const collar = mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 18), COLORS.jacket);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.3;
  torso.add(collar);

  // Arms swing from the shoulders. The right one holds the boba.
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.33, 1.3, 0);
    const arm = mesh(new THREE.CapsuleGeometry(0.085, 0.4, 4, 10), COLORS.jacket);
    arm.position.y = -0.25;
    arm.rotation.z = side * 0.12;
    const hand = mesh(new THREE.SphereGeometry(0.065, 10, 8), COLORS.skin);
    hand.position.set(side * 0.05, -0.52, 0);
    shoulder.add(arm, hand);
    body.add(shoulder);
    return shoulder;
  });

  const boba = new THREE.Group();
  const cup = mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.17, 14), COLORS.tea);
  (cup.material as THREE.MeshLambertMaterial).transparent = true;
  (cup.material as THREE.MeshLambertMaterial).opacity = 0.92;
  const lid = mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.015, 14), "#f4f1ea");
  lid.position.y = 0.09;
  const straw = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), COLORS.straw);
  straw.position.set(0.015, 0.17, 0);
  boba.add(cup, lid, straw);
  for (let i = 0; i < 6; i++) {
    const pearl = mesh(new THREE.SphereGeometry(0.018, 6, 5), COLORS.pearls);
    pearl.position.set(Math.cos(i) * 0.035, -0.06, Math.sin(i) * 0.035);
    boba.add(pearl);
  }
  boba.position.set(0.06, -0.55, 0.07);
  arms[1].add(boba);
  // Her boba arm stays a bit bent, holding the cup in front.
  arms[1].rotation.x = -0.35;

  // Head, with a slightly big chibi size.
  const head = new THREE.Group();
  head.position.y = 1.62;
  body.add(head);
  const face = mesh(new THREE.SphereGeometry(0.25, 20, 16), COLORS.skin);
  face.scale.set(1, 1.05, 0.95);
  head.add(face);

  // Hair: no bangs. A cap sits back from her forehead, parted in the middle
  // and sweeping down each side, with long hair down her back and strands
  // framing her face.
  const cap = mesh(new THREE.SphereGeometry(0.272, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), COLORS.hair);
  cap.position.set(0, 0.02, -0.03);
  cap.rotation.x = -0.72;
  head.add(cap);
  [-1, 1].forEach((side) => {
    // Each side of the centre part, curving from the top of her head down past her temple.
    const sweep = mesh(new THREE.SphereGeometry(0.15, 14, 10), COLORS.hair);
    sweep.scale.set(0.95, 0.5, 0.75);
    sweep.position.set(side * 0.12, 0.15, 0.1);
    sweep.rotation.set(-0.35, 0, side * -0.62);
    head.add(sweep);
  });
  const back = mesh(new THREE.CapsuleGeometry(0.21, 0.42, 6, 14), COLORS.hair);
  back.scale.set(1.2, 1, 0.62);
  back.position.set(0, -0.28, -0.17);
  head.add(back);
  [-1, 1].forEach((side) => {
    const strand = mesh(new THREE.CapsuleGeometry(0.065, 0.4, 4, 8), COLORS.hair);
    strand.position.set(side * 0.21, -0.2, 0.05);
    strand.rotation.z = side * -0.08;
    head.add(strand);
  });

  // Eyes, round glasses and a small neutral mouth.
  [-1, 1].forEach((side) => {
    const eye = mesh(new THREE.SphereGeometry(0.026, 10, 8), COLORS.eyes);
    eye.position.set(side * 0.085, 0.01, 0.225);
    head.add(eye);
    const lens = mesh(new THREE.TorusGeometry(0.068, 0.009, 6, 24), COLORS.glasses);
    lens.position.set(side * 0.088, 0.012, 0.245);
    head.add(lens);
    const arm = mesh(new THREE.BoxGeometry(0.008, 0.008, 0.2), COLORS.glasses);
    arm.position.set(side * 0.2, 0.03, 0.15);
    head.add(arm);
  });
  const bridge = mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), COLORS.glasses);
  bridge.position.set(0, 0.03, 0.25);
  head.add(bridge);
  const mouth = mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), "#b5655a");
  mouth.position.set(0, -0.11, 0.232);
  head.add(mouth);
  [-1, 1].forEach((side) => {
    const blush = mesh(new THREE.CircleGeometry(0.03, 12), "#f3a6a0");
    blush.position.set(side * 0.14, -0.06, 0.218);
    blush.rotation.y = side * 0.5;
    head.add(blush);
  });

  // A soft round shadow under her feet.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(0,0,0,0.45)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeometry = new THREE.PlaneGeometry(1, 1);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  root.add(shadow);

  let phase = 0;
  let idle = 0;
  const stepListeners: (() => void)[] = [];
  let lastStep = 0;

  return {
    root,
    update(dt, speed) {
      idle += dt;
      const moving = speed > 0.05;
      // Faster walking swings the legs faster and further.
      phase += dt * (moving ? 3.2 + speed * 1.4 : 0);
      const swing = moving ? Math.min(0.75, 0.35 + speed * 0.09) : 0;
      const s = Math.sin(phase);

      legs[0].rotation.x = THREE.MathUtils.lerp(legs[0].rotation.x, s * swing, 0.35);
      legs[1].rotation.x = THREE.MathUtils.lerp(legs[1].rotation.x, -s * swing, 0.35);
      arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, -s * swing * 0.8, 0.35);
      arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, -0.35 + s * swing * 0.35, 0.35);
      body.position.y = moving ? Math.abs(Math.cos(phase)) * 0.05 : Math.sin(idle * 2) * 0.008;
      torso.scale.y = moving ? 1 : 1 + Math.sin(idle * 2) * 0.012;
      head.rotation.y = moving ? 0 : Math.sin(idle * 0.6) * 0.15;

      // One footstep each time a foot passes the ground.
      const step = Math.floor(phase / Math.PI);
      if (moving && step !== lastStep) stepListeners.forEach((listener) => listener());
      lastStep = step;
    },
    onStep(listener) {
      stepListeners.push(listener);
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
    },
  };
}
