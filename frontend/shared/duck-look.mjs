// How the printed duck looks, shared by the studio (duck-view.mjs) and the assembly guide, so the same plastic,
// print layers and light appear on both pages.
import * as THREE from 'three';
import { t as _t } from './i18n.mjs';

// Tone mapping exposure and environment strength of the studio stage.
export const LOOK = Object.freeze({ exposure: 1.05, environment: .65 });

// Filament finishes: physically based presets plus procedural FDM layer lines (0.2 mm). The lines fade
// out by screen-space frequency, so they appear when you zoom in instead of shimmering from afar.
// These are visual approximations, not measured material data.
export const FINISHES = {
  basic: { get label() {return _t("text.0039");}, roughness: .42, metalness: 0, clearcoat: .12, clearcoatRoughness: .4, sheen: 0, transmission: 0, thickness: 0, layer: .35 },
  matte: { get label() {return _t("text.0040");}, roughness: .9, metalness: 0, clearcoat: 0, clearcoatRoughness: .5, sheen: .35, transmission: 0, thickness: 0, layer: .22 },
  silk: { get label() {return _t("text.0041");}, roughness: .2, metalness: .45, clearcoat: .8, clearcoatRoughness: .15, sheen: 0, transmission: 0, thickness: 0, layer: .55 },
  translucent: { get label() {return _t("text.0042");}, roughness: .28, metalness: 0, clearcoat: .3, clearcoatRoughness: .3, sheen: 0, transmission: .6, thickness: 4, layer: .3 },
  tpu: { get label() {return _t("text.0043");}, roughness: .78, metalness: 0, clearcoat: 0, clearcoatRoughness: .5, sheen: .5, transmission: 0, thickness: 0, layer: .18 }
};
export const FINISH_KEYS = ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'transmission', 'thickness'];
export function withLayers(mat, value = .35) {
  mat.userData.layer = { value };mat.sheenColor.setScalar(.6);mat.sheenRoughness = .8;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLayer = mat.userData.layer;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLayerY;\nvarying vec3 vUpView;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLayerY=position.y;\nvUpView=normalize(normalMatrix*vec3(0.,1.,0.));');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLayer;\nvarying float vLayerY;\nvarying vec3 vUpView;').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{float lp=vLayerY/0.2;float fade=clamp(1.0-fwidth(lp)*1.2,0.0,1.0);if(fade>0.0){normal=normalize(normal+vUpView*sin(lp*6.2831853)*uLayer*fade);}}');
  };
  mat.customProgramCacheKey = () => 'fdm-layers';return mat;
}

export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xf1f5ff, 0xb6c2d8, 2.2));
  for (const [color, intensity, position] of [[0xfffbf7, 3.2, [-160, 380, 290]], [0xdde9ff, 1.4, [240, 180, -100]]]) {const l = new THREE.DirectionalLight(color, intensity);l.position.set(...position);scene.add(l);}
}

// A printed part in a filament finish. Copies (material.clone()) keep the layer lines, which the assembly guide relies on.
export class PrintedMaterial extends THREE.MeshPhysicalMaterial {
  constructor(parameters) {super(parameters);withLayers(this);}
  copy(source) {super.copy(source);return withLayers(this, source.userData.layer?.value);}
}
export function printedMaterial(color, finish = 'basic') {
  const f = FINISHES[finish] || FINISHES.basic,material = new PrintedMaterial({ color, envMapIntensity: LOOK.environment, ...Object.fromEntries(FINISH_KEYS.map((k) => [k, f[k]])) });
  material.userData.layer.value = f.layer;material.userData.printed = true;return material;
}
