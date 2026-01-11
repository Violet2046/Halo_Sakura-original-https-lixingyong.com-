uniform float iTime;
uniform vec3 iResolution;
uniform float rainAmount;

varying vec2 vUv;

#define S(a, b, t) smoothstep(a, b, t)

// 哈希噪声函数
float N(float t) {
    return fract(sin(t*12345.564)*7658.76);
}

vec3 N13(float p) {
    vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

// 锯齿波平滑函数
float Saw(float b, float t) {
    return S(0., b, t)*S(1., b, t);
}

// 主雨滴层
vec2 DropLayer2(vec2 uv, float t) {
    vec2 UV = uv;
    
    uv.y += t*0.75;
    vec2 a = vec2(6., 1.);
    vec2 grid = a*2.;
    vec2 id = floor(uv*grid);
    
    float colShift = N(id.x); 
    uv.y += colShift;
    
    id = floor(uv*grid);
    vec3 n = N13(id.x*35.2+id.y*2376.1);
    vec2 st = fract(uv*grid)-vec2(.5, 0);
    
    float x = n.x-.5;
    float y = UV.y*20.;
    float wiggle = sin(y+sin(y));
    x += wiggle*(.5-abs(x))*(n.z-.5);
    x *= .7;
    float ti = fract(t+n.z);
    y = (Saw(.85, ti)-.5)*.9+.5;
    vec2 p = vec2(x, y);
    
    float d = length((st-p)*a.yx);
    float mainDrop = S(.4, .0, d);
    
    float r = sqrt(S(1., y, st.y));
    float cd = abs(st.x-x);
    float trail = S(.23*r, .15*r*r, cd);
    float trailFront = S(-.02, .02, st.y-y);
    trail *= trailFront*r*r;
    
    y = UV.y;
    float trail2 = S(.2*r, .0, cd);
    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
    y = fract(y*10.)+(st.y-.5);
    float dd = length(st-vec2(x, y));
    droplets = S(.3, 0., dd);
    float m = mainDrop+droplets*r*trailFront;
    
    return vec2(m, trail);
}

// 静态水滴
float StaticDrops(vec2 uv, float t) {
    uv *= 40.;
    
    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);
    
    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*fract(n.z*10.)*fade;
    return c;
}

// 组合所有雨滴层
vec2 Drops(vec2 uv, float t, float staticDrops, float layer1, float layer2) {
    float s = StaticDrops(uv, t)*staticDrops;
    vec2 m1 = DropLayer2(uv, t)*layer1;
    vec2 m2 = DropLayer2(uv*1.85, t)*layer2;
    
    float c = s+m1.x+m2.x;
    c = S(.3, 1., c);
    
    return vec2(c, max(m1.y*layer1, m2.y*layer2));
}

void main() {
    vec2 uv = (vUv-.5);
    uv.x *= iResolution.x/iResolution.y;
    float T = iTime;
    
    float t = T*.2;
    
    float staticDrops = S(-.5, 1., rainAmount)*2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);
    
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
    
    // 计算法线用于折射效果
    vec2 e = vec2(.001, 0.);
    float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    vec2 n = vec2(cx-c.x, cy-c.x);
    
    // 创建玻璃水滴的颜色 - 半透明白色带有轻微的蓝色调
    vec3 dropColor = vec3(0.8, 0.9, 1.0);
    
    // 水滴的透明度
    float alpha = c.x * 0.3; // 主水滴半透明
    alpha += c.y * 0.15; // 水痕更透明
    
    // 高光效果
    float highlight = c.x * 0.5;
    dropColor += highlight;
    
    gl_FragColor = vec4(dropColor, alpha);
}
