import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
function random(seed = 91) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const palettes = {
  cosmos: [0xd8b476, 0x10151e], creation: [0xd9f1df, 0x112026], eden: [0xb6d6a2, 0x0c1c1c],
  fracture: [0xcc7055, 0x210e10], ark: [0x8cafc3, 0x0a1421], sea: [0x7ab6c4, 0x081f28],
  ruins: [0xc99a71, 0x1f1012], cross: [0xdd9b6e, 0x230e12], tomb: [0x8295b3, 0x10131f],
  resurrection: [0xffe4aa, 0x212021], fire: [0xffb76c, 0x25170f], judgment: [0xdce5f2, 0x151c2b],
  city: [0xffe8b9, 0x232126], home: [0xe8d2a5, 0x142125], healing: [0xc7dbbb, 0x102222],
};

export class FilmWorld {
  constructor(canvas, onFailure) {
    this.canvas = canvas;
    this.reduced = false;
    this.key = '';
    this.animators = [];
    this.rng = random();
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.65));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x05080d);
      this.scene.fog = new THREE.FogExp2(0x05080d, 0.025);
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      this.camera.position.set(0, 1.3, 12);
      this.ambient = new THREE.HemisphereLight(0xffe3b9, 0x101520, 1.3);
      this.keylight = new THREE.DirectionalLight(0xffdbaa, 3.5);
      this.keylight.position.set(-3, 5, 4);
      this.rimlight = new THREE.PointLight(0x98b3d5, 75, 35, 2);
      this.rimlight.position.set(5, 2, -2);
      this.scene.add(this.ambient, this.keylight, this.rimlight);
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.8, 0.6);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
      this.createStars();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.failed = true; onFailure(); });
    } catch (error) { this.failed = true; onFailure(error); }
  }
  resize() {
    if (this.failed) return;
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  createStars() {
    const points = [], sizes = [];
    for (let i = 0; i < 2700; i++) {
      points.push((this.rng() - .5) * 65, (this.rng() - .5) * 42, -this.rng() * 40 - 6);
      sizes.push(.015 + this.rng() * .035);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xccc6b7, size: .045, transparent: true, opacity: .5, sizeAttenuation: true, depthWrite: false }));
    this.scene.add(this.stars);
  }
  material(color, glow = 0, metal = .65) {
    return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: .38, emissive: color, emissiveIntensity: glow });
  }
  mesh(geometry, mat, x = 0, y = 0, z = 0, group = this.root) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z); group.add(mesh); return mesh;
  }
  box(w, h, d, x, y, z, mat = this.gold, group = this.root) {
    return this.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, group);
  }
  line(points, color = this.color, opacity = .4, group = this.root) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    group.add(line); return line;
  }
  halo(radius = 2.4, z = -.9, opacity = .75) {
    const ring = this.mesh(new THREE.TorusGeometry(radius, .008, 6, 220), new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity }), 0, .2, z);
    return ring;
  }
  motes(count = 650, radius = 3.5, type = 'sphere') {
    const pos = [], colors = [];
    const color = new THREE.Color(this.color);
    for (let i = 0; i < count; i++) {
      const theta = this.rng() * TAU, r = Math.sqrt(this.rng()) * radius;
      if (type === 'spiral') {
        const a = i / count * TAU * 5, rr = .6 + i / count * radius;
        pos.push(Math.cos(a) * rr, (this.rng() - .5) * .22, Math.sin(a) * rr);
      } else pos.push(Math.cos(theta) * r, (this.rng() - .5) * radius * 1.8, Math.sin(theta) * r);
      const c = color.clone().multiplyScalar(.45 + this.rng()); colors.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size: .025, vertexColors: true, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.root.add(p);
    this.animators.push(t => { p.rotation.y = t * .025; p.position.y = Math.sin(t * .2) * .09; });
    return p;
  }
  ground(color = 0x10131a) {
    const g = this.mesh(new THREE.CircleGeometry(5.5, 100), this.material(color, .02, .3), 0, -1.65, 0);
    g.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const ring = this.halo(1.4 + i * .85, 0, .12); ring.rotation.x = -Math.PI / 2; ring.position.y = -1.63;
    }
  }
  beams(count = 11, wide = false) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU;
      const pts = [new THREE.Vector3(Math.cos(a) * .2, .2, -1), new THREE.Vector3(Math.cos(a) * (wide ? 8 : 4), Math.sin(a) * 5 + .2, -2)];
      this.line(pts, this.color, .05 + this.rng() * .1);
    }
  }
  planet() {
    const material = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(this.color) }, time: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vP; void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 color;uniform float time;varying vec3 vN;varying vec3 vP;void main(){vec3 n=normalize(vN);float rim=pow(1.-max(0.,dot(n,normalize(-vP))),3.8);float light=max(0.,dot(n,normalize(vec3(-.7,.4,.4))));float bands=sin(n.y*90.+sin(n.x*24.)*4.)*.5+.5;vec3 c=vec3(.018,.024,.032)+color*(rim*1.6+pow(light,5.)*.27*(.7+bands*.3));gl_FragColor=vec4(c,1.);}`,
    });
    const sphere = this.mesh(new THREE.SphereGeometry(1.73, 100, 70), material, 0, .1, 0);
    const ring = this.halo(2.6, 0, .6); ring.rotation.set(1.05, .35, -.3);
    const r2 = this.halo(2.68, 0, .22); r2.rotation.copy(ring.rotation);
    this.halo(1.77, -.05, .85);
    const dust = this.motes(1800, 3, 'spiral'); dust.rotation.z = -.28;
    this.animators.push(t => { sphere.rotation.y = t * .035; ring.rotation.z = -.3 + t * .013; dust.rotation.y = t * .035; });
  }
  tree() {
    this.ground(0x11201b);
    const group = new THREE.Group(); this.root.add(group);
    const leaves = [];
    const branch = (start, dir, length, width, depth) => {
      const end = start.clone().add(dir.clone().multiplyScalar(length));
      const center = start.clone().lerp(end, .5).add(new THREE.Vector3(.1 * this.rng(), 0, .1));
      const curve = new THREE.CatmullRomCurve3([start, center, end]);
      this.mesh(new THREE.TubeGeometry(curve, 8, width, 6, false), this.gold, 0, 0, 0, group);
      if (depth > 0) for (let j = 0; j < 3; j++) {
        const d = new THREE.Vector3((this.rng() - .5) * 1.8, .5 + this.rng() * .5, (this.rng() - .5) * 1.5).normalize();
        branch(end, d, length * .66, width * .56, depth - 1);
      } else for (let j = 0; j < 19; j++) leaves.push(end.x + (this.rng() - .5) * .65, end.y + (this.rng() - .5) * .4, end.z + (this.rng() - .5) * .65);
    };
    branch(new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(.08, 1, 0), 1.25, .12, 4);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(leaves, 3));
    group.add(new THREE.Points(g, new THREE.PointsMaterial({ color: this.color, size: .043, transparent: true, opacity: .9, blending: THREE.AdditiveBlending })));
    this.halo(2.45, -1.4, .25); this.motes(350);
    this.animators.push(t => { group.rotation.y = Math.sin(t * .1) * .12; });
  }
  fracture() {
    for (let i = 0; i < 110; i++) {
      const a = this.rng() * TAU, b = Math.acos(this.rng() * 2 - 1), r = 1.5 + this.rng() * .7;
      const mesh = this.mesh(new THREE.TetrahedronGeometry(.07 + this.rng() * .35), i % 7 === 0 ? this.glow : this.stone, Math.cos(a) * Math.sin(b) * r, Math.cos(b) * r, Math.sin(a) * Math.sin(b) * r);
      mesh.rotation.set(this.rng() * 4, this.rng() * 4, 0);
      const p = mesh.position.clone();
      this.animators.push((t, progress) => { mesh.position.copy(p).multiplyScalar(1 + progress * .65); mesh.rotation.x = t * .03 + a; });
    }
    this.halo(2.9, -1.5, .2); this.motes(750, 4);
    this.line([new THREE.Vector3(-.1, -3, 0), new THREE.Vector3(.08, -.2, 0), new THREE.Vector3(-.05, 2.7, 0)], 0xffc9a1, .9);
  }
  water(split = false) {
    const geo = new THREE.PlaneGeometry(13, 12, 90, 75);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const base = new Float32Array(pos.array);
    const water = this.mesh(geo, this.material(0x164152, .08, .55), 0, -1.7, 0);
    this.animators.push(t => {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        let y = Math.sin(x * 2 + t * .6) * .11 + Math.cos(z * 2.2 + t * .42) * .13;
        if (split) y += Math.abs(x) > 1 ? 1.7 * Math.min(1, (Math.abs(x) - 1) * 2) : -.2;
        pos.setY(i, y);
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
    });
    if (split) {
      this.box(1.8, .12, 12, 0, -1.6, 0, this.material(0x88745a, .05, .1));
      this.box(.025, .03, 12, 0, -1.52, 0, this.glow);
    }
    return water;
  }
  ark() {
    this.water();
    const ship = new THREE.Group(); this.root.add(ship); ship.position.y = -.8;
    const shape = new THREE.Shape(); shape.moveTo(-1.75, .25); shape.quadraticCurveTo(-1.5, -.55, 0, -.65); shape.quadraticCurveTo(1.5, -.55, 1.75, .25); shape.lineTo(-1.75, .25);
    this.mesh(new THREE.ExtrudeGeometry(shape, { depth: .8, bevelEnabled: true, bevelSize: .05, bevelThickness: .06, bevelSegments: 2, steps: 1 }), this.gold, 0, 0, -.4, ship);
    this.box(2.5, .55, .9, 0, .5, 0, this.wood, ship);
    this.box(2.8, .13, 1.05, 0, .82, 0, this.gold, ship);
    for (let j = -4; j <= 4; j++) this.box(.12, .14, .93, j * .24, .59, 0, this.glow, ship);
    this.animators.push(t => { ship.rotation.z = Math.sin(t * .45) * .05; ship.position.y = -.75 + Math.sin(t * .5) * .06; });
    this.halo(2.8, -2, .27);
  }
  tower(ruined = false) {
    this.ground();
    if (!ruined) for (let j = 0; j < 9; j++) {
      const r = 1.8 - j * .15;
      this.mesh(new THREE.CylinderGeometry(r - .05, r, .32, 4), this.stone, 0, -1.4 + j * .35, 0).rotation.y = Math.PI / 4 + j * .045;
      const edge = this.mesh(new THREE.TorusGeometry(r * .82, .012, 4, 4), this.glow, 0, -1.23 + j * .35, 0); edge.rotation.x = Math.PI / 2;
    } else {
      for (let i = 0; i < 25; i++) {
        const h = .2 + this.rng() * 1.9;
        const b = this.box(.35, h, .4, (this.rng() - .5) * 4, h / 2 - 1.6, (this.rng() - .5) * 3, this.stone);
        b.rotation.z = (this.rng() - .5) * .4;
      }
    }
    this.motes(380, 3.3);
  }
  covenant(ladder = false) {
    this.halo(2.35, -.7, .65); this.halo(2.45, -.9, .18);
    const positions = [];
    for (let i = 0; i < 650; i++) {
      const a = this.rng() * TAU, r = Math.sqrt(this.rng()) * 2.1;
      positions.push(Math.cos(a) * r, Math.sin(a) * r + .2, (this.rng() - .5) * 1.5);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.root.add(new THREE.Points(g, new THREE.PointsMaterial({ color: this.color, size: .037, blending: THREE.AdditiveBlending })));
    if (ladder) for (let j = 0; j < 22; j++) this.box(1.1, .05, .27, 0, j * .17 - 1.6, -j * .08, this.gold);
    else {
      const pts = [new THREE.Vector3(-1.2, -.4, .4), new THREE.Vector3(-.4, 1.2, .1), new THREE.Vector3(.8, .8, .3), new THREE.Vector3(1.4, -.65, .1)];
      this.line(pts, this.color, .7);
      pts.forEach(p => this.mesh(new THREE.SphereGeometry(.045, 12, 12), this.glow, p.x, p.y, p.z));
    }
    this.motes(150, 4);
  }
  altar() {
    this.ground();
    for (let i = 0; i < 12; i++) this.mesh(new THREE.DodecahedronGeometry(.37, 0), this.stone, (i % 4 - 1.5) * .55, -.8 + Math.floor(i / 4) * .32, (this.rng() - .5) * .5);
    for (let i = 0; i < 4; i++) this.box(1.9, .09, .09, 0, .25 + i * .1, (i % 2 - .5) * .4, this.wood).rotation.y = i;
    this.halo(2.3, -1, .3); this.motes(300, 2.3);
  }
  chains() {
    for (let i = 0; i < 11; i++) {
      const t = i - 5, x = t * .38;
      const link = this.mesh(new THREE.TorusGeometry(.34, .062, 8, 30), i === 5 ? this.glow : this.gold, x, -.3 + Math.abs(t) * .07, 0);
      link.rotation.y = i % 2 * Math.PI / 2;
      this.animators.push((_, progress) => { link.position.x = x + Math.sign(t) * progress * .7; link.position.y = -.3 + Math.abs(t) * .07 - progress * .3; });
    }
    this.halo(2.4, -1, .4); this.motes(450);
  }
  tablets() {
    this.ground();
    for (const x of [-.69, .69]) {
      const s = new THREE.Shape(); s.moveTo(-.56, -1); s.lineTo(.56, -1); s.lineTo(.56, .75); s.absarc(0, .75, .56, 0, Math.PI, false); s.lineTo(-.56, -1);
      this.mesh(new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: true, bevelSize: .045, bevelThickness: .045, bevelSegments: 2 }), this.stone, x, 0, 0);
      for (let i = 0; i < 5; i++) this.box(.58 - (i % 2) * .13, .018, .01, x, .66 - i * .31, .26, this.glow);
    }
    this.beams(); this.motes(360);
  }
  mountains(desert = false) {
    this.ground(desert ? 0x3a2a20 : 0x17242a);
    for (let i = 0; i < 13; i++) {
      const h = 1 + this.rng() * 1.8, r = .6 + this.rng() * 1.2;
      this.mesh(new THREE.ConeGeometry(r, h, desert ? 38 : 5), this.stone, (this.rng() - .5) * 6, h / 2 - 1.7, this.rng() * -4).rotation.y = this.rng();
    }
    if (desert) {
      const pillar = this.mesh(new THREE.CylinderGeometry(.06, .2, 3.2, 20, 1, true), this.glow, 0, .4, .7);
      this.animators.push(t => { pillar.scale.x = .7 + Math.sin(t * .9) * .1; });
    } else this.halo(1.3, -4, .9).position.y = 1.2;
    this.motes(400, 4);
  }
  harvest() {
    this.ground(0x30281d);
    for (let i = 0; i < 95; i++) {
      const x = (this.rng() - .5) * 4, z = (this.rng() - .5) * 3, h = .6 + this.rng() * 1.2;
      this.line([new THREE.Vector3(x, -1.6, z), new THREE.Vector3(x + .1, -1.6 + h, z)], this.color, .5);
      const grain = this.mesh(new THREE.SphereGeometry(.055, 5, 5), this.gold, x + .1, -1.6 + h, z); grain.scale.y = 3;
    }
    this.halo(1.6, -2.5, .65).position.y = .7;
  }
  crown() {
    const ring = this.mesh(new THREE.TorusGeometry(1.3, .095, 12, 100), this.gold, 0, -.65, 0); ring.rotation.x = Math.PI / 2;
    const band = this.mesh(new THREE.CylinderGeometry(1.32, 1.32, .45, 70, 1, true), this.gold, 0, -.43, 0);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const cone = this.mesh(new THREE.ConeGeometry(.22, i % 3 === 0 ? 1.3 : .8, 4), this.gold, Math.sin(a) * 1.3, .18, Math.cos(a) * 1.3);
      cone.rotation.y = a;
      this.mesh(new THREE.OctahedronGeometry(.085), this.glow, Math.sin(a) * 1.31, -.36, Math.cos(a) * 1.31);
    }
    this.halo(2.5, -1.2, .6); this.motes(700);
    this.animators.push(t => { band.rotation.y = t * .08; });
  }
  scroll() {
    const paper = this.material(0xcbb68e, .12, .05);
    const mesh = this.mesh(new THREE.PlaneGeometry(2.9, 2, 35, 10), paper, 0, .1, 0); mesh.material.side = THREE.DoubleSide;
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 1.1) * .22);
    mesh.geometry.computeVertexNormals();
    for (const x of [-1.48, 1.48]) this.mesh(new THREE.CylinderGeometry(.12, .12, 2.4, 20), this.gold, x, .1, Math.sin(x) * .22);
    for (let y = -.5; y < .9; y += .23) this.box(1.9 + this.rng() * .3, .013, .015, 0, y, .25, this.wood);
    this.motes(450); this.halo(2.45, -1, .3);
  }
  temple() {
    this.ground();
    for (let i = 0; i < 4; i++) this.box(3.5 - i * .18, .12, 2.7 - i * .18, 0, -1.6 + i * .12, 0, this.stone);
    for (const x of [-1.2, 1.2]) for (const z of [-.8, .8]) {
      this.mesh(new THREE.CylinderGeometry(.12, .17, 2.3, 16), this.gold, x, .1, z);
      this.box(.45, .13, .45, x, 1.22, z, this.gold);
    }
    this.box(3.1, .3, 2.3, 0, 1.5, 0, this.stone);
    this.box(.9, 1.6, .035, 0, -.1, -.6, this.glow);
    this.motes(420);
  }
  manger() {
    this.ground();
    this.box(1.35, .45, .78, 0, -.8, 0, this.wood);
    for (const side of [-1, 1]) {
      const b = this.box(.12, 1.1, .12, side * .45, -1.2, 0, this.gold); b.rotation.z = side * .5;
      this.box(.13, 3, .13, side * 1.6, -.1, -.7, this.wood);
      const roof = this.box(.13, 2.05, .13, side * .82, 1.85, -.7, this.gold); roof.rotation.z = side * .95;
    }
    const light = this.mesh(new THREE.SphereGeometry(.27, 32, 24), this.glow, 0, -.47, 0); light.scale.set(1.5, .3, .8);
    this.mesh(new THREE.OctahedronGeometry(.1), this.glow, 0, 3, -.6);
    this.line([new THREE.Vector3(0, 3, -.6), new THREE.Vector3(0, -.5, 0)], this.color, .18);
    this.motes(620); this.beams();
  }
  door() {
    this.ground();
    const arch = this.mesh(new THREE.TorusGeometry(1.0, .15, 12, 65, Math.PI), this.gold, 0, .55, 0);
    this.box(.3, 1.8, .3, -1, -.35, 0); this.box(.3, 1.8, .3, 1, -.35, 0);
    this.box(1.8, 2.55, .04, 0, -.05, -.05, new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: .13 }));
    for (let i = 0; i < 6; i++) this.box(2 + i * .16, .12, .4, 0, -1.4 - i * .11, .3 + i * .4, this.stone);
    this.beams(); this.motes(480);
  }
  cup() {
    const pts = [[0,-1],[.6,-1],[.56,-.91],[.14,-.81],[.1,-.4],[.12,-.25],[.45,-.05],[.65,.4],[.7,.85]].map(p => new THREE.Vector2(...p));
    this.mesh(new THREE.LatheGeometry(pts, 70), this.gold, 0, .1, 0);
    this.halo(2.3, -1.1, .27); this.motes(450);
    for (let i = 0; i < 3; i++) this.mesh(new THREE.SphereGeometry(.08, 10, 10), this.glow, -.7 + i * .7, 1.9 + i * .14, -.5);
  }
  cross() {
    const hillGeometry = new THREE.SphereGeometry(2.7, 45, 22, 0, TAU, 0, Math.PI / 2);
    const hillVertices = hillGeometry.attributes.position;
    for (let i = 0; i < hillVertices.count; i++) {
      const x = hillVertices.getX(i), z = hillVertices.getZ(i);
      hillVertices.setY(i, hillVertices.getY(i) * (1 + .07 * Math.sin(x * 4.2) * Math.cos(z * 3.7)));
    }
    hillGeometry.computeVertexNormals();
    const hill = this.mesh(hillGeometry, this.stone, 0, -2.3, 0); hill.scale.y = .42;
    this.box(.25, 3.7, .22, 0, .1, 0, this.wood);
    this.box(2.2, .25, .22, 0, 1.03, 0, this.wood);
    this.box(.016, 3.65, .016, -.135, .1, .12, this.glow);
    this.box(2.15, .012, .014, 0, 1.17, .12, this.glow);
    this.halo(2.25, -1, .22); this.beams(32, true);
    for (const x of [-2.3, 2.3]) { this.box(.09, 1.4, .1, x, -1, -1.2, this.wood); this.box(.7, .1, .1, x, -.65, -1.2, this.wood); }
    this.motes(850, 4);
  }
  tomb(open) {
    this.ground();
    const arch = this.mesh(new THREE.TorusGeometry(1.1, .5, 8, 40, Math.PI), this.stone, 0, -.1, 0);
    this.box(1, 1.25, .8, -1.1, -.75, 0, this.stone); this.box(1, 1.25, .8, 1.1, -.75, 0, this.stone);
    this.box(2, 1.8, .03, 0, -.4, -.22, open ? this.glow : this.material(0x010204, 0, 0));
    const rock = this.mesh(new THREE.CylinderGeometry(1.17, 1.17, .38, 40), this.stone, open ? 2.25 : 0, -.36, .55); rock.rotation.x = Math.PI / 2;
    this.animators.push((t, p) => { if (open) { rock.position.x = 1.8 + p * .6; rock.rotation.z = t * .012; } });
    if (open) { this.beams(42, true); this.halo(2.55, -1.5, .5); }
    this.motes(open ? 1000 : 350, 3.5);
  }
  fire() {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, r = .8 + (i % 3) * .5;
      const group = new THREE.Group(); group.position.set(Math.cos(a) * r, -.2 + (i % 3) * .1, Math.sin(a) * r); this.root.add(group);
      const flame = this.mesh(new THREE.OctahedronGeometry(.26, 1), this.glow, 0, 0, 0, group); flame.scale.y = 2.6;
      this.animators.push(t => { group.position.y = -.2 + Math.sin(t * .8 + a) * .16; flame.scale.x = .7 + Math.sin(t + a) * .12; });
    }
    this.halo(2.7, -1.4, .25); this.motes(1400, 3.2);
  }
  globe() {
    const sphere = this.mesh(new THREE.IcosahedronGeometry(1.9, 3), new THREE.MeshBasicMaterial({ color: this.color, wireframe: true, transparent: true, opacity: .15 }));
    this.mesh(new THREE.SphereGeometry(1.87, 40, 30), this.material(0x101822, .015, .1));
    for (let i = 0; i < 22; i++) {
      const phi = this.rng() * TAU, theta = this.rng() * Math.PI;
      const start = new THREE.Vector3(.3, .7, 1.75), end = new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(1.94);
      const mid = start.clone().add(end).normalize().multiplyScalar(2.8);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      this.line(curve.getPoints(40), this.color, .25);
      this.mesh(new THREE.SphereGeometry(.032, 8, 8), this.glow, end.x, end.y, end.z);
    }
    this.halo(2.6, -1, .25); this.motes(420);
  }
  throne(judgment = false) {
    for (let i = 0; i < 7; i++) this.box(3.6 - i * .3, .18, 2.6 - i * .19, 0, -1.6 + i * .18, -.4, this.stone);
    const mat = judgment ? this.material(0xe4dfd2, .45, .4) : this.gold;
    this.box(1.25, 2.5, .22, 0, .55, -.55, mat);
    this.box(1.35, .25, 1, 0, -.35, -.05, mat);
    for (const x of [-.75, .75]) this.box(.17, .75, .85, x, -.08, -.03, mat);
    this.halo(2.7, -1.3, .9); this.halo(2.82, -1.4, .3); this.beams(46, true); this.motes(850, 4);
    if (judgment) for (const x of [-2, 2]) {
      const book = this.box(.68, .08, .9, x, -.3, .6, mat); book.rotation.z = x > 0 ? -.25 : .25;
    }
  }
  city() {
    this.ground(0x2c2b29);
    const group = new THREE.Group(); this.root.add(group);
    for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
      if (x === 0) continue;
      const h = .35 + this.rng() * 1.5;
      const b = this.box(.35, h, .35, x * .55, h / 2 - 1.4, z * .45, this.material(0xc2aa7c, .22), group);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: 0xffedc5, transparent: true, opacity: .7 })); b.add(edges);
    }
    for (let side = 0; side < 4; side++) for (let j = -1; j <= 1; j++) {
      const gate = new THREE.Group(); gate.rotation.y = side * Math.PI / 2;
      const a = new THREE.Mesh(new THREE.TorusGeometry(.25, .045, 8, 24, Math.PI), this.glow); a.position.set(j * 1.4, -.6, 2); gate.add(a);
      for (const dx of [-.25, .25]) this.box(.07, .8, .07, j * 1.4 + dx, -1, 2, this.glow, gate);
      group.add(gate);
    }
    this.box(.32, .012, 5, 0, -1.37, .1, this.material(0xb9ebf0, .8, .6));
    this.mesh(new THREE.SphereGeometry(.37, 40, 30), this.glow, 0, 1.2, -.6);
    this.halo(2.8, -2, .6); this.beams(55, true); this.motes(1600, 4);
  }
  setScene(visual) {
    if (this.failed || visual === this.key) return;
    this.key = visual; this.animators = []; this.rng = random(91 + visual.length * 47);
    const geometries = new Set(), materials = new Set();
    this.root.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    this.root.clear(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    const palette = palettes[visual] || [0xd8b783, 0x171921];
    this.color = palette[0];
    this.scene.fog.color.setHex(palette[1]).multiplyScalar(.35);
    this.scene.background.copy(this.scene.fog.color);
    this.gold = this.material(this.color, .09);
    this.glow = this.material(this.color, 2.2, .2);
    this.stone = this.material(new THREE.Color(this.color).multiplyScalar(.24), .018, .25);
    this.stone.roughness = .94; this.stone.metalness = .08;
    this.wood = this.material(0x4e3022, .025, .1);
    this.keylight.color.setHex(this.color); this.rimlight.color.setHex(this.color);
    this.bloom.strength = ['resurrection', 'creation'].includes(visual) ? 1 : visual === 'city' ? .65 : .72;
    const map = {
      cosmos: () => this.planet(), creation: () => { this.planet(); this.beams(38, true); },
      eden: () => this.tree(), healing: () => this.tree(), home: () => { this.tree(); this.beams(30); },
      fracture: () => this.fracture(), ark: () => this.ark(), babel: () => this.tower(), ruins: () => this.tower(true),
      covenant: () => this.covenant(), ladder: () => this.covenant(true), altar: () => this.altar(), chains: () => this.chains(),
      sea: () => { this.water(true); this.motes(300); }, galilee: () => { this.water(); this.halo(1.4, -3, .8).position.y = .7; },
      tablets: () => this.tablets(), desert: () => this.mountains(true), mountains: () => this.mountains(), harvest: () => this.harvest(),
      crown: () => this.crown(), scroll: () => this.scroll(), prophecy: () => { this.scroll(); this.beams(); }, temple: () => this.temple(),
      manger: () => this.manger(), door: () => this.door(), cup: () => this.cup(), cross: () => this.cross(),
      tomb: () => this.tomb(false), resurrection: () => this.tomb(true), fire: () => this.fire(), globe: () => this.globe(),
      throne: () => this.throne(), judgment: () => this.throne(true), city: () => this.city(),
    };
    (map[visual] || map.cosmos)();
  }
  render(t, progress = 0, hero = false) {
    if (this.failed) return;
    const time = this.reduced ? 0 : t;
    const mobile = innerWidth < 700;
    this.root.position.set(mobile ? 0 : hero ? 2.45 : 2.1, mobile ? 1.1 : .05, 0);
    this.root.scale.setScalar(mobile ? .8 : 1);
    this.root.rotation.y = this.reduced ? -.12 : -.17 + Math.sin(time * .07) * .17;
    this.camera.position.set(Math.sin(time * .04) * .18, .45 + Math.sin(time * .09) * .12, (mobile ? 14 : 11.8) - (this.reduced ? 0 : progress * .65));
    this.camera.lookAt(0, mobile ? .1 : 0, 0);
    this.stars.rotation.z = time * .0008;
    this.animators.forEach(fn => fn(time, progress));
    this.composer.render();
  }
}
