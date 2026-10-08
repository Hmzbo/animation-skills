// Plasma flow: layered sines + vignette. u.time in seconds, u.resolution in px.
// Contract: vs_main emits a fullscreen triangle; fs_main colors every pixel
// as a pure function of (uv, u.time). Same time => same pixels.
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

fn palette(t: f32) -> vec3f {
    // teal -> blue -> magenta cosine palette
    return 0.5 + 0.5 * cos(6.2831 * (t * vec3f(0.9, 0.7, 1.0) + vec3f(0.55, 0.45, 0.6)));
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
    let aspect = u.width / u.height;
    var p = vec2f(in.uv.x * aspect, in.uv.y);
    let t = u.time * 0.35;

    var v = sin(p.x * 3.0 + t * 2.0) + sin(p.y * 4.0 - t * 1.6);
    v += sin((p.x + p.y) * 2.5 + t * 1.2) * 0.7;
    v += sin(length(p - vec2f(aspect * 0.5, 0.5)) * 6.0 - t * 2.4) * 0.5;

    var col = palette(v * 0.12 + t * 0.08);
    // vignette (edge0 < edge1: reversed smoothstep is undefined behavior in WGSL)
    let d = distance(in.uv, vec2f(0.5));
    col *= 1.0 - smoothstep(0.25, 0.85, d);
    return vec4f(col, 1.0);
}
