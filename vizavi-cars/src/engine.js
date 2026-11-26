// Движок кадра: renderFrame(n) зависит только от номера кадра n (дробного).
// Подкадры: размытие движения (затвор 180°), глубина резкости (диафрагма), мягкие тени, сглаживание.
// Усреднение в линейном HDR, потом тональная кривая, виньетка, зерно, свечение ламп.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function createEngine({ width, height, fps = 30 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 1);

  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
  const subRT = new THREE.WebGLRenderTarget(width, height, { ...rtOpts, samples: 4 });
  const accRT = new THREE.WebGLRenderTarget(width, height, { ...rtOpts, depthBuffer: false });
  const tmpRT = new THREE.WebGLRenderTarget(width, height, { ...rtOpts, depthBuffer: false });

  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const addMat = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, weight: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float weight; varying vec2 vUv; void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; if (!(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b) || c.r > 1e4 || c.g > 1e4 || c.b > 1e4) c = vec3(0.0); c = clamp(c, 0.0, 48.0); gl_FragColor = vec4(c * weight, 1.0); }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    depthTest: false, depthWrite: false,
  });
  const addQuad = new THREE.Mesh(quadGeo, addMat);
  const addScene = new THREE.Scene(); addScene.add(addQuad);

  // надписи и титры рисуются на 2D-холсте и кладутся поверх уже после тональной кривой
  const ov = document.createElement('canvas'); ov.width = width; ov.height = height;
  const ovCtx = ov.getContext('2d');
  const ovTex = new THREE.CanvasTexture(ov); ovTex.colorSpace = THREE.NoColorSpace; ovTex.minFilter = THREE.LinearFilter; ovTex.generateMipmaps = false;

  const finalMat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: accRT.texture }, tOv: { value: ovTex }, res: { value: new THREE.Vector2(width, height) },
      exposure: { value: 1.0 }, vignette: { value: 0.18 }, grain: { value: 0.03 }, seed: { value: 0 }, fade: { value: 0 }, flash: { value: 0 },
      tint: { value: new THREE.Vector3(1, 1, 1) }, sat: { value: 1.05 }, contrast: { value: 1.06 }, ca: { value: 0.0008 },
    },
    vertexShader: VERT,
    fragmentShader: `
      uniform sampler2D tDiffuse, tOv; uniform vec2 res; uniform float exposure, vignette, grain, seed, fade, flash, sat, contrast, ca; uniform vec3 tint; varying vec2 vUv;
      vec3 aces(vec3 x){ const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0); }
      vec3 toSrgb(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d,d);
        vec2 o = d * ca * 6.0 * r2 * 4.0;
        vec3 c = vec3(texture2D(tDiffuse, vUv - o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + o).b);
        c *= exposure * tint;
        c += vec3(flash);
        c = aces(c);
        float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, sat);
        c = (c - 0.5) * contrast + 0.5; c = max(c, 0.0);
        c = toSrgb(c);
        float v = smoothstep(0.85, 0.15, length(d * vec2(res.x/res.y, 1.0) * 0.9)); c *= mix(1.0 - vignette, 1.0, v);
        c += (h(vUv*res + seed) - 0.5) * grain;
        vec4 ov = texture2D(tOv, vUv);
        c = c * (1.0 - ov.a) + ov.rgb;
        c *= 1.0 - fade;
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const finalScene = new THREE.Scene(); finalScene.add(new THREE.Mesh(quadGeo, finalMat));

  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.65, 1.15);

  const C = Math.PI * (3 - Math.sqrt(5));
  const disc = (k, N) => { const r = Math.sqrt((k + 0.5) / N), a = k * C; return [Math.cos(a) * r, Math.sin(a) * r]; };
  const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

  return { renderer, subRT, accRT, tmpRT, addScene, quadCam, finalScene, finalMat, bloom, ov, ovCtx, ovTex, disc, halton, width, height, fps };
}

/** сам кадр. world: { scene, camera, update(t), camAt(t) -> {pos,look,fov,roll,focus,aperture}, lights:[{light,base}], post(t) -> {exposure,...} } */
export function drawFrame(E, world, n, N = 8) {
  const { renderer, subRT, accRT, addScene, quadCam, finalScene, finalMat, bloom, width, height, fps } = E;
  const cam = world.camera;
  renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 1); renderer.clear(true, false, false);
  addScene.children[0].material.uniforms.weight.value = 1 / N;
  const apK = Math.min(1, N / 24);
  const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
  for (let k = 0; k < N; k++) {
    const t = (n + ((k + 0.5) / N) * 0.5) / fps;
    world.update(t, n);
    const c = world.camAt(t);
    const p0 = new THREE.Vector3(...c.pos), look = new THREE.Vector3(...c.look);
    fwd.copy(look).sub(p0).normalize();
    right.crossVectors(fwd, up).normalize(); upv.crossVectors(right, fwd).normalize();
    if (c.roll) { const q = new THREE.Quaternion().setFromAxisAngle(fwd, c.roll * Math.PI / 180); right.applyQuaternion(q); upv.applyQuaternion(q); }
    const focusDist = c.focus ?? p0.distanceTo(look);
    const F = p0.clone().addScaledVector(fwd, focusDist);
    const [dx, dy] = E.disc(k, N);
    const A = (c.aperture ?? 0) * apK;
    cam.position.copy(p0).addScaledVector(right, dx * A).addScaledVector(upv, dy * A);
    cam.up.copy(upv);
    cam.lookAt(F);
    cam.fov = c.fov; cam.near = 0.08; cam.far = 3000;
    cam.aspect = width / height;
    const jx = (E.halton(k + 1, 2) - 0.5), jy = (E.halton(k + 1, 3) - 0.5);
    cam.setViewOffset(width, height, jx, jy, width, height);
    cam.updateProjectionMatrix();
    if (world.jitterLights) world.jitterLights(k, N);
    renderer.setRenderTarget(subRT); renderer.clear(true, true, true);
    renderer.render(world.scene, cam);
    addScene.children[0].material.uniforms.tDiffuse.value = subRT.texture;
    renderer.setRenderTarget(accRT); renderer.autoClear = false;
    renderer.render(addScene, quadCam); renderer.autoClear = true;
  }
  cam.clearViewOffset();
  const post = world.post ? world.post(n / fps, n) : {};
  bloom.strength = post.bloom ?? 0.5; bloom.radius = post.bloomRadius ?? 0.6; bloom.threshold = post.bloomThreshold ?? 1.1;
  if (bloom.strength > 0.001) bloom.render(renderer, E.tmpRT, accRT, 0, false);
  const u = finalMat.uniforms;
  u.exposure.value = post.exposure ?? 1; u.vignette.value = post.vignette ?? 0.2; u.grain.value = post.grain ?? 0.03;
  u.seed.value = (Math.floor(n) % 97) * 1.37; u.fade.value = post.fade ?? 0; u.flash.value = post.flash ?? 0;
  u.tint.value.set(...(post.tint ?? [1, 1, 1])); u.sat.value = post.sat ?? 1.05; u.contrast.value = post.contrast ?? 1.06;
  u.ca.value = post.ca ?? 0.0008;
  // титры
  const g = E.ovCtx; g.clearRect(0, 0, width, height);
  if (world.overlay) world.overlay(g, n / fps, n, width, height);
  E.ovTex.needsUpdate = true;
  renderer.setRenderTarget(null); renderer.render(finalScene, quadCam);
}
