// Starter scene: calm vertical gradient breathing slowly.
// Replace with your piece. Contract: fs_main is a pure function of (uv, time).
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

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
    let breathe = 0.5 + 0.5 * sin(u.time * 0.8);
    var col = mix(vec3f(0.03, 0.05, 0.09), vec3f(0.08, 0.35, 0.38), in.uv.y);
    col *= 0.85 + 0.15 * breathe;
    return vec4f(col, 1.0);
}
