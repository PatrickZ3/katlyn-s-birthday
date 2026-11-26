import * as THREE from "three";
import { createCharacter } from "./character";
import { Collider, type MapData, project, scaleMap } from "./geo";
import { SKY_HORIZON, SKY_TOP, buildWorld } from "./world";

/**
 * Runs the Explore Toronto 3D view: Katlyn walking around the real streets
 * in third person.
 *
 * Camera: while she walks, it sits behind her at the default angle and
 * can't be turned. Once she stops, drag to look around and pinch to zoom.
 * As soon as she walks again, it swings back behind her.
 */

/** Joystick input, each from -1 to 1. Up on the stick is y = -1. */
export type StickInput = { x: number; y: number };

export type ExploreOptions = {
  map: MapData;
  stick: StickInput;
  home: { lat: number; lon: number; sign: string; label: string };
  /** Called with the nearest crossing's name, like "Yonge St & Dundas St". */
  onPlace: (place: string) => void;
  onStep: () => void;
};

export type ExploreView = {
  /** The map as shown (already shrunk), for drawing the 2D map. */
  map: MapData;
  home: [number, number];
  /** Where she is now, in the same units as `map`. */
  position: () => [number, number];
  /** Moves her to the nearest spot she can stand near x,z. */
  teleport: (x: number, z: number) => void;
  stop: () => void;
};

/**
 * How big the city is compared to real life. 1 is real size; 0.7 shrinks
 * the streets and buildings to 70% so walking around is quicker. She stays
 * the same size.
 */
export const MAP_SCALE = 0.7;

/** Tweak how she moves and how the camera behaves. */
const WALK_SPEED = 1.6; // metres per second with the stick pushed a little
const RUN_SPEED = 6; // metres per second with the stick pushed all the way
const RADIUS = 0.32; // how close she can get to walls
const CAMERA = {
  /**
   * The default view she always returns to when walking: the camera sits
   * `distance` metres behind her, raised `pitch` (in radians, 0.38 is about
   * 22 degrees) above her.
   */
  distance: 10,
  pitch: 0.38,
  /** How much the camera sees from top to bottom, in degrees. */
  fov: 60,
  minDistance: 3,
  /** How far out she can zoom while standing still, to take in the skyline. */
  maxDistance: 45,
  minPitch: 0.08,
  maxPitch: 1.4,
  /** How fast dragging turns the camera. */
  turnSpeed: 0.0065,
  /** How quickly the camera swings back behind her once she walks. */
  returnSpeed: 4,
  /** The point the camera circles around: her chest. */
  lookHeight: 1.2,
  /**
   * Where she stands on the screen, from 0 (top) to 1 (bottom). The view
   * tilts up to keep her there, so you see down the street ahead of her.
   */
  screenY: 0.68,
};

/** How far the view tilts up from looking straight at her, so she sits at CAMERA.screenY. */
const VIEW_TILT = Math.atan((CAMERA.screenY - 0.5) * 2 * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180));

function skyDome() {
  const geometry = new THREE.SphereGeometry(1500, 24, 16);
  const colors: number[] = [];
  const position = geometry.getAttribute("position");
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const t = Math.max(0, position.getY(i) / 1500);
    color.copy(SKY_HORIZON).lerp(SKY_TOP, Math.pow(t, 0.6));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  return new THREE.Mesh(geometry, material);
}

/** Snowflakes in a box that follows the camera, so it's always snowing around her. */
function snowfall(count: number) {
  const box = { x: 50, y: 30, z: 50 };
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * box.x;
    positions[i * 3 + 1] = Math.random() * box.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * box.z;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.PointsMaterial({ size: 0.16, map: texture, transparent: true, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return {
    points,
    update(dt: number, center: THREE.Vector3, time: number) {
      for (let i = 0; i < count; i++) {
        let y = positions[i * 3 + 1] - dt * (0.9 + (i % 5) * 0.12);
        if (y < 0) y += box.y;
        positions[i * 3 + 1] = y;
        positions[i * 3] += Math.sin(time + i) * dt * 0.2;
      }
      geometry.getAttribute("position").needsUpdate = true;
      // Keep the box centred on her by wrapping flakes around.
      points.position.set(
        center.x - (((center.x % box.x) + box.x) % box.x) + box.x / 2,
        0,
        center.z - (((center.z % box.z) + box.z) % box.z) + box.z / 2,
      );
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

export function startExplore(container: HTMLElement, options: ExploreOptions): ExploreView {
  const { stick } = options;
  const map = scaleMap(options.map, MAP_SCALE);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.touchAction = "none";

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SKY_HORIZON.clone().lerp(new THREE.Color("#c9cfe0"), 0.5), 80, 380);
  scene.add(skyDome());

  // Soft winter light: a cool sky, bright snow bouncing light back, and a low warm sun.
  scene.add(new THREE.HemisphereLight("#c7d6ff", "#f2eee8", 1.7));
  const sun = new THREE.DirectionalLight("#ffd2a8", 1.4);
  sun.position.set(-120, 90, 160);
  scene.add(sun);

  const collider = new Collider(
    map.buildings.map((b) => b.p),
    map.walk,
  );

  // Her home, on the sidewalk outside 711 Bay. She starts here.
  const [hx, hz] = project(options.map, options.home.lat, options.home.lon);
  const home = collider.nearestFree(hx * MAP_SCALE, hz * MAP_SCALE, 1.6) ?? map.spawn;

  const world = buildWorld(map, MAP_SCALE, { x: home[0], z: home[1], sign: options.home.sign, label: options.home.label }, collider);
  scene.add(world.group);

  const katlyn = createCharacter();
  katlyn.onStep(options.onStep);
  scene.add(katlyn.root);

  const snow = snowfall(900);
  scene.add(snow.points);

  // Stand a couple of steps in front of the sign, facing down Bay towards Queen.
  const [bc, , , bq] = map.corners;
  const south = new THREE.Vector2(bq[0] - bc[0], bq[1] - bc[1]).normalize();
  const start = collider.nearestFree(home[0] - south.y * 2.2, home[1] + south.x * 2.2, RADIUS) ?? home;
  const position = new THREE.Vector3(start[0], 0, start[1]);
  let facing = Math.atan2(south.x, south.y);
  katlyn.root.rotation.y = facing;

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 2000);
  const behind = () => facing + Math.PI;
  let yaw = behind();
  let pitch = CAMERA.pitch;
  let distance = CAMERA.distance;
  let walking = false;
  /** While the stick is held, directions stay relative to the camera as it was when she set off. */
  let inputYaw = yaw;

  // Dragging turns the camera and pinching zooms, but only while she's standing still.
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStart = 0;
  let pinchDistance = distance;
  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      pinchDistance = distance;
    }
  };
  const onMove = (e: PointerEvent) => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, next);
    if (walking) return;
    if (pointers.size === 1) {
      yaw -= (next.x - last.x) * CAMERA.turnSpeed;
      pitch = THREE.MathUtils.clamp(pitch + (next.y - last.y) * CAMERA.turnSpeed * 0.7, CAMERA.minPitch, CAMERA.maxPitch);
    } else if (pointers.size === 2 && pinchStart > 0) {
      const [a, b] = [...pointers.values()];
      const now = Math.hypot(a.x - b.x, a.y - b.y);
      distance = THREE.MathUtils.clamp((pinchDistance * pinchStart) / now, CAMERA.minDistance, CAMERA.maxDistance);
    }
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = 0;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (walking) return;
    distance = THREE.MathUtils.clamp(distance * (1 + e.deltaY * 0.001), CAMERA.minDistance, CAMERA.maxDistance);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // Arrow keys / WASD too, for trying it on a computer.
  const keys = new Set<string>();
  const onKey = (e: KeyboardEvent) => {
    if (e.type === "keydown") keys.add(e.key.toLowerCase());
    else keys.delete(e.key.toLowerCase());
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const raycaster = new THREE.Raycaster();
  const target = new THREE.Vector3();
  const wanted = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const clock = new THREE.Clock();
  let placeTimer = 0;
  let lastPlace = "";
  let frame = 0;

  const turnToward = (from: number, to: number, amount: number) => {
    const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + diff * Math.min(1, amount);
  };

  const loop = () => {
    frame = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 1 / 20);
    const time = clock.elapsedTime;

    // Combine the joystick and keys into one push, from -1 to 1 each way.
    let sx = stick.x;
    let sy = stick.y;
    if (keys.has("arrowleft") || keys.has("a")) sx -= 1;
    if (keys.has("arrowright") || keys.has("d")) sx += 1;
    if (keys.has("arrowup") || keys.has("w")) sy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) sy += 1;
    const push = Math.min(1, Math.hypot(sx, sy));

    const wasWalking = walking;
    walking = push > 0.12;
    if (walking && !wasWalking) inputYaw = yaw;

    let speed = 0;
    if (walking) {
      // "Up" on the stick walks away from the camera.
      const length = Math.hypot(sx, sy) || 1;
      const ux = sx / length;
      const uy = sy / length;
      const moveX = -Math.sin(inputYaw) * -uy + Math.cos(inputYaw) * ux;
      const moveZ = -Math.cos(inputYaw) * -uy - Math.sin(inputYaw) * ux;
      speed = WALK_SPEED + (RUN_SPEED - WALK_SPEED) * Math.pow((push - 0.12) / 0.88, 1.5);
      const [x, z] = collider.move(position.x, position.z, moveX * speed * dt, moveZ * speed * dt, RADIUS);
      speed = Math.hypot(x - position.x, z - position.z) / dt;
      position.x = x;
      position.z = z;
      facing = turnToward(facing, Math.atan2(moveX, moveZ), dt * 12);

      // The camera eases back to the default view behind her.
      const ease = dt * CAMERA.returnSpeed;
      yaw = turnToward(yaw, behind(), ease);
      pitch += (CAMERA.pitch - pitch) * Math.min(1, ease);
      distance += (CAMERA.distance - distance) * Math.min(1, ease);
    }
    katlyn.root.position.copy(position);
    katlyn.root.rotation.y = facing;
    katlyn.update(dt, speed);

    // Camera orbits her. If a building is in the way, it moves in closer.
    target.set(position.x, CAMERA.lookHeight, position.z);
    direction.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    raycaster.set(target, direction);
    raycaster.far = distance;
    const hit = raycaster.intersectObjects(world.solids, false)[0];
    const reach = hit ? Math.max(1.2, hit.distance - 0.4) : distance;
    wanted.copy(target).addScaledVector(direction, reach);
    wanted.y = Math.max(0.4, wanted.y);
    camera.position.copy(wanted);
    camera.lookAt(target);
    // Tilt up from her towards the street ahead, so she sits low on the screen.
    camera.rotateX(VIEW_TILT);

    snow.update(dt, position, time);
    world.update(time);
    renderer.render(scene, camera);

    // Every half second, say which crossing she's near.
    placeTimer -= dt;
    if (placeTimer <= 0) {
      placeTimer = 0.5;
      let best = Infinity;
      let place = "Downtown Toronto";
      if (Math.hypot(home[0] - position.x, home[1] - position.z) < 12) {
        place = options.home.sign;
      } else {
        for (const sign of map.signs) {
          const d = Math.hypot(sign.x - position.x, sign.z - position.z);
          if (d < best) {
            best = d;
            place = d < 100 ? sign.names.join(" & ") : place;
          }
        }
      }
      if (place !== lastPlace) options.onPlace(place);
      lastPlace = place;
    }
  };
  loop();

  return {
    map,
    home: [home[0], home[1]],
    position: () => [position.x, position.z],
    teleport(x, z) {
      // Prefer an open spot, not a narrow gap between buildings.
      const spot = collider.nearestFree(x, z, 2.5) ?? collider.nearestFree(x, z, RADIUS);
      if (!spot) return;
      position.set(spot[0], 0, spot[1]);
      yaw = behind();
      pitch = CAMERA.pitch;
      distance = CAMERA.distance;
      placeTimer = 0;
    },
    stop() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      world.dispose();
      katlyn.dispose();
      snow.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      canvas.remove();
    },
  };
}
