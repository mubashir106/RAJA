// ===== CONSTANTS =====
const GRAVITY = -28;
const PLAYER_SPEED = 9;
const SPRINT_MULT = 1.6;
const JUMP_VEL = 13;
const WALL_JUMP_VEL = 11;
const WALL_RUN_GRAVITY = -4;
const WALL_RUN_SPEED = 12;
const WALL_RUN_MAX = 2.5;
const WALL_DETECT_DIST = 0.9;
const PLAYER_HEIGHT = 1.75;
const SLIDE_SPEED = 14;
const SLIDE_FRICTION = 3;
const SLIDE_HEIGHT = 0.9;
const NET_RATE = 1 / 20;
const RESPAWN_DELAY = 3.5;

// ===== WEAPON DATA =====
// Stats tuned to BO3 TTK: body shots to kill at 100hp, fire rate in RPM
const WEAPONS = {
  'KN-44': {
    // 3-4 body shots, ~280ms TTK - classic AR feel
    damage: 34, headMult: 1.5, fireRate: 620, magSize: 30, totalAmmo: 210,
    reloadTime: 2.2, spread: 0.022, spreadADS: 0.004, auto: true,
    recoilX: 0.80, recoilY: 0.25, scopeFOV: 52,
    muzzleZ: -0.62,
  },
  'Vesper': {
    // 5 body shots but very fast RPM, ~330ms TTK
    damage: 22, headMult: 1.4, fireRate: 980, magSize: 40, totalAmmo: 280,
    reloadTime: 1.7, spread: 0.055, spreadADS: 0.016, auto: true,
    recoilX: 0.40, recoilY: 0.18, scopeFOV: 60,
    muzzleZ: -0.44,
  },
  'Haymaker': {
    // 8 pellets x 14 dmg = 112 max, 1-shot at close range
    damage: 14, headMult: 1.2, fireRate: 58, magSize: 8, totalAmmo: 56,
    reloadTime: 3.0, spread: 0.10, spreadADS: 0.07, auto: false, pellets: 8,
    recoilX: 2.6, recoilY: 0.5, scopeFOV: 65,
    muzzleZ: -0.72,
  },
  'Sheiva': {
    // 2-shot body kill (72x2=144), ACOG sight
    damage: 72, headMult: 1.8, fireRate: 240, magSize: 10, totalAmmo: 70,
    reloadTime: 2.5, spread: 0.005, spreadADS: 0.001, auto: false,
    recoilX: 1.5, recoilY: 0.30, scopeFOV: 36, hasACOG: true,
    muzzleZ: -0.80,
  },
  'Drakon': {
    // 1-shot body kill (95 dmg), headshot instant (190)
    damage: 95, headMult: 2.0, fireRate: 42, magSize: 5, totalAmmo: 25,
    reloadTime: 3.8, spread: 0.003, spreadADS: 0.0002, auto: false,
    recoilX: 3.2, recoilY: 0.25, scopeFOV: 10, isSniper: true,
    muzzleZ: -1.05,
  },
};
const WEAPON_NAMES = Object.keys(WEAPONS);

// ===== MAP GEOMETRY =====
const MAP = [
  // Floor
  { p: [0, -0.5, 0], s: [120, 1, 120], c: 0x1a1a1a },
  // Ceiling - removed so sky is visible

  // Outer walls
  { p: [0, 5, -52], s: [104, 12, 2], c: 0x1e2028 },
  { p: [0, 5, 52],  s: [104, 12, 2], c: 0x1e2028 },
  { p: [-52, 5, 0], s: [2, 12, 104], c: 0x1e2028 },
  { p: [52, 5, 0],  s: [2, 12, 104], c: 0x1e2028 },

  // Long wall-run walls (center corridors) - highlighted blue for visibility
  { p: [-14, 4, 0], s: [1.2, 8, 30], c: 0x1a2540, wr: true },
  { p: [14, 4, 0],  s: [1.2, 8, 30], c: 0x1a2540, wr: true },
  { p: [0, 4, -14], s: [30, 8, 1.2], c: 0x1a2540, wr: true },
  { p: [0, 4, 14],  s: [30, 8, 1.2], c: 0x1a2540, wr: true },

  // Corner wall-run walls
  { p: [-30, 4, -14], s: [1.2, 8, 20], c: 0x1a2540, wr: true },
  { p: [30, 4, -14],  s: [1.2, 8, 20], c: 0x1a2540, wr: true },
  { p: [-30, 4, 14],  s: [1.2, 8, 20], c: 0x1a2540, wr: true },
  { p: [30, 4, 14],   s: [1.2, 8, 20], c: 0x1a2540, wr: true },

  // Elevated platforms
  { p: [-32, 3, -32], s: [12, 0.5, 12], c: 0x2a2a35 },
  { p: [32, 3, -32],  s: [12, 0.5, 12], c: 0x2a2a35 },
  { p: [-32, 3, 32],  s: [12, 0.5, 12], c: 0x2a2a35 },
  { p: [32, 3, 32],   s: [12, 0.5, 12], c: 0x2a2a35 },

  // Ramps to platforms
  { p: [-26, 1.5, -32], s: [4, 0.3, 12], c: 0x252530, rot: [0, 0, 0.18] },
  { p: [26, 1.5, -32],  s: [4, 0.3, 12], c: 0x252530, rot: [0, 0, -0.18] },
  { p: [-26, 1.5, 32],  s: [4, 0.3, 12], c: 0x252530, rot: [0, 0, 0.18] },
  { p: [26, 1.5, 32],   s: [4, 0.3, 12], c: 0x252530, rot: [0, 0, -0.18] },

  // Cover boxes center
  { p: [0, 1, 0],     s: [4, 2, 4], c: 0x282830 },
  { p: [-7, 0.75, 0], s: [2, 1.5, 4], c: 0x222228 },
  { p: [7, 0.75, 0],  s: [2, 1.5, 4], c: 0x222228 },
  { p: [0, 0.75, -7], s: [4, 1.5, 2], c: 0x222228 },
  { p: [0, 0.75, 7],  s: [4, 1.5, 2], c: 0x222228 },

  // Side cover
  { p: [-22, 0.75, 0],  s: [3, 1.5, 6], c: 0x1e1e28 },
  { p: [22, 0.75, 0],   s: [3, 1.5, 6], c: 0x1e1e28 },
  { p: [0, 0.75, -22],  s: [6, 1.5, 3], c: 0x1e1e28 },
  { p: [0, 0.75, 22],   s: [6, 1.5, 3], c: 0x1e1e28 },

  // Corner cover near platforms
  { p: [-38, 0.75, 0],  s: [2, 1.5, 3], c: 0x1e2228 },
  { p: [38, 0.75, 0],   s: [2, 1.5, 3], c: 0x1e2228 },
  { p: [0, 0.75, -38],  s: [3, 1.5, 2], c: 0x1e2228 },
  { p: [0, 0.75, 38],   s: [3, 1.5, 2], c: 0x1e2228 },

  // Second-level walkways
  { p: [-14, 5.5, -35], s: [1.2, 0.5, 14], c: 0x2a2a38 },
  { p: [14, 5.5, -35],  s: [1.2, 0.5, 14], c: 0x2a2a38 },
  { p: [-14, 5.5, 35],  s: [1.2, 0.5, 14], c: 0x2a2a38 },
  { p: [14, 5.5, 35],   s: [1.2, 0.5, 14], c: 0x2a2a38 },
];

// Spawn points
const SPAWNS = [
  [-20, 2, 0], [20, 2, 0], [0, 2, -20], [0, 2, 20],
  [-15, 2, -15], [15, 2, 15], [-15, 2, 15], [15, 2, -15],
  [-32, 5, -32], [32, 5, 32], [-32, 5, 32], [32, 5, -32],
];

// ===== GAME STATE =====
let scene, camera, renderer, yawObj;
let socket;
let localPlayer = null;
let remotePlayers = {};
let collidables = [];
let netTimer = 0;
let myId = null;
let roomCode = '';
let myUsername = '';
let scores = {};
let chatOpen = false;
let gameActive = false;
let pointerLocked = false;

// ===== INPUT =====
const keys = {};
const mouse = { dx: 0, dy: 0, left: false, right: false };

// ===== UTILITY =====
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randRange(lo, hi) { return lo + Math.random() * (hi - lo); }
function vecFromArr(a) { return new THREE.Vector3(a[0], a[1], a[2]); }

// ===== SCENE SETUP =====
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c14);
  scene.fog = new THREE.Fog(0x0a0c14, 60, 120);

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('gameCanvas'),
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 200);
  yawObj = new THREE.Object3D();
  yawObj.add(camera);
  scene.add(yawObj);

  // Lighting
  const ambient = new THREE.AmbientLight(0x334455, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffeedd, 0.8);
  sun.position.set(20, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  // Accent point lights
  const lights = [
    { pos: [-14, 6, 0], color: 0x2244ff, intensity: 1.5, dist: 20 },
    { pos: [14, 6, 0],  color: 0x2244ff, intensity: 1.5, dist: 20 },
    { pos: [0, 6, -14], color: 0xff4422, intensity: 1.5, dist: 20 },
    { pos: [0, 6, 14],  color: 0xff4422, intensity: 1.5, dist: 20 },
    { pos: [0, 4, 0],   color: 0xffffff, intensity: 1.0, dist: 30 },
  ];
  lights.forEach(l => {
    const pl = new THREE.PointLight(l.color, l.intensity, l.dist);
    pl.position.set(...l.pos);
    scene.add(pl);
  });

  buildMap();
  buildGunModel();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

// ===== MAP =====
function buildMap() {
  const mats = {};
  MAP.forEach((def, i) => {
    const geo = new THREE.BoxGeometry(...def.s);
    if (!mats[def.c]) {
      mats[def.c] = new THREE.MeshLambertMaterial({
        color: def.c,
        emissive: def.wr ? new THREE.Color(0x001133) : new THREE.Color(0x000000),
      });
    }
    const mesh = new THREE.Mesh(geo, mats[def.c]);
    mesh.position.set(...def.p);
    if (def.rot) mesh.rotation.set(...def.rot);
    mesh.receiveShadow = true;
    mesh.castShadow = i > 4;
    mesh.userData.isWall = true;
    mesh.userData.wallRunnable = !!def.wr;
    scene.add(mesh);
    collidables.push(mesh);
  });

  // Grid lines on floor
  const grid = new THREE.GridHelper(104, 52, 0x223344, 0x1a2233);
  grid.position.y = 0.01;
  scene.add(grid);
}

// ===== GUN MODEL =====
let gunGroup = null;
let gunModels = {};
let gunBobTime = 0;

// Helper: add a box to a group
function bx(grp, w, h, d, x, y, z, mat, rx, ry, rz) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
  grp.add(m);
  return m;
}
function mat(hex, spec, shin) {
  return new THREE.MeshPhongMaterial({ color: hex, specular: spec || 0x111111, shininess: shin || 30 });
}

function buildGunModel() {
  gunGroup = new THREE.Group();
  camera.add(gunGroup);
  gunGroup.position.set(0.20, -0.20, -0.42);

  // ---- KN-44 (AK-47 style assault rifle) ----
  {
    const g = new THREE.Group();
    const recv  = mat(0x3a3028); // dark tan receiver
    const dark  = mat(0x1a1a1a); // black metal
    const wood  = mat(0x5a3a18, 0x050505, 10); // brown wood
    const rail  = mat(0x282828);

    bx(g, 0.075, 0.065, 0.50,  0,     0,      0,      recv);        // main receiver
    bx(g, 0.072, 0.012, 0.50,  0,     0.038,  0,      rail);        // top dust cover
    bx(g, 0.022, 0.022, 0.50,  0,     0.022, -0.50,   dark);        // barrel
    bx(g, 0.030, 0.008, 0.28,  0,     0.022, -0.36,   dark);        // gas tube
    bx(g, 0.038, 0.028, 0.22,  0,     0.000, -0.42,   dark);        // handguard
    bx(g, 0.072, 0.050, 0.22,  0,    -0.005,  0.28,   wood);        // stock
    bx(g, 0.050, 0.012,  0.22, 0,    -0.030,  0.28,   dark);        // stock bottom rod
    bx(g, 0.040, 0.110, 0.045, 0,    -0.090,  0.06,   recv, 0.15);  // pistol grip
    bx(g, 0.038, 0.155, 0.068, 0,    -0.115, -0.08,   recv, 0.08);  // curved mag part1
    bx(g, 0.038, 0.10,  0.055, 0,    -0.165, -0.02,   recv,-0.15);  // curved mag part2
    bx(g, 0.008, 0.032, 0.005, 0,     0.050, -0.235,  dark);        // front sight
    bx(g, 0.012, 0.018, 0.010, 0,     0.044,  0.06,   dark);        // rear sight

    const muzzleZ = -0.62;
    addFlash(g, muzzleZ);
    g.visible = false;
    gunGroup.add(g);
    gunModels['KN-44'] = g;
  }

  // ---- Vesper (compact SMG) ----
  {
    const g = new THREE.Group();
    const body  = mat(0x252530); // dark graphite
    const dark  = mat(0x151518);
    const grip  = mat(0x1e1e24);
    const tan   = mat(0x3a3525);

    bx(g, 0.068, 0.058, 0.34,  0,     0,      0,      body);        // receiver
    bx(g, 0.065, 0.010, 0.34,  0,     0.034,  0,      dark);        // top rail
    bx(g, 0.020, 0.020, 0.36,  0,     0.010, -0.35,   dark);        // barrel
    bx(g, 0.030, 0.030, 0.12,  0,     0.010, -0.40,   dark);        // fake suppressor
    bx(g, 0.032, 0.032, 0.06,  0,     0.010, -0.46,   mat(0x333333)); // suppressor tip
    bx(g, 0.040, 0.095, 0.040, 0,    -0.080,  0.04,   grip, 0.12);  // pistol grip
    bx(g, 0.040, 0.130, 0.050, 0,    -0.100, -0.04,   body);        // mag (box type)
    bx(g, 0.052, 0.010, 0.18,  0,    -0.015,  0.17,   tan);         // folding stock arm
    bx(g, 0.045, 0.040, 0.015, 0,    -0.040,  0.24,   tan);         // stock butt
    bx(g, 0.008, 0.018, 0.005, 0,     0.034, -0.14,   dark);        // front sight
    bx(g, 0.028, 0.014, 0.018, 0,     0.020, -0.08,   dark);        // foregrip nub

    const muzzleZ = -0.50;
    addFlash(g, muzzleZ);
    g.visible = false;
    gunGroup.add(g);
    gunModels['Vesper'] = g;
  }

  // ---- Haymaker (pump shotgun) ----
  {
    const g = new THREE.Group();
    const recv  = mat(0x1e1e22); // dark receiver
    const wood  = mat(0x4a2e10, 0x050505, 8); // wood
    const dark  = mat(0x141414);
    const brn   = mat(0x382010);

    bx(g, 0.090, 0.072, 0.48,  0,     0,      0,      recv);        // receiver (wide)
    bx(g, 0.088, 0.010, 0.48,  0,     0.041,  0,      dark);        // top
    bx(g, 0.036, 0.036, 0.62,  0,     0.018, -0.40,   dark);        // barrel (single)
    bx(g, 0.048, 0.048, 0.14,  0,     0.018, -0.25,   mat(0x1a1a1a)); // pump handle
    bx(g, 0.075, 0.065, 0.28,  0,    -0.005,  0.28,   wood);        // wooden stock
    bx(g, 0.085, 0.055, 0.04,  0,    -0.005,  0.42,   brn);         // butt plate
    bx(g, 0.044, 0.100, 0.042, 0,    -0.080,  0.06,   recv, 0.1);   // pistol grip
    bx(g, 0.010, 0.018, 0.005, 0,     0.054, -0.18,   dark);        // front bead
    bx(g, 0.036, 0.010, 0.20,  0,    -0.040,  0,      dark);        // shell tube

    const muzzleZ = -0.74;
    addFlash(g, muzzleZ);
    g.visible = false;
    gunGroup.add(g);
    gunModels['Haymaker'] = g;
  }

  // ---- Sheiva (DMR with ACOG) ----
  {
    const g = new THREE.Group();
    const body  = mat(0x282830); // dark grey
    const dark  = mat(0x181820);
    const scope = mat(0x1a1a22);
    const tan   = mat(0x353020);
    const lens  = mat(0x223344, 0x2244aa, 60); // scope lens blue tint

    bx(g, 0.062, 0.060, 0.62,  0,     0,      0,      body);        // receiver
    bx(g, 0.060, 0.010, 0.62,  0,     0.035,  0,      dark);        // top rail
    bx(g, 0.018, 0.018, 0.72,  0,     0.010, -0.48,   dark);        // long barrel
    bx(g, 0.060, 0.048, 0.20,  0,     0,      0.28,   tan);         // stock
    bx(g, 0.055, 0.012, 0.15,  0,    -0.030,  0.28,   dark);        // stock lower
    bx(g, 0.040, 0.100, 0.040, 0,    -0.082,  0.08,   body, 0.12);  // pistol grip
    bx(g, 0.036, 0.110, 0.044, 0,    -0.085, -0.08,   body);        // mag
    // ACOG scope body
    bx(g, 0.040, 0.038, 0.120, 0,     0.070, -0.02,   scope);       // scope body
    bx(g, 0.026, 0.026, 0.008, 0,     0.070, -0.07,   lens);        // front lens
    bx(g, 0.022, 0.022, 0.008, 0,     0.070,  0.04,   lens);        // rear lens
    bx(g, 0.008, 0.018, 0.005, 0,     0.036, -0.28,   dark);        // front sight
    bx(g, 0.028, 0.022, 0.038, 0,     0.028, -0.20,   dark);        // foregrip

    const muzzleZ = -0.86;
    addFlash(g, muzzleZ);
    g.visible = false;
    gunGroup.add(g);
    gunModels['Sheiva'] = g;
  }

  // ---- Drakon (bolt-action sniper rifle) ----
  {
    const g = new THREE.Group();
    const body   = mat(0x2a2820); // dark tan body
    const dark   = mat(0x141414);
    const scope  = mat(0x111118);
    const lens   = mat(0x1a2a3a, 0x334466, 80);
    const metal  = mat(0x1e1e1e);

    bx(g, 0.065, 0.058, 0.72,  0,     0,      0,      body);        // receiver
    bx(g, 0.062, 0.010, 0.72,  0,     0.034,  0,      dark);        // top flat
    bx(g, 0.016, 0.016, 0.90,  0,     0.008, -0.55,   dark);        // very long barrel
    bx(g, 0.024, 0.024, 0.06,  0,     0.008, -0.60,   metal);       // muzzle brake
    // Scope - large, realistic shape
    bx(g, 0.038, 0.038, 0.28,  0,     0.070, -0.04,   scope);       // scope tube
    bx(g, 0.044, 0.044, 0.06,  0,     0.070, -0.06,   scope);       // front bell
    bx(g, 0.042, 0.042, 0.05,  0,     0.070,  0.06,   scope);       // ocular bell
    bx(g, 0.024, 0.024, 0.010, 0,     0.070, -0.10,   lens);        // front lens
    bx(g, 0.020, 0.020, 0.010, 0,     0.070,  0.08,   lens);        // rear lens
    bx(g, 0.010, 0.025, 0.060, 0,     0.082,  0.02,   dark);        // elevation knob
    // Stock
    bx(g, 0.062, 0.048, 0.32,  0,    -0.004,  0.35,   body);        // stock
    bx(g, 0.060, 0.056, 0.04,  0,    -0.002,  0.50,   dark);        // butt pad
    bx(g, 0.040, 0.095, 0.040, 0,    -0.078,  0.10,   body, 0.10);  // pistol grip
    bx(g, 0.032, 0.090, 0.038, 0,    -0.080, -0.04,   dark);        // mag
    // Bipod legs
    bx(g, 0.008, 0.060, 0.006, 0.022, -0.052, -0.40,  dark, 0, 0, 0.25); // bipod L
    bx(g, 0.008, 0.060, 0.006,-0.022,-0.052, -0.40,   dark, 0, 0,-0.25); // bipod R
    // Bolt handle
    bx(g, 0.040, 0.010, 0.010, 0.042, 0.015,  0.08,   metal);       // bolt
    bx(g, 0.012, 0.022, 0.012, 0.058, 0.015,  0.08,   metal);       // bolt knob

    const muzzleZ = -1.08;
    addFlash(g, muzzleZ);
    g.visible = false;
    gunGroup.add(g);
    gunModels['Drakon'] = g;
  }

}

function addFlash(group, muzzleZ) {
  const fMat = new THREE.MeshBasicMaterial({
    color: 0xffee88, transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const fGeo = new THREE.PlaneGeometry(0.14, 0.14);
  const flash1 = new THREE.Mesh(fGeo, fMat);
  flash1.position.set(0, 0.01, muzzleZ);
  group.add(flash1);
  const flash2 = new THREE.Mesh(fGeo, fMat.clone());
  flash2.position.set(0, 0.01, muzzleZ);
  flash2.rotation.z = Math.PI / 4;
  group.add(flash2);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), coreMat);
  core.position.set(0, 0.01, muzzleZ);
  group.add(core);
  const ml = new THREE.PointLight(0xff9933, 0, 7);
  ml.position.set(0, 0.01, muzzleZ - 0.1);
  group.add(ml);
  group.userData.flash = [flash1, flash2];
  group.userData.core = core;
  group.userData.muzzleLight = ml;
}

function setActiveGun(name) {
  Object.values(gunModels).forEach(g => { g.visible = false; });
  if (gunModels[name]) gunModels[name].visible = true;
}

// ===== COLLISION =====
const _raycaster = new THREE.Raycaster();
const _castDir = new THREE.Vector3();

function castRay(origin, dir, maxDist, filter) {
  _raycaster.set(origin, dir.normalize());
  const hits = _raycaster.intersectObjects(filter || collidables);
  if (hits.length > 0 && hits[0].distance <= maxDist) return hits[0];
  return null;
}

// ===== LOCAL PLAYER =====
class LocalPlayer {
  constructor(spawnPos) {
    this.pos = vecFromArr([spawnPos.x, spawnPos.y, spawnPos.z]);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;

    this.grounded = false;
    this.jumpCount = 0;
    this.wallRunning = false;
    this.wallRunTimer = 0;
    this.wallRunSide = null;
    this.wallNormal = new THREE.Vector3();
    this.canWallRun = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.sprinting = false;

    this.health = 100;
    this.alive = true;
    this.weaponIndex = 0;
    this.weaponName = WEAPON_NAMES[0];
    this.ammo = {};
    this.ammoReserve = {};
    WEAPON_NAMES.forEach(n => {
      this.ammo[n] = WEAPONS[n].magSize;
      this.ammoReserve[n] = WEAPONS[n].totalAmmo;
    });
    this.reloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;

    this.camHeight = PLAYER_HEIGHT;
    this.targetCamHeight = PLAYER_HEIGHT;
    this.camTilt = 0;

    this.scoped = false;
    this.currentFOV = 80;
    this.scopeOverlay = document.getElementById('scope-overlay');

    setActiveGun(this.weaponName);
    this.updateHUD();
  }

  get wep() { return WEAPONS[this.weaponName]; }

  switchWeapon(idx) {
    idx = ((idx % WEAPON_NAMES.length) + WEAPON_NAMES.length) % WEAPON_NAMES.length;
    this.weaponIndex = idx;
    this.weaponName = WEAPON_NAMES[idx];
    this.reloading = false;
    this.reloadTimer = 0;
    this.scoped = false;
    setActiveGun(this.weaponName);
    this.updateHUD();
    // Weapon wheel highlight
    document.querySelectorAll('.ww-slot').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
  }

  startReload() {
    if (this.reloading) return;
    if (this.ammo[this.weaponName] >= this.wep.magSize) return;
    if (this.ammoReserve[this.weaponName] <= 0) return;
    this.reloading = true;
    this.reloadTimer = this.wep.reloadTime;
    const bar = document.getElementById('reload-bar');
    const fill = document.getElementById('reload-fill');
    bar.classList.remove('hidden');
    fill.style.width = '0%';
    fill.style.transition = `width ${this.wep.reloadTime}s linear`;
    setTimeout(() => { fill.style.width = '100%'; }, 10);
  }

  shoot() {
    if (!this.alive) return;
    if (this.reloading) return;
    if (this.fireCooldown > 0) return;
    const ammo = this.ammo[this.weaponName];
    if (ammo <= 0) { this.startReload(); return; }

    this.ammo[this.weaponName]--;
    this.fireCooldown = 60 / this.wep.fireRate;
    this.recoilPitch -= this.wep.recoilX * 0.018;
    this.recoilYaw += (Math.random() - 0.5) * this.wep.recoilY * 0.01;

    // Compute forward direction directly from yaw+pitch angles - no matrix dependency
    const pitch = this.pitch + this.recoilPitch;
    const yaw   = this.yaw;
    const cosPitch = Math.cos(pitch);
    const forward = new THREE.Vector3(
      -Math.sin(yaw) * cosPitch,
       Math.sin(pitch),
      -Math.cos(yaw) * cosPitch
    );
    // Right and up vectors for spreading pellets in the correct plane
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
    const up    = new THREE.Vector3().crossVectors(right, forward).normalize();

    // Trigger muzzle flash
    const model = gunModels[this.weaponName];
    if (model && model.userData.flash) {
      const rot = Math.random() * Math.PI * 2;
      model.userData.flash.forEach((f, i) => {
        f.material.opacity = 1;
        f.rotation.z = rot + i * Math.PI / 4;
      });
      model.userData.core.material.opacity = 1;
      model.userData.muzzleLight.intensity = 6;
    }
    this._flashTimer = 0.055;

    const origin = new THREE.Vector3();
    yawObj.getWorldPosition(origin);
    origin.y += PLAYER_HEIGHT - 0.15; // eye level

    const pellets = this.wep.pellets || 1;
    const sp = this.scoped ? (this.wep.spreadADS || this.wep.spread * 0.3) : this.wep.spread;
    for (let p = 0; p < pellets; p++) {
      const dir = forward.clone()
        .addScaledVector(right, (Math.random() - 0.5) * sp * 2)
        .addScaledVector(up,    (Math.random() - 0.5) * sp * 2);
      dir.normalize();

      spawnBulletTrail(origin.clone(), dir.clone().multiplyScalar(90).add(origin));

      socket.emit('player_shoot', {
        origin: { x: origin.x, y: origin.y, z: origin.z },
        direction: { x: dir.x, y: dir.y, z: dir.z },
        weapon: this.weaponName,
      });

      // Raycast hit detection
      const hit = castRay(origin, dir, 200, [...collidables, ...Object.values(remotePlayers).map(r => r.hitbox)]);
      if (hit) {
        const rp = Object.values(remotePlayers).find(r => r.hitbox === hit.object || r.mesh === hit.object);
        if (rp && rp.alive) {
          const dmg = Math.round(this.wep.damage * (hit.object === rp.headbox ? (this.wep.headMult || 1.5) : 1));
          socket.emit('player_hit', { targetId: rp.id, damage: dmg });
          showHitMarker(hit.object === rp.headbox);
        } else {
          spawnImpactParticle(hit.point);
        }
      }
    }

    this.updateHUD();
    if (this.ammo[this.weaponName] === 0 && this.ammoReserve[this.weaponName] > 0) {
      this.startReload();
    }
  }

  update(delta) {
    if (!this.alive) return;

    // Reloading
    if (this.reloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        const needed = this.wep.magSize - this.ammo[this.weaponName];
        const take = Math.min(needed, this.ammoReserve[this.weaponName]);
        this.ammo[this.weaponName] += take;
        this.ammoReserve[this.weaponName] -= take;
        this.reloading = false;
        document.getElementById('reload-bar').classList.add('hidden');
        this.updateHUD();
      }
    }

    this.fireCooldown = Math.max(0, this.fireCooldown - delta);

    // Muzzle flash fade
    if (this._flashTimer > 0) {
      this._flashTimer = Math.max(0, this._flashTimer - delta);
      const t = this._flashTimer / 0.055;
      const m = gunModels[this.weaponName];
      if (m && m.userData.flash) {
        m.userData.flash.forEach(f => { f.material.opacity = t; });
        m.userData.core.material.opacity = t;
        m.userData.muzzleLight.intensity = t * 6;
      }
    }

    // Recoil recovery
    this.recoilPitch = lerp(this.recoilPitch, 0, delta * 8);
    this.recoilYaw = lerp(this.recoilYaw, 0, delta * 8);

    // Shooting
    const wep = this.wep;
    if (mouse.left && (wep.auto ? true : !this._prevShoot)) {
      this.shoot();
    }
    this._prevShoot = mouse.left;

    // Movement
    this.updateMovement(delta);
    this.applyPhysics(delta);
    this.updateCamera();

    // Gun bob
    this.updateGunBob(delta);

    // Network
    netTimer += delta;
    if (netTimer >= NET_RATE) {
      netTimer = 0;
      socket.emit('player_update', {
        position: { x: this.pos.x, y: this.pos.y, z: this.pos.z },
        rotation: { x: this.pitch, y: this.yaw },
        weapon: this.weaponName,
        state: this.wallRunning ? 'wallrun' : this.sliding ? 'slide' : this.grounded ? 'ground' : 'air',
      });
    }
  }

  updateMovement(delta) {
    const onGround = this.grounded;
    const speed = this.sliding ? SLIDE_SPEED :
                  (keys['ShiftLeft'] || keys['ShiftRight']) && !this.sliding && !this.scoped ? PLAYER_SPEED * SPRINT_MULT :
                  this.scoped ? PLAYER_SPEED * 0.45 :
                  PLAYER_SPEED;
    this.sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && onGround && !this.sliding;

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rgt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (!this.wallRunning && !this.sliding) {
      const move = new THREE.Vector3();
      if (keys['KeyW'] || keys['ArrowUp'])    move.add(fwd);
      if (keys['KeyS'] || keys['ArrowDown'])  move.sub(fwd);
      if (keys['KeyA'] || keys['ArrowLeft'])  move.sub(rgt);
      if (keys['KeyD'] || keys['ArrowRight']) move.add(rgt);

      if (move.length() > 0) {
        move.normalize();
        if (onGround) {
          this.vel.x = move.x * speed;
          this.vel.z = move.z * speed;
        } else {
          // Air strafing
          this.vel.x += move.x * speed * delta * 6;
          this.vel.z += move.z * speed * delta * 6;
          const hspd = Math.sqrt(this.vel.x * this.vel.x + this.vel.z * this.vel.z);
          if (hspd > speed * 1.2) {
            this.vel.x = (this.vel.x / hspd) * speed * 1.2;
            this.vel.z = (this.vel.z / hspd) * speed * 1.2;
          }
        }
      } else if (onGround) {
        this.vel.x *= Math.pow(0.05, delta);
        this.vel.z *= Math.pow(0.05, delta);
      }
    }

    if (this.sliding) {
      this.vel.x *= Math.pow(1 - SLIDE_FRICTION * delta, 1);
      this.vel.z *= Math.pow(1 - SLIDE_FRICTION * delta, 1);
      this.slideTimer -= delta;
      if (this.slideTimer <= 0 || (!keys['ControlLeft'] && !keys['ControlRight'])) {
        this.sliding = false;
        this.targetCamHeight = PLAYER_HEIGHT;
      }
    }

    // Wall running
    this.updateWallRun(delta, fwd, rgt, speed);
  }

  updateWallRun(delta, fwd, rgt, speed) {
    const movingFwd = keys['KeyW'] || keys['ArrowUp'];

    if (!this.wallRunning) {
      if (!this.grounded && movingFwd && this.canWallRun && this.vel.y < 2) {
        // Check left wall
        const pRight = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        const pLeft  = pRight.clone().negate();
        const origin = this.pos.clone().add(new THREE.Vector3(0, 0.5, 0));

        const hitL = castRay(origin, pLeft, WALL_DETECT_DIST);
        const hitR = castRay(origin, pRight, WALL_DETECT_DIST);

        if (hitL && Math.abs(hitL.face.normal.y) < 0.3) {
          this.startWallRun('left', hitL);
        } else if (hitR && Math.abs(hitR.face.normal.y) < 0.3) {
          this.startWallRun('right', hitR);
        }
      }
    } else {
      this.wallRunTimer -= delta;

      // Keep checking wall still there
      const checkDir = this.wallRunSide === 'left'
        ? new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw))
        : new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      checkDir.negate();
      const origin = this.pos.clone().add(new THREE.Vector3(0, 0.5, 0));
      const still = castRay(origin, checkDir, WALL_DETECT_DIST + 0.4);

      if (!still || this.wallRunTimer <= 0 || this.grounded) {
        this.endWallRun();
      } else {
        // Move along wall
        const wDir = this.getWallRunDir();
        this.vel.x = wDir.x * WALL_RUN_SPEED;
        this.vel.z = wDir.z * WALL_RUN_SPEED;
        this.vel.y += WALL_RUN_GRAVITY * delta;
        this.vel.y = Math.max(this.vel.y, WALL_RUN_GRAVITY);
      }

      // Wall run HUD
      const fill = document.getElementById('wallrun-fill');
      fill.style.width = `${(this.wallRunTimer / WALL_RUN_MAX) * 100}%`;
    }
  }

  startWallRun(side, hit) {
    this.wallRunning = true;
    this.wallRunSide = side;
    this.wallRunTimer = WALL_RUN_MAX;

    const n = hit.face.normal.clone();
    n.transformDirection(hit.object.matrixWorld);
    this.wallNormal.copy(n);
    this.vel.y = Math.max(this.vel.y, 2);
    this.jumpCount = 0;
    document.getElementById('wallrun-bar').classList.remove('hidden');
  }

  endWallRun() {
    this.wallRunning = false;
    this.wallRunTimer = 0;
    this.camTilt = 0;
    document.getElementById('wallrun-bar').classList.add('hidden');
    // Cooldown so player can't immediately re-latch
    this.canWallRun = false;
    setTimeout(() => { this.canWallRun = true; }, 600);
  }

  getWallRunDir() {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3().crossVectors(this.wallNormal, up);
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    if (dir.dot(fwd) < 0) dir.negate();
    return dir.normalize();
  }

  wallJump() {
    const away = this.wallNormal.clone().multiplyScalar(WALL_JUMP_VEL * 0.7);
    this.vel.set(away.x, WALL_JUMP_VEL, away.z);
    this.endWallRun();
    this.canWallRun = false;
    setTimeout(() => { this.canWallRun = true; }, 800);
  }

  applyPhysics(delta) {
    if (!this.wallRunning && !this.grounded) {
      this.vel.y += GRAVITY * delta;
    }

    const newPos = this.pos.clone().addScaledVector(this.vel, delta);

    // Collision resolution
    const resolved = this.resolveCollisions(newPos, delta);
    this.pos.copy(resolved.pos);
    this.grounded = resolved.grounded;

    if (resolved.grounded) {
      if (this.vel.y < 0) this.vel.y = 0;
      this.jumpCount = 0;
      if (this.wallRunning) this.endWallRun();
      this.canWallRun = true;
    }

    // Boundary clamp
    this.pos.x = clamp(this.pos.x, -51, 51);
    this.pos.z = clamp(this.pos.z, -51, 51);
    if (this.pos.y < -10) this.respawnFall();
  }

  resolveCollisions(newPos, delta) {
    let pos = newPos.clone();
    let grounded = false;
    const height = this.sliding ? SLIDE_HEIGHT : PLAYER_HEIGHT;
    const radius = 0.4;

    // Ground check from feet
    const groundOrigin = new THREE.Vector3(pos.x, pos.y + 0.1, pos.z);
    const groundHit = castRay(groundOrigin, new THREE.Vector3(0, -1, 0), height + 0.25);
    if (groundHit) {
      pos.y = groundHit.point.y + height;
      grounded = true;
    }

    // Horizontal collisions
    const dirs = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    const midY = pos.y - height * 0.5;
    dirs.forEach(dir => {
      const orig = new THREE.Vector3(pos.x, midY, pos.z);
      const hit = castRay(orig, dir, radius + 0.05);
      if (hit) {
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const push = (radius + 0.05 - hit.distance) * Math.abs(normal.x + normal.z);
        pos.x += normal.x * push;
        pos.z += normal.z * push;
        // Cancel velocity into wall
        if (normal.dot(this.vel.clone().normalize()) < 0) {
          const proj = this.vel.dot(normal);
          this.vel.x -= normal.x * proj;
          this.vel.z -= normal.z * proj;
        }
      }
    });

    // Head check
    const headOrig = new THREE.Vector3(pos.x, pos.y - height + 0.1, pos.z);
    const headHit = castRay(headOrig, new THREE.Vector3(0, 1, 0), height - 0.1);
    if (headHit) {
      pos.y = headHit.point.y - 0.05;
      if (this.vel.y > 0) this.vel.y = 0;
    }

    return { pos, grounded };
  }

  updateCamera() {
    const height = this.sliding ? lerp(this.camHeight, SLIDE_HEIGHT, 0.3) : lerp(this.camHeight, PLAYER_HEIGHT, 0.3);
    this.camHeight = height;

    yawObj.position.copy(this.pos);
    yawObj.position.y = this.pos.y;
    yawObj.rotation.y = this.yaw;
    camera.rotation.x = this.pitch + this.recoilPitch;

    // Wall run tilt
    if (this.wallRunning) {
      const targetTilt = this.wallRunSide === 'left' ? -0.22 : 0.22;
      this.camTilt = lerp(this.camTilt, targetTilt, 0.15);
    } else {
      this.camTilt = lerp(this.camTilt, 0, 0.1);
    }
    camera.rotation.z = this.camTilt;

    // ADS / scope FOV
    const targetFOV = this.scoped ? (this.wep.scopeFOV || 50) : 80;
    this.currentFOV = lerp(this.currentFOV, targetFOV, 0.18);
    camera.fov = this.currentFOV;
    camera.updateProjectionMatrix();

    // Sniper scope overlay
    const isSniper = this.wep.isSniper;
    if (this.scopeOverlay) {
      const showOverlay = isSniper && this.scoped;
      this.scopeOverlay.classList.toggle('hidden', !showOverlay);
      gunGroup.visible = !showOverlay;
    }
  }

  updateGunBob(delta) {
    if (!gunGroup) return;
    const moving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
    if (moving && this.grounded) {
      gunBobTime += delta * (this.sprinting ? 14 : 9);
    } else {
      gunBobTime *= 0.9;
    }
    const bobX = Math.sin(gunBobTime) * 0.008;
    const bobY = Math.abs(Math.sin(gunBobTime)) * 0.006;
    gunGroup.position.set(0.22 + bobX, -0.18 - bobY, -0.45);
  }

  respawnFall() {
    // Fell out of map
    const sp = SPAWNS[Math.floor(Math.random() * SPAWNS.length)];
    this.pos.set(sp[0], sp[1], sp[2]);
    this.vel.set(0, 0, 0);
  }

  takeDamage(dmg, shooterId) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - dmg);
    this.updateHUD();
    flashDamage();
    if (this.health <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.health = 0;
    document.getElementById('death-overlay').classList.remove('hidden');
    let countdown = Math.ceil(RESPAWN_DELAY);
    document.getElementById('resp-count').textContent = countdown;
    const iv = setInterval(() => {
      countdown--;
      if (document.getElementById('resp-count')) {
        document.getElementById('resp-count').textContent = Math.max(0, countdown);
      }
      if (countdown <= 0) clearInterval(iv);
    }, 1000);
  }

  respawn(pos) {
    this.alive = true;
    this.health = 100;
    this.pos.set(pos.x, pos.y, pos.z);
    this.vel.set(0, 0, 0);
    this.reloading = false;
    this.reloadTimer = 0;
    document.getElementById('death-overlay').classList.add('hidden');
    document.getElementById('reload-bar').classList.add('hidden');
    this.updateHUD();
  }

  updateHUD() {
    document.getElementById('hb-bar').style.width = `${this.health}%`;
    document.getElementById('hb-val').textContent = this.health;
    document.getElementById('a-cur').textContent = this.ammo[this.weaponName];
    document.getElementById('a-res').textContent = this.ammoReserve[this.weaponName];
    document.getElementById('weapon-label').textContent = this.weaponName;
    document.getElementById('low-health-vignette').style.opacity = this.health < 30 ? (30 - this.health) / 30 : 0;
  }

  onMouseMove(dx, dy) {
    const sens = 0.0018;
    this.yaw   -= dx * sens;
    this.pitch  = clamp(this.pitch - dy * sens, -Math.PI * 0.46, Math.PI * 0.46);
    this.pitch += this.recoilPitch * 0.1;
  }

  onJump() {
    if (this.wallRunning) {
      this.wallJump();
      return;
    }
    if (this.sliding) {
      this.sliding = false;
      this.targetCamHeight = PLAYER_HEIGHT;
      this.vel.y = JUMP_VEL * 0.8;
      return;
    }
    if (this.grounded || this.jumpCount < 2) {
      this.vel.y = JUMP_VEL;
      this.jumpCount++;
      this.grounded = false;
    }
  }

  onSlide() {
    if (!this.grounded || this.sliding) return;
    this.sliding = true;
    this.slideTimer = 1.2;
    this.targetCamHeight = SLIDE_HEIGHT;
    // Boost in current direction
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.vel.x = fwd.x * SLIDE_SPEED;
    this.vel.z = fwd.z * SLIDE_SPEED;
  }
}

// ===== REMOTE PLAYERS =====
class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.alive = data.isAlive !== false;

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.0, 4, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: data.color || 0xff4400 });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.castShadow = true;

    // Separate hitbox (invisible) for easier raycasting
    const hitGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitbox = new THREE.Mesh(hitGeo, hitMat);
    this.hitbox.userData.playerId = data.id;

    // Headbox (invisible)
    const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    this.headbox = new THREE.Mesh(headGeo, hitMat);
    this.headbox.userData.playerId = data.id;
    this.headbox.userData.isHead = true;

    // Name tag sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(data.username, 128, 42);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    this.nameTag = new THREE.Sprite(spriteMat);
    this.nameTag.scale.set(2, 0.5, 1);
    this.nameTag.position.y = 1.5;

    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.hitbox);
    this.group.add(this.headbox);
    this.group.add(this.nameTag);
    scene.add(this.group);

    this.targetPos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
    this.group.position.copy(this.targetPos);
    this.headbox.position.y = 1.0;
    this.hitbox.position.y = 0;
  }

  update(data) {
    this.targetPos.set(data.position.x, data.position.y, data.position.z);
    if (data.rotation) {
      this.group.rotation.y = data.rotation.y;
    }
    this.alive = data.state !== 'dead';
    this.mesh.visible = this.alive;
    this.nameTag.visible = this.alive;
  }

  interpolate(delta) {
    this.group.position.lerp(this.targetPos, delta * 20);
  }

  remove() {
    scene.remove(this.group);
  }
}

// ===== EFFECTS =====
const bulletTrails = [];
const impactParticles = [];

function spawnBulletTrail(from, to) {
  // Use a thin tube so the trail is actually visible
  const dir = to.clone().sub(from);
  const len = dir.length();
  const mid = from.clone().add(to).multiplyScalar(0.5);

  const geo = new THREE.CylinderGeometry(0.012, 0.012, len, 4, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffee88,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(mid);
  // Orient cylinder along the direction
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  scene.add(mesh);
  bulletTrails.push({ line: mesh, life: 0.07 });
}

function spawnImpactParticle(pos) {
  const geo = new THREE.SphereGeometry(0.06, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);
  impactParticles.push({ mesh, life: 0.12, vel: new THREE.Vector3((Math.random()-0.5)*3, Math.random()*2, (Math.random()-0.5)*3) });
}

function updateEffects(delta) {
  for (let i = bulletTrails.length - 1; i >= 0; i--) {
    const t = bulletTrails[i];
    t.life -= delta;
    t.line.material.opacity = Math.max(0, t.life / 0.07) * 0.85;
    if (t.life <= 0) {
      scene.remove(t.line);
      t.line.geometry.dispose();
      t.line.material.dispose();
      bulletTrails.splice(i, 1);
    }
  }
  for (let i = impactParticles.length - 1; i >= 0; i--) {
    const p = impactParticles[i];
    p.life -= delta;
    p.mesh.position.addScaledVector(p.vel, delta);
    p.vel.y -= 8 * delta;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      impactParticles.splice(i, 1);
    }
  }
}

let hitMarkerTimeout = null;
function showHitMarker(isHead) {
  const hm = document.getElementById('hitmarker');
  hm.classList.remove('hidden');
  document.querySelectorAll('.hm').forEach(el => {
    el.style.background = isHead ? '#ff0000' : '#ffffff';
  });
  clearTimeout(hitMarkerTimeout);
  hitMarkerTimeout = setTimeout(() => hm.classList.add('hidden'), 120);
}

function flashDamage() {
  const df = document.getElementById('damage-flash');
  df.classList.add('flash');
  setTimeout(() => df.classList.remove('flash'), 80);
}

// ===== KILL FEED =====
const killFeedEntries = [];
function showInviteBanner(code, link) {
  const el = document.getElementById('invite-banner');
  if (!el) return;
  document.getElementById('invite-code-text').textContent = code;
  document.getElementById('invite-link-text').textContent = link;
  el.classList.remove('hidden');
}

function addKillFeed(killerName, victimName, isMine) {
  const kf = document.getElementById('killfeed');
  const el = document.createElement('div');
  el.className = 'kf-entry' + (isMine ? ' mine' : '');
  el.textContent = `${killerName} > ${victimName}`;
  kf.appendChild(el);
  killFeedEntries.push(el);
  setTimeout(() => {
    el.remove();
    const idx = killFeedEntries.indexOf(el);
    if (idx > -1) killFeedEntries.splice(idx, 1);
  }, 4000);
  while (kf.children.length > 6) kf.removeChild(kf.firstChild);
}

// ===== SCOREBOARD =====
function updateScoreboard(data) {
  scores = {};
  data.forEach(p => { scores[p.id] = p; });
  refreshScoreUI();
}

function refreshScoreUI() {
  const list = document.getElementById('score-list');
  list.innerHTML = '';
  Object.values(scores).sort((a, b) => b.kills - a.kills).forEach(p => {
    const div = document.createElement('div');
    div.className = 'sl-entry' + (p.id === myId ? ' me' : '');
    div.innerHTML = `${p.username} <span class="sl-kills">${p.kills}</span>/${p.deaths}`;
    list.appendChild(div);
  });

  // Full scoreboard
  const rows = document.getElementById('sb-rows');
  rows.innerHTML = '';
  Object.values(scores).sort((a, b) => b.kills - a.kills).forEach(p => {
    const kd = p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2);
    const row = document.createElement('div');
    row.className = 'sb-row' + (p.id === myId ? ' me' : '');
    row.innerHTML = `<span>${p.username}</span><span>${p.kills}</span><span>${p.deaths}</span><span>${kd}</span>`;
    rows.appendChild(row);
  });
}

// ===== CHAT =====
function addChatMessage(username, message) {
  const msgs = document.getElementById('chat-msgs');
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = `<span class="cm-name">${username}</span>${message}`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  document.getElementById('chat-wrap').classList.remove('hidden');
  setTimeout(() => {
    el.remove();
    if (msgs.children.length === 0 && !chatOpen) {
      document.getElementById('chat-wrap').classList.add('hidden');
    }
  }, 8000);
}

// ===== POINTER LOCK =====
function requestLock() {
  document.getElementById('gameCanvas').requestPointerLock();
}

document.addEventListener('pointerlockchange', () => {
  pointerLocked = !!document.pointerLockElement;
  document.getElementById('lock-overlay').classList.toggle('hidden', pointerLocked);
});

// ===== INPUT EVENTS =====
document.addEventListener('keydown', (e) => {
  if (chatOpen) return;
  keys[e.code] = true;

  if (!pointerLocked) return;

  if (e.code === 'Space') { e.preventDefault(); localPlayer?.onJump(); }
  if (e.code === 'ControlLeft' || e.code === 'ControlRight') localPlayer?.onSlide();
  if (e.code === 'KeyR') localPlayer?.startReload();
  if (e.code === 'Digit1') localPlayer?.switchWeapon(0);
  if (e.code === 'Digit2') localPlayer?.switchWeapon(1);
  if (e.code === 'Digit3') localPlayer?.switchWeapon(2);
  if (e.code === 'Digit4') localPlayer?.switchWeapon(3);
  if (e.code === 'Digit5') localPlayer?.switchWeapon(4);
  if (e.code === 'KeyE' && localPlayer) localPlayer.scoped = !localPlayer.scoped;
  if (e.code === 'Tab') { e.preventDefault(); document.getElementById('scoreboard').classList.remove('hidden'); }

  if (e.code === 'KeyT') {
    e.preventDefault();
    chatOpen = true;
    const input = document.getElementById('chat-input');
    document.getElementById('chat-wrap').classList.remove('hidden');
    input.style.display = 'block';
    input.focus();
    document.exitPointerLock();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Tab') document.getElementById('scoreboard').classList.add('hidden');
});

document.addEventListener('mousemove', (e) => {
  if (!pointerLocked || chatOpen) return;
  localPlayer?.onMouseMove(e.movementX, e.movementY);
});

document.addEventListener('mousedown', (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) mouse.left = true;
  if (e.button === 2) {
    mouse.right = true;
    if (localPlayer) localPlayer.scoped = true;
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouse.left = false;
  if (e.button === 2) {
    mouse.right = false;
    if (localPlayer) localPlayer.scoped = false;
  }
});

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('wheel', (e) => {
  if (!pointerLocked || !localPlayer) return;
  const dir = e.deltaY > 0 ? 1 : -1;
  localPlayer.switchWeapon(localPlayer.weaponIndex + dir);
});

// Chat submit
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    const val = e.target.value.trim();
    if (val) socket.emit('chat_message', { message: val });
    e.target.value = '';
    chatOpen = false;
    e.target.blur();
    document.getElementById('chat-input').style.display = 'none';
    requestLock();
  }
  if (e.code === 'Escape') {
    chatOpen = false;
    e.target.value = '';
    e.target.blur();
    document.getElementById('chat-input').style.display = 'none';
    requestLock();
  }
});

// Click anywhere to grab pointer lock
document.getElementById('gameCanvas').addEventListener('click', requestLock);
document.getElementById('lock-overlay').addEventListener('click', requestLock);

// ===== GAME LOOP =====
let lastTime = 0;
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  if (!gameActive) return;

  const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (localPlayer) localPlayer.update(delta);

  Object.values(remotePlayers).forEach(rp => rp.interpolate(delta));
  updateEffects(delta);

  renderer.render(scene, camera);
}

// ===== SOCKET =====
function connectSocket(cb) {
  socket = io();

  socket.on('player_joined', (data) => {
    if (remotePlayers[data.id]) return;
    remotePlayers[data.id] = new RemotePlayer(data);
    scores[data.id] = { id: data.id, username: data.username, kills: 0, deaths: 0 };
    refreshScoreUI();
    addChatMessage('System', `${data.username} joined the match`);
  });

  socket.on('player_left', (data) => {
    if (remotePlayers[data.id]) {
      remotePlayers[data.id].remove();
      delete remotePlayers[data.id];
    }
    if (scores[data.id]) {
      addChatMessage('System', `${scores[data.id].username} left`);
      delete scores[data.id];
    }
    refreshScoreUI();
  });

  socket.on('player_update', (data) => {
    if (remotePlayers[data.id]) remotePlayers[data.id].update(data);
  });

  socket.on('player_shoot', (data) => {
    if (!data.id || data.id === myId) return;
    const o = new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z);
    const d = new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z);
    spawnBulletTrail(o, d.clone().multiplyScalar(60).add(o));
  });

  socket.on('hit_confirmed', () => {});

  socket.on('take_damage', (data) => {
    localPlayer?.takeDamage(data.damage, data.shooterId);
  });

  socket.on('you_died', (data) => {
    localPlayer?.die();
    document.getElementById('death-by').textContent = `Eliminated by ${data.killerName}`;
  });

  socket.on('respawn', (data) => {
    localPlayer?.respawn(data.position);
  });

  socket.on('player_killed', (data) => {
    addKillFeed(data.killerName, data.victimName, data.killerId === myId);
    if (remotePlayers[data.victimId]) {
      remotePlayers[data.victimId].mesh.visible = false;
      remotePlayers[data.victimId].nameTag.visible = false;
    }
  });

  socket.on('score_update', (data) => {
    updateScoreboard(data);
  });

  socket.on('chat_message', (data) => {
    addChatMessage(data.username, data.message);
  });

  // Wait for actual connection before firing callback
  if (socket.connected) {
    cb();
  } else {
    socket.once('connect', cb);
    socket.once('connect_error', () => {
      alert('Could not connect to server. Check the URL and try again.');
    });
  }
}

// ===== START GAME =====
function startGame() {
  gameActive = true;
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('weapon-wheel').classList.remove('hidden');
  lastTime = performance.now();
}

function enterGame(playerData, existingPlayers, code) {
  myId = playerData.id;
  roomCode = code;
  myUsername = playerData.username;

  document.getElementById('menu').classList.add('hidden');
  document.getElementById('join-screen').classList.add('hidden');
  document.getElementById('gameCanvas').style.display = 'block';
  document.getElementById('room-code-label').textContent = `ROOM: ${code}`;
  document.getElementById('lock-overlay').classList.remove('hidden');

  initScene();
  // Start game immediately - don't wait for pointer lock
  startGame();
  requestAnimationFrame(gameLoop);

  localPlayer = new LocalPlayer(playerData.position);

  existingPlayers.forEach(p => {
    remotePlayers[p.id] = new RemotePlayer(p);
    scores[p.id] = { id: p.id, username: p.username, kills: p.kills, deaths: p.deaths };
  });
  scores[myId] = { id: myId, username: playerData.username, kills: 0, deaths: 0 };
  refreshScoreUI();
}

// ===== MENU LOGIC =====
document.getElementById('btn-create').addEventListener('click', () => {
  const username = document.getElementById('username-input').value.trim() || 'Operator';
  connectSocket(() => {
    socket.emit('create_room', { username }, (res) => {
      if (res.success) {
        enterGame(res.player, res.players, res.code);
        // Show invite link after entering game
        setTimeout(() => {
          const link = `${location.origin}?join=${res.code}`;
          addChatMessage('System', `Room code: ${res.code}`);
          addChatMessage('System', `Invite link copied to clipboard! Send to friend.`);
          navigator.clipboard?.writeText(link);
          // Also show a visible banner
          showInviteBanner(res.code, link);
        }, 600);
      }
    });
  });
});

document.getElementById('btn-join-open').addEventListener('click', () => {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('join-screen').classList.remove('hidden');
  document.getElementById('room-code-input').focus();
});

document.getElementById('btn-back').addEventListener('click', () => {
  document.getElementById('join-screen').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
});

document.getElementById('btn-join-confirm').addEventListener('click', () => {
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  const usernameA = document.getElementById('username-input').value.trim();
  const usernameB = document.getElementById('join-username-input')?.value.trim();
  const username = usernameA || usernameB || 'Operator';
  if (!code) { alert('Enter a room code first.'); return; }

  const btn = document.getElementById('btn-join-confirm');
  btn.textContent = 'CONNECTING...';
  btn.disabled = true;

  connectSocket(() => {
    socket.emit('join_room', { code, username }, (res) => {
      btn.textContent = 'JOIN';
      btn.disabled = false;
      if (res.success) {
        enterGame(res.player, res.players, res.code);
      } else {
        alert('Room not found. Check the code and try again.');
      }
    });
  });
});

document.getElementById('room-code-input').addEventListener('keydown', (e) => {
  if (e.code === 'Enter') document.getElementById('btn-join-confirm').click();
});
document.getElementById('username-input').addEventListener('keydown', (e) => {
  if (e.code === 'Enter') document.getElementById('btn-create').click();
});

// Auto-fill room code from URL ?join=CODE
(function() {
  const params = new URLSearchParams(location.search);
  const joinCode = params.get('join');
  if (joinCode) {
    document.getElementById('room-code-input').value = joinCode.toUpperCase();
    // Switch straight to join screen
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('join-screen').classList.remove('hidden');
    document.getElementById('join-username-input').focus();
  }
})();
