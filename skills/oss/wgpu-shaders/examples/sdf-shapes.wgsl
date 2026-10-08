// SDF morph grid: circles blend into boxes on a time loop, palette-cycled.
// Same contract as plasma.wgsl: vs_main fullscreen triangle, fs_main pure in (uv, time).
struct Params {
    time: f32,
    width: f32,
    height: f32,
};

@group(0) @binding(0) var<uniform> u: Params;

struct VsOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
    var p = array<vec2f, 3>(
        vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0),
    );
    var out: VsOut;
    out.pos = vec4f(p[i], 0.0, 1.0);
    out.uv = p[i] * 0.5 + 0.5;
    return out;
}

fn sd_circle(p: vec2f, r: f32) -> f32 {
    return length(p) - r;
}

fn sd_box(p: vec2f, b: vec2f) -> f32 {
    let d = abs(p) - b;
    return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
    let aspect = u.width / u.height;
    // 3x2 tile grid in aspect-corrected space
    var g = vec2f(in.uv.x * aspect * 1.5, in.uv.y * 1.0);
    let cell = floor(g);
    var p = fract(g) - 0.5;
    // rotate each cell differently, slowly
    let a = u.time * 0.4 + (cell.x + cell.y * 3.0) * 0.7;
    let c = cos(a);
    let s = sin(a);
    p = mat2x2f(c, -s, s, c) * p;

    // morph circle -> box on a loop
    let k = smoothstep(-1.0, 1.0, sin(u.time * 0.8 + (cell.x - cell.y) * 0.9));
    let d = mix(sd_circle(p, 0.32), sd_box(p, vec2f(0.26)), k);

    let edge = smoothstep(0.012, 0.0, abs(d));
    let glow = smoothstep(0.25, 0.0, abs(d));
    let base = 0.5 + 0.5 * cos(6.2831 * (u.time * 0.05 + (cell.x * 0.13 + cell.y * 0.21) + vec3f(0.0, 0.33, 0.67)));
    var col = base * (0.12 + 0.5 * glow) + vec3f(0.9, 0.95, 1.0) * edge;
    // dim outside shapes, keep faint grid glow
    col = mix(vec3f(0.02, 0.03, 0.05), col, clamp(edge + glow, 0.0, 1.0));
    // vignette (edge0 < edge1: reversed smoothstep is undefined behavior in WGSL)
    col *= 1.0 - smoothstep(0.3, 0.95, distance(in.uv, vec2f(0.5)));
    return vec4f(col, 1.0);
}
