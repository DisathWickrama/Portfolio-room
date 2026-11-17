/**
 * Render pipeline: scene -> soft bloom -> film grain + vignette -> tone map.
 * On low-power phones bloom is skipped but grain/vignette stay, so the mood
 * survives the fallback.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Quality } from './quality';

const GrainShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.07 }, uVignette: { value: 1.0 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVignette;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float n = hash(gl_FragCoord.xy * 0.731 + fract(uTime * 7.13) * 91.7) - 0.5;
      float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += n * uGrain * (0.25 + lum);
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - uVignette * smoothstep(0.12, 0.85, dot(d, d) * 1.9);
      gl_FragColor = c;
    }`,
};

export class Post {
  private composer: EffectComposer;
  private bloom?: UnrealBloomPass;
  private grain: ShaderPass;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, q: Quality) {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: q.msaa, stencilBuffer: true });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(scene, camera));
    if (q.bloom) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.55, 0.75, 0.82);
      this.composer.addPass(this.bloom);
    }
    this.grain = new ShaderPass(GrainShader);
    this.composer.addPass(this.grain);
    this.composer.addPass(new OutputPass());
  }

  setSize(w: number, h: number, pixelRatio: number) {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
  }

  /** 0 = night (strong glow), 1 = day (subtle). */
  setDay(mix: number) {
    if (this.bloom) this.bloom.strength = 0.55 - mix * 0.33;
    this.grain.uniforms.uVignette.value = 1.0 - mix * 0.45;
  }

  render(time: number) {
    this.grain.uniforms.uTime.value = time;
    this.composer.render();
  }
}
