import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { W, H } from '../lib/tl';

// ------------------------------------------------------------------ light / sky presets
export type Look = {
  top: string; hor: string; bot: string; sunAz: number; sunEl: number; sun: string; sunI: number;
  hemiSky: string; hemiGround: string; hemiI: number; env: number; fog: string; fogNear: number; fogFar: number;
  exposure: number; sunDisc?: number; stars?: number;
};
export const LOOKS: Record<string, Look> = {
  morning: { top: '#5f9be0', hor: '#ffd6a8', bot: '#c9b9a8', sunAz: 70, sunEl: 14, sun: '#ffc995', sunI: 3.2, hemiSky: '#bcd6ff', hemiGround: '#8a7a68', hemiI: 0.9, env: 0.45, fog: '#f4d2b4', fogNear: 60, fogFar: 520, exposure: 1.0, sunDisc: 1 },
  day: { top: '#3f84da', hor: '#bcd6f2', bot: '#9fb2c4', sunAz: 40, sunEl: 52, sun: '#fff1de', sunI: 3.0, hemiSky: '#cfe3ff', hemiGround: '#7d766c', hemiI: 0.85, env: 0.5, fog: '#bcd3ee', fogNear: 80, fogFar: 650, exposure: 1.0 },
  golden: { top: '#4f6fb0', hor: '#ffb877', bot: '#8a6f8a', sunAz: 20, sunEl: 9, sun: '#ffb36b', sunI: 3.4, hemiSky: '#8fa0d8', hemiGround: '#6e5560', hemiI: 0.8, env: 0.4, fog: '#e8a982', fogNear: 50, fogFar: 480, exposure: 1.0, sunDisc: 1 },
  chaos: { top: '#6f7f96', hor: '#d9b48f', bot: '#6c6560', sunAz: 30, sunEl: 30, sun: '#ffd9b0', sunI: 2.6, hemiSky: '#b9c3d6', hemiGround: '#6a5f55', hemiI: 0.8, env: 0.4, fog: '#c7ab92', fogNear: 40, fogFar: 420, exposure: 1.0 },
  dusk: { top: '#1d2a55', hor: '#e07a5f', bot: '#3b2f45', sunAz: 200, sunEl: 3, sun: '#ff8a5c', sunI: 1.7, hemiSky: '#5d6aa8', hemiGround: '#3c2c3a', hemiI: 0.75, env: 0.3, fog: '#8a5a6a', fogNear: 40, fogFar: 420, exposure: 1.05, sunDisc: 1 },
  night: { top: '#050b1f', hor: '#1d2c55', bot: '#0b0f1c', sunAz: 140, sunEl: 40, sun: '#9fb5ff', sunI: 0.5, hemiSky: '#3a4a80', hemiGround: '#141420', hemiI: 0.5, env: 0.18, fog: '#1a2445', fogNear: 40, fogFar: 520, exposure: 1.1, stars: 1 },
  overgrown: { top: '#5d93cf', hor: '#f3d6a0', bot: '#8e9a6a', sunAz: 35, sunEl: 22, sun: '#ffdba8', sunI: 3.0, hemiSky: '#c6dcff', hemiGround: '#6f7a4a', hemiI: 0.9, env: 0.45, fog: '#d9d3b0', fogNear: 50, fogFar: 450, exposure: 1.0, sunDisc: 1 },
  red: { top: '#2a0508', hor: '#a3242a', bot: '#1a0506', sunAz: 0, sunEl: 30, sun: '#ff6a5a', sunI: 1.8, hemiSky: '#ff7766', hemiGround: '#220808', hemiI: 0.6, env: 0.25, fog: '#3a0a0e', fogNear: 10, fogFar: 120, exposure: 1.0 },
  studio: { top: '#141a33', hor: '#3a2f63', bot: '#0d0f1d', sunAz: 35, sunEl: 45, sun: '#ffffff', sunI: 2.6, hemiSky: '#9fb1ff', hemiGround: '#2a2238', hemiI: 0.7, env: 0.55, fog: '#221d3d', fogNear: 30, fogFar: 200, exposure: 1.0 },
  interior: { top: '#9fc4ef', hor: '#e9eef2', bot: '#cfc8bd', sunAz: 60, sunEl: 35, sun: '#fff1df', sunI: 2.2, hemiSky: '#ffffff', hemiGround: '#a89c8c', hemiI: 0.9, env: 0.7, fog: '#e9eef2', fogNear: 60, fogFar: 400, exposure: 1.0 },
  space: { top: '#000000', hor: '#03050d', bot: '#000000', sunAz: 60, sunEl: 15, sun: '#ffffff', sunI: 3.4, hemiSky: '#203060', hemiGround: '#000000', hemiI: 0.08, env: 0.0, fog: '#000000', fogNear: 1e5, fogFar: 2e5, exposure: 1.0, stars: 1 },
};
export const mixLook = (a: Look, b: Look, t: number): Look => {
  const c = (x: string, y: string) => '#' + new THREE.Color(x).lerp(new THREE.Color(y), t).getHexString();
  const n = (x: number, y: number) => x + (y - x) * t;
  return {
    top: c(a.top, b.top), hor: c(a.hor, b.hor), bot: c(a.bot, b.bot), sunAz: n(a.sunAz, b.sunAz), sunEl: n(a.sunEl, b.sunEl),
    sun: c(a.sun, b.sun), sunI: n(a.sunI, b.sunI), hemiSky: c(a.hemiSky, b.hemiSky), hemiGround: c(a.hemiGround, b.hemiGround),
    hemiI: n(a.hemiI, b.hemiI), env: n(a.env, b.env), fog: c(a.fog, b.fog), fogNear: n(a.fogNear, b.fogNear), fogFar: n(a.fogFar, b.fogFar),
    exposure: n(a.exposure, b.exposure), sunDisc: n(a.sunDisc || 0, b.sunDisc || 0), stars: n(a.stars || 0, b.stars || 0),
  };
};
export const sunVec = (az: number, el: number, r = 1) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, Math.cos(a) * Math.cos(e) * r);
};

// ------------------------------------------------------------------ sky dome
const skyVert = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix*vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z = gl_Position.w; }`;
const skyFrag = `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uBot; uniform vec3 uSunDir; uniform vec3 uSun; uniform float uDisc; uniform float uStars; uniform float uTime; varying vec3 vDir;
float h(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){ vec3 d = normalize(vDir); float y = d.y;
 vec3 col = y>0.0 ? mix(uHor, uTop, pow(clamp(y,0.0,1.0),0.55)) : mix(uHor, uBot, pow(clamp(-y,0.0,1.0),0.4));
 float s = max(dot(d, normalize(uSunDir)),0.0);
 col += uSun * (pow(s, 8.0)*0.35 + pow(s, 64.0)*0.5) * uDisc;
 col = mix(col, vec3(1.0,0.97,0.9)*1.6, smoothstep(0.9993,0.9997,s)*uDisc);
 if(uStars>0.0 && y>0.0){ vec3 q = floor(d*420.0); float st = step(0.9965, h(q)); float tw = 0.6+0.4*sin(uTime*0.3+h(q+3.0)*30.0); col += vec3(st*tw*uStars*smoothstep(0.0,0.25,y)); }
 gl_FragColor = vec4(col,1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const Sky: React.FC<{ look: Look; frame?: number }> = ({ look, frame = 0 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() }, uSun: { value: new THREE.Color() }, uDisc: { value: 0 }, uStars: { value: 0 }, uTime: { value: 0 } },
  }), []);
  mat.uniforms.uTop.value.set(look.top); mat.uniforms.uHor.value.set(look.hor); mat.uniforms.uBot.value.set(look.bot);
  mat.uniforms.uSunDir.value.copy(sunVec(look.sunAz, look.sunEl)); mat.uniforms.uSun.value.set(look.sun);
  mat.uniforms.uDisc.value = look.sunDisc || 0; mat.uniforms.uStars.value = look.stars || 0; mat.uniforms.uTime.value = frame;
  return <mesh material={mat} renderOrder={1000} frustumCulled={false}><sphereGeometry args={[1500, 32, 16]} /></mesh>;
};

// ------------------------------------------------------------------ environment (lights + fog + env map)
const EnvMap: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  const tex = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  scene.environment = tex;
  (scene as any).environmentIntensity = intensity;
  return null;
};
const Exposure: React.FC<{ v: number }> = ({ v }) => { const { gl } = useThree(); gl.toneMappingExposure = v; return null; };

export const Lights: React.FC<{ look: Look; center?: number[]; size?: number; shadow?: boolean; mapSize?: number; frame?: number; noSky?: boolean; noFog?: boolean }> = ({ look, center = [0, 0, 0], size = 60, shadow = true, mapSize = 2048, frame = 0, noSky, noFog }) => {
  const sv = sunVec(look.sunAz, Math.max(look.sunEl, 12), size * 1.5);
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(center[0], center[1], center[2]);
  const { scene } = useThree();
  if (!noFog) { if (!scene.fog) scene.fog = new THREE.Fog(look.fog, look.fogNear, look.fogFar); const fg = scene.fog as THREE.Fog; fg.color.set(look.fog); fg.near = look.fogNear; fg.far = look.fogFar; } else scene.fog = null;
  return (
    <>
      <EnvMap intensity={look.env} />
      <Exposure v={look.exposure} />
      {!noSky && <Sky look={look} frame={frame} />}
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemiI]} />
      <primitive object={target} />
      <directionalLight
        color={look.sun} intensity={look.sunI} position={[center[0] + sv.x, center[1] + sv.y, center[2] + sv.z]} target={target}
        castShadow={shadow} shadow-mapSize-width={mapSize} shadow-mapSize-height={mapSize} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-left={-size} shadow-camera-right={size} shadow-camera-top={size} shadow-camera-bottom={-size} shadow-camera-near={1} shadow-camera-far={size * 4}
      />
    </>
  );
};

// ------------------------------------------------------------------ camera
export type CamState = { pos: number[]; look: number[]; fov?: number; roll?: number };
export const Cam: React.FC<CamState> = ({ pos, look, fov = 45, roll = 0 }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(pos[0], pos[1], pos[2]);
  c.up.set(0, 1, 0);
  c.lookAt(look[0], look[1], look[2]);
  if (roll) c.rotateZ((roll * Math.PI) / 180);
  if (c.fov !== fov) { c.fov = fov; }
  c.near = 0.1; c.far = 4000;
  c.updateProjectionMatrix();
  return null;
};

// ------------------------------------------------------------------ the canvas wrapper
const Perf: React.FC = () => {
  const { gl, scene, camera } = useThree();
  React.useEffect(() => {
    const ctx = gl.getContext();
    const px = new Uint8Array(4);
    const time = (label: string, fn: () => void) => { const t0 = performance.now(); fn(); ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px); return label + '=' + Math.round(performance.now() - t0); };
    gl.info.autoReset = true;
    const a = time('full', () => gl.render(scene, camera));
    const info = `calls=${gl.info.render.calls} tris=${gl.info.render.triangles}`;
    const sm = gl.shadowMap.autoUpdate; gl.shadowMap.autoUpdate = false;
    const b = time('noShadowPass', () => gl.render(scene, camera));
    gl.shadowMap.autoUpdate = sm;
    console.warn('PERF', a, b, info);
  });
  return null;
};
/** render quality (set once per render from the composition props) */
export const Q = { res: 0.6667, shadows: true as boolean | string, aa: true, debug: false };
const ShadowType: React.FC = () => { const { gl } = useThree(); gl.shadowMap.enabled = !!Q.shadows; gl.shadowMap.type = Q.shadows === 'soft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap; return null; };
export const Stage: React.FC<{ children: React.ReactNode; bg?: string; style?: React.CSSProperties }> = ({ children, bg = '#000', style }) => {
  const w = Math.round(W * Q.res), h = Math.round(H * Q.res);
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${W / w})`, transformOrigin: '0 0' }}>
        <ThreeCanvas width={w} height={h} shadows={!!Q.shadows} gl={{ antialias: Q.aa, powerPreference: 'high-performance' }} camera={{ fov: 45, near: 0.1, far: 4000, position: [0, 2, 10] }}>
          <ShadowType />
          {children}
          {Q.debug ? <Perf /> : null}
        </ThreeCanvas>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ materials + textures (cached)
const matCache = new Map<string, THREE.Material>();
export function mat(color: string, o: { r?: number; m?: number; e?: string; ei?: number; t?: number; side?: THREE.Side; flat?: boolean; fog?: boolean } = {}) {
  const key = [color, o.r, o.m, o.e, o.ei, o.t, o.side, o.flat, o.fog].join('|');
  let m = matCache.get(key);
  if (!m) {
    const lam = (o.r ?? 0.8) >= 0.75 && !o.m;
    const sm: any = lam ? new THREE.MeshLambertMaterial({ color, flatShading: !!o.flat }) : new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.8, metalness: o.m ?? 0, flatShading: !!o.flat });
    if (o.e) { sm.emissive = new THREE.Color(o.e); sm.emissiveIntensity = o.ei ?? 1; }
    if (o.t !== undefined) { sm.transparent = true; sm.opacity = o.t; sm.depthWrite = o.t > 0.9; }
    if (o.side !== undefined) sm.side = o.side;
    if (o.fog === false) sm.fog = false;
    m = sm; matCache.set(key, m);
  }
  return m;
}
const basicCache = new Map<string, THREE.Material>();
export function basic(color: string, o: { t?: number; add?: boolean; fog?: boolean; side?: THREE.Side; map?: THREE.Texture; dt?: boolean } = {}) {
  const key = [color, o.t, o.add, o.fog, o.side, o.map?.uuid, o.dt].join('|');
  let m = basicCache.get(key);
  if (!m) {
    const b = new THREE.MeshBasicMaterial({ color, map: o.map, transparent: o.t !== undefined || !!o.add || !!o.map, opacity: o.t ?? 1, fog: o.fog ?? false, side: o.side ?? THREE.FrontSide, depthWrite: !(o.add || (o.t !== undefined && o.t < 0.95)) });
    if (o.add) b.blending = THREE.AdditiveBlending;
    if (o.dt === false) b.depthTest = false;
    b.toneMapped = false;
    m = b; basicCache.set(key, m);
  }
  return m;
}

/** outline (inverted hull) material: pushes vertices along normals, draws back faces */
const olCache = new Map<string, THREE.ShaderMaterial>();
export function outlineMat(width = 0.018, color = '#1d1424') {
  const k = width + color;
  let m = olCache.get(k);
  if (!m) {
    m = new THREE.ShaderMaterial({
      uniforms: { uW: { value: width }, uC: { value: new THREE.Color(color) } },
      vertexShader: `uniform float uW; void main(){ vec3 p = position + normalize(normal)*uW; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform vec3 uC; void main(){ gl_FragColor = vec4(uC,1.0); }`,
      side: THREE.BackSide,
    });
    olCache.set(k, m);
  }
  return m;
}

const texCache = new Map<string, THREE.Texture>();
export function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, o: { repeat?: boolean; srgb?: boolean } = {}) {
  let t = texCache.get(key);
  if (!t) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    const t0 = performance.now();
    draw(g, w, h);
    const dt = performance.now() - t0;
    if (dt > 300) console.warn('SLOWTEX', key.slice(0, 40), Math.round(dt));
    t = new THREE.CanvasTexture(c);
    if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = 4;
    t.needsUpdate = true;
    texCache.set(key, t);
  }
  return t;
}
/** sign / label texture */
export function textTex(text: string, o: { w?: number; h?: number; bg?: string; fg?: string; font?: string; size?: number; border?: string; radius?: number; stroke?: string } = {}) {
  const w = o.w ?? 512, h = o.h ?? 128;
  return canvasTex('txt|' + text + JSON.stringify(o), w, h, (g) => {
    if (o.bg) {
      g.fillStyle = o.bg;
      const r = o.radius ?? 0;
      g.beginPath(); (g as any).roundRect ? (g as any).roundRect(0, 0, w, h, r) : g.rect(0, 0, w, h); g.fill();
    }
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = h * 0.06; g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h * 0.1 > 0 ? h - h * 0.1 : h); }
    g.fillStyle = o.fg ?? '#fff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const size = o.size ?? h * 0.62;
    g.font = `${o.font ?? '900'} ${size}px Montserrat, sans-serif`;
    const lines = text.split('\n');
    lines.forEach((ln, i) => {
      const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.08;
      if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = size * 0.12; g.strokeText(ln, w / 2, y); }
      g.fillText(ln, w / 2, y);
    });
  });
}
/** soft round sprite (glow / smoke / blob shadow) */
export function radialTex(key = 'radial', inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', stop = 0) {
  return canvasTex('rad|' + key + inner + outer + stop, 128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.5 * stop, w / 2, h / 2, w / 2);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
export function smokeTex() {
  return canvasTex('smoke', 256, 256, (g, w, h) => {
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 40; i++) {
      const x = w / 2 + (r() - 0.5) * w * 0.45, y = h / 2 + (r() - 0.5) * h * 0.45, rad = w * (0.12 + r() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
}

/** blob contact shadow under characters / props */
export const Blob: React.FC<{ r?: number; o?: number; pos?: number[] }> = ({ r = 0.45, o = 0.45, pos = [0, 0.012, 0] }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: radialTex('blob', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)'), transparent: true, opacity: o, depthWrite: false }), [o]);
  return <mesh position={pos as any} rotation={[-Math.PI / 2, 0, 0]} material={m}><planeGeometry args={[r * 2, r * 2]} /></mesh>;
};

const sprCache = new Map<string, THREE.SpriteMaterial>();
/** sprite material (billboard glows) */
export function spr(color: string, o: { t?: number; add?: boolean; map?: THREE.Texture; fog?: boolean } = {}) {
  const key = [color, o.t, o.add, o.map?.uuid, o.fog].join('|');
  let m = sprCache.get(key);
  if (!m) {
    m = new THREE.SpriteMaterial({ color, map: o.map, transparent: true, opacity: o.t ?? 1, depthWrite: false, fog: o.fog ?? false });
    if (o.add) m.blending = THREE.AdditiveBlending;
    m.toneMapped = false;
    sprCache.set(key, m);
  }
  return m;
}
