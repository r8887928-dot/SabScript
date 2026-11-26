// Окружение для отражений: маленькая «студия» из светящихся прямоугольников через PMREM.
import * as THREE from 'three';
export function makeEnv(renderer, kind = 'hangar') {
  const sc = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(kind === 'dawn' ? '#6a86c8' : kind === 'night' ? '#050a1c' : '#141a26') }, hor: { value: new THREE.Color(kind === 'dawn' ? '#ffb38a' : kind === 'night' ? '#1b2a4d' : '#2a313f') }, bot: { value: new THREE.Color(kind === 'night' ? '#0a0c14' : '#16181c') } },
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top,hor,bot; varying vec3 p; void main(){ float h = normalize(p).y; vec3 c = h>0.0 ? mix(hor, top, pow(h,0.6)) : mix(hor, bot, pow(-h,0.5)); gl_FragColor = vec4(c,1.0); }',
  }));
  sc.add(sky);
  const box = (w, h, d, x, y, z, col, I) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(I) })); m.position.set(x, y, z); sc.add(m); return m; };
  if (kind === 'hangar') {
    for (let i = -3; i <= 3; i++) box(0.5, 0.05, 30, i * 4.2, 18, 0, '#cfe0ff', 4); // потолочные лампы
    box(30, 14, 0.2, 0, 8, -26, '#ffb870', 1.2); box(0.2, 8, 30, 26, 7, 0, '#9fb8ff', 1.4); box(0.2, 8, 30, -26, 7, 0, '#ffd0a0', 0.9);
    box(10, 0.1, 10, 0, -1, 0, '#ffffff', 0.12);
  } else if (kind === 'night') {
    box(30, 0.2, 0.2, 0, 3, -30, '#ffb066', 5); box(30, 0.2, 0.2, 0, 3, 30, '#ffb066', 5); box(0.2, 0.2, 40, 30, 3, 0, '#ff9a3c', 4);
    box(14, 12, 0.2, 0, 14, -40, '#6f8cff', 0.8); box(6, 6, 0.2, -20, 20, 20, '#a8c4ff', 3);
  } else {
    box(20, 12, 0.2, 0, 8, -40, '#ffcf8a', 7); box(40, 0.2, 40, 0, 30, 0, '#9fb8ff', 1.2);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(sc, 0.02).texture; pm.dispose();
  return t;
}
