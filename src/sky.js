import * as THREE from 'three'

/*
  سماء زرقاء طبيعية: تدرّج من الأفق الباهت إلى الأزرق العميق، شمس بوهج دافئ،
  وغيوم ركامية تُحسب بالكامل في الظلال مع ظلال ذاتية وحركة بطيئة.
*/
export const SKY_HAZE = 0xa9d0f5
export const SUN_DIR = new THREE.Vector3(-0.12, 0.3, -1.0).normalize()

export function createSky({ low = false } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSun: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
      uOct: { value: low ? 4 : 6 },
      uNight: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      uniform float uTime;
      uniform float uOct;
      uniform float uNight;
      float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 6; i++) {
          if (float(i) >= uOct) break;
          v += a * noise(p);
          p = p * 2.03 + vec2(17.1, 9.2);
          a *= 0.5;
        }
        return v;
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 horizon = vec3(0.66, 0.82, 0.96);
        vec3 mid = vec3(0.33, 0.60, 0.92);
        vec3 zen = vec3(0.13, 0.33, 0.75);
        vec3 col = mix(horizon, mid, pow(smoothstep(0.0, 0.45, h), 0.65));
        col = mix(col, zen, smoothstep(0.3, 1.0, h));

        vec3 S = normalize(uSun);
        float sd = max(dot(d, S), 0.0);
        vec3 warm = vec3(1.0, 0.82, 0.55);
        col += warm * pow(sd, 18.0) * 0.45 + vec3(1.0, 0.9, 0.7) * pow(sd, 160.0) * 0.8;
        float haze = pow(1.0 - clamp(h, 0.0, 1.0), 6.0);
        col = mix(col, horizon * 1.02 + warm * 0.12, haze * 0.28 * (0.4 + 0.6 * pow(sd, 2.0)));
        float disc = smoothstep(0.99935, 0.99975, sd);
        col = mix(col, vec3(1.0, 0.97, 0.88) * 1.6, disc);

        if (h > 0.01) {
          vec2 p = d.xz / (h + 0.12) * 1.1 + vec2(uTime * 0.004, uTime * 0.002);
          float c = fbm(p * 1.4);
          float dens = smoothstep(0.52, 0.80, c);
          vec2 sp = normalize(S.xz + vec2(1e-4)) * 0.09;
          float c2 = fbm(p * 1.4 + sp * 1.4);
          float lit = clamp(1.0 - (c2 - c) * 2.4, 0.0, 1.0);
          vec3 cs = mix(vec3(0.55, 0.62, 0.74), vec3(1.0, 0.985, 0.95), lit);
          cs = mix(cs, vec3(1.0, 0.88, 0.7), pow(sd, 6.0) * 0.5);
          float fade = smoothstep(0.015, 0.2, h);
          col = mix(col, cs, dens * fade * 0.92);
        }
        if (uNight > 0.001) {
          float n = smoothstep(0.0, 1.0, uNight);
          vec3 nh = vec3(0.17, 0.14, 0.31);
          vec3 nm = vec3(0.045, 0.065, 0.2);
          vec3 nz = vec3(0.012, 0.022, 0.08);
          vec3 nc = mix(nh, nm, pow(smoothstep(0.0, 0.4, h), 0.6));
          nc = mix(nc, nz, smoothstep(0.25, 1.0, h));
          float duskK = (1.0 - smoothstep(0.3, 0.95, uNight));
          nc += vec3(0.95, 0.42, 0.16) * pow(1.0 - clamp(h, 0.0, 1.0), 5.0) * 0.6 * duskK * (0.4 + 0.6 * pow(sd, 2.0));
          /* درب التبّانة */
          vec3 mw = normalize(vec3(0.35, 0.8, 0.5));
          float bd = abs(dot(d, mw));
          float band = smoothstep(0.34, 0.0, bd);
          float nz1 = fbm(vec2(atan(d.z, d.x) * 2.4, d.y * 7.0) + 3.1);
          nc += vec3(0.34, 0.38, 0.66) * band * (0.35 + 0.8 * nz1) * 0.55;
          /* نجوم */
          vec3 sp = d * 120.0;
          vec3 cell = floor(sp);
          vec3 f = fract(sp) - 0.5;
          float rr = hash3(cell);
          vec3 jit = (vec3(hash3(cell + 7.3), hash3(cell + 13.1), hash3(cell + 3.7)) - 0.5) * 0.55;
          float sdist = length(f - jit);
          float tw = 0.65 + 0.35 * sin(uTime * 2.2 + rr * 80.0);
          float st = step(0.982, rr) * smoothstep(0.1, 0.0, sdist) * tw;
          float big = step(0.9985, rr) * smoothstep(0.2, 0.0, sdist) * (0.8 + 0.2 * tw);
          vec3 tint = mix(vec3(0.8, 0.88, 1.0), vec3(1.0, 0.9, 0.7), hash3(cell + 1.7));
          nc += tint * (st * 0.9 + big * 1.8) * smoothstep(0.0, 0.08, h);
          /* قمر */
          vec3 M = normalize(vec3(0.5, 0.42, -0.78));
          float md = dot(d, M);
          nc += vec3(1.0, 0.96, 0.84) * smoothstep(0.9988, 0.9994, md) * 1.6;
          nc += vec3(0.55, 0.62, 0.9) * pow(max(md, 0.0), 90.0) * 0.5;
          col = mix(col, nc, n);
        }
        if (h < 0.0) col = mix(horizon, vec3(0.05, 0.07, 0.17), smoothstep(0.0, 1.0, uNight));
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 20), mat)
  sky.renderOrder = -100
  sky.frustumCulled = false
  return sky
}
