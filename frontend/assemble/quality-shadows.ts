import {ShaderChunk} from '../vendor/three.module.js';

// A blocker search keeps contact edges tight and lets distant shadows soften.
// This patch is attached only to the extreme materials; originals are untouched.
const helper=`
  vec2 duckShadowOffset(int i){float a=float(i)*2.39996323;return vec2(cos(a),sin(a))*sqrt((float(i)+.5)/32.);}
  float duckSoftShadow(sampler2D map,vec3 coord,vec2 mapSize){
    float blockers=0.,sumDepth=0.;
    for(int i=0;i<32;i++){
      float d=unpackRGBAToDepth(texture2D(map,coord.xy+duckShadowOffset(i)*180./mapSize));
      if(d<coord.z-.0004){sumDepth+=d;blockers+=1.;}
    }
    if(blockers<.5)return 1.;
    float penumbra=clamp(2.+(coord.z-sumDepth/blockers)*2800.,2.,210.),visibility=0.;
    for(int i=0;i<32;i++)visibility+=texture2DCompare(map,coord.xy+duckShadowOffset(i)*penumbra/mapSize,coord.z);
    return visibility/32.;
  }
`;
const source=ShaderChunk.shadowmap_pars_fragment,start=source.indexOf('#if defined( SHADOWMAP_TYPE_PCF )',source.indexOf('float getShadow(')),end=source.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )',start);
const chunk=(source.slice(0,start)+'#if defined( SHADOWMAP_TYPE_PCF )\n shadow=duckSoftShadow(shadowMap,shadowCoord.xyz,shadowMapSize);\n '+source.slice(end)).replace('float getShadow(',helper+'\nfloat getShadow(');
export function softenShadows(shader:{fragmentShader:string}){shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',chunk);}
