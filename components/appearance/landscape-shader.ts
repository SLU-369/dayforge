// All masks use coordinates of the original 1536×1024 painting, not viewport
// percentages. This keeps the riverbanks and waterfall aligned under cover-crop.
export const landscapeVertex = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const landscapeFragment = `#version 300 es
precision highp float;
uniform sampler2D painting;
uniform vec2 resolution;
uniform float time;
uniform vec2 light;
out vec4 outputColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1)), f.x), f.y);
}
float fbm(vec2 p) { return noise(p)*.57 + noise(p*2.03)*.28 + noise(p*4.07)*.15; }
float band(float value, float a, float b, float feather) {
  return smoothstep(a, a+feather, value) * (1.0-smoothstep(b-feather, b, value));
}
vec3 lighting(vec3 color) {
  float luma = dot(color, vec3(.2126,.7152,.0722));
  vec3 night = mix(vec3(luma), color, .65)*.26 * vec3(.85,.96,1.1);
  vec3 dusk = mix(color, vec3(luma)*vec3(1.30,1.03,.78), .40)*.78;
  return night*(1.0-light.x-light.y) + color*light.x + dusk*light.y;
}
void main() {
  vec2 screen = vec2(gl_FragCoord.x, resolution.y-gl_FragCoord.y);
  vec2 imageSize = vec2(1536.,1024.);
  float cover = max(resolution.x/imageSize.x,resolution.y/imageSize.y);
  vec2 uv = (screen-(resolution-imageSize*cover)*.5)/(imageSize*cover);
  float bankLeft = max(0., (uv.y-.70)*1.03);
  float bankRight = 1.-max(0., (uv.y-.77)*1.27);
  float lake = smoothstep(.655,.684,uv.y)*band(uv.x,bankLeft,bankRight,.025);
  float perspective = smoothstep(.65,1.,uv.y);
  // Independent travelling waves, no ping-pong translation of the photograph.
  float wave = sin(uv.y*430. + uv.x*23. - time*.9)
    + .48*sin(uv.y*713. - uv.x*39. + time*.63);
  vec2 ripple = vec2(wave*(.00028+.0013*perspective),
    sin(uv.y*287.+uv.x*41.+time*.71)*(.00013+.00045*perspective));
  float fallCenter = .931 - smoothstep(.52,.64,uv.y)*.007;
  float fallWidth = mix(.0035,.010,smoothstep(.52,.64,uv.y));
  float fall = (1.-smoothstep(fallWidth*.3,fallWidth,abs(uv.x-fallCenter)))
    * band(uv.y,.515,.642,.012);
  float stream = fbm(vec2(uv.x*950., uv.y*155.-time*2.6));
  vec2 flow = vec2(sin(uv.y*165.-time*2.)*.0005, (stream-.5)*.0035);
  vec3 water = texture(painting, uv+ripple*lake+flow*fall).rgb;
  water += vec3(.065,.074,.077)*(stream-.30)*fall;
  // Small turbulent spray stays at the foot of the fall, never across rocks.
  float mist = exp(-dot((uv-vec2(.925,.634))/vec2(.017,.011),
    (uv-vec2(.925,.634))/vec2(.017,.011))*2.);
  water = mix(water, vec3(.76,.82,.83), mist*(.12+.10*noise(uv*160.+vec2(time*.15,-time*.2))));
  float waterAlpha = max(lake, max(fall,mist*.5))*.88;

  // Wisps in the open lateral sky; conservative masks never veil the towers.
  float skyLimit = mix(.12,.225,smoothstep(.73,.81,uv.x));
  skyLimit = mix(skyLimit,.21,1.-smoothstep(.23,.30,uv.x));
  float sky = 1.-smoothstep(skyLimit-.045,skyLimit,uv.y);
  vec2 drift = uv*vec2(9.,19.)-vec2(time*.012,time*.0009);
  float density = smoothstep(.43,.73,fbm(drift));
  float wisps = smoothstep(.25,.73,fbm(drift*1.8+vec2(11.,time*.007)));
  float cloudAlpha = density*wisps*sky*(.045+.29*light.x+.14*light.y);
  vec3 cloudColor = mix(vec3(.33,.42,.54),vec3(.97,.98,1.),light.x);
  cloudColor = mix(cloudColor,vec3(1.,.72,.48),light.y*.65);
  float alpha = waterAlpha+cloudAlpha*(1.-waterAlpha);
  vec3 rgb = lighting(water)*waterAlpha + cloudColor*cloudAlpha*(1.-waterAlpha);
  outputColor = vec4(rgb,alpha); // Premultiplied alpha, matching the canvas context.
}`;
