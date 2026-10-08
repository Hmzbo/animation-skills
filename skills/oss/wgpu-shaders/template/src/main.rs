// Headless WGSL frame renderer: fullscreen triangle + time uniform -> PNGs.
// Usage: cargo run -- --shader plasma.wgsl --frames 60 [--fps 60] [--width 1280] [--height 720] [--out frames]
use std::path::PathBuf;

#[repr(C)]
#[derive(Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct Params {
    time: f32,
    width: f32,
    height: f32,
    _pad: f32,
}

fn arg(name: &str, default_: &str) -> String {
    let args: Vec<String> = std::env::args().collect();
    for w in args.windows(2) {
        if w[0] == format!("--{name}") {
            return w[1].clone();
        }
    }
    default_.to_string()
}

fn main() {
    let shader_path = arg("shader", "scene.wgsl");
    let frames: u32 = arg("frames", "60").parse().expect("--frames N");
    let fps: f32 = arg("fps", "60").parse().expect("--fps F");
    let (width, height): (u32, u32) = (
        arg("width", "1280").parse().expect("--width W"),
        arg("height", "720").parse().expect("--height H"),
    );
    let out = PathBuf::from(arg("out", "frames"));
    std::fs::create_dir_all(&out).expect("create out dir");

    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle());
    let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
        power_preference: wgpu::PowerPreference::HighPerformance,
        compatible_surface: None,
        force_fallback_adapter: false,
        apply_limit_buckets: false,
    }))
    .expect("no usable GPU adapter (see troubleshooting: headless/CI)");
    println!("adapter: {} ({:?})", adapter.get_info().name, adapter.get_info().backend);
    let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor::default()))
        .expect("request_device failed");

    let wgsl = std::fs::read_to_string(&shader_path).expect("read shader");
    let module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some("scene"),
        source: wgpu::ShaderSource::Wgsl(wgsl.into()),
    });

    let params = Params { time: 0.0, width: width as f32, height: height as f32, _pad: 0.0 };
    let uniform = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("params"),
        size: std::mem::size_of::<Params>() as u64,
        usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });
    let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("params layout"),
        entries: &[wgpu::BindGroupLayoutEntry {
            binding: 0,
            visibility: wgpu::ShaderStages::FRAGMENT,
            ty: wgpu::BindingType::Buffer {
                ty: wgpu::BufferBindingType::Uniform,
                has_dynamic_offset: false,
                min_binding_size: None,
            },
            count: None,
        }],
    });
    let bg = device.create_bind_group(&wgpu::BindGroupDescriptor {
        label: Some("params"),
        layout: &bgl,
        entries: &[wgpu::BindGroupEntry {
            binding: 0,
            resource: uniform.as_entire_binding(),
        }],
    });

    let format = wgpu::TextureFormat::Rgba8Unorm;
    let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
        label: Some("shadertoy"),
        layout: Some(&device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: None,
            bind_group_layouts: &[Some(&bgl)],
            immediate_size: 0,
        })),
        vertex: wgpu::VertexState {
            module: &module,
            entry_point: Some("vs_main"),
            buffers: &[],
            compilation_options: Default::default(),
        },
        fragment: Some(wgpu::FragmentState {
            module: &module,
            entry_point: Some("fs_main"),
            targets: &[Some(wgpu::ColorTargetState {
                format,
                blend: Some(wgpu::BlendState::REPLACE),
                write_mask: wgpu::ColorWrites::ALL,
            })],
            compilation_options: Default::default(),
        }),
        primitive: Default::default(),
        depth_stencil: None,
        multisample: Default::default(),
        multiview_mask: None,
        cache: None,
    });

    let texture = device.create_texture(&wgpu::TextureDescriptor {
        label: Some("frame"),
        size: wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
        mip_level_count: 1,
        sample_count: 1,
        dimension: wgpu::TextureDimension::D2,
        format,
        usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::COPY_SRC,
        view_formats: &[],
    });
    let view = texture.create_view(&Default::default());

    let row_bytes = width * 4;
    let padded = row_bytes.div_ceil(wgpu::COPY_BYTES_PER_ROW_ALIGNMENT) * wgpu::COPY_BYTES_PER_ROW_ALIGNMENT;
    let readback = device.create_buffer(&wgpu::BufferDescriptor {
        label: Some("readback"),
        size: (padded * height) as u64,
        usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });

    let scope = device.push_error_scope(wgpu::ErrorFilter::Validation);
    for i in 0..frames {
        let t = i as f32 / fps;
        let params = Params { time: t, ..params };
        queue.write_buffer(&uniform, 0, bytemuck::bytes_of(&params));

        let mut encoder = device.create_command_encoder(&Default::default());
        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("frame"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color::BLACK),
                        store: wgpu::StoreOp::Store,
                    },
                    depth_slice: None,
                })],
                depth_stencil_attachment: None,
                occlusion_query_set: None,
                timestamp_writes: None,
                multiview_mask: None,
            });
            pass.set_pipeline(&pipeline);
            pass.set_bind_group(0, &bg, &[]);
            pass.draw(0..3, 0..1);
        }
        encoder.copy_texture_to_buffer(
            wgpu::TexelCopyTextureInfo {
                texture: &texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::TexelCopyBufferInfo {
                buffer: &readback,
                layout: wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(padded),
                    rows_per_image: Some(height),
                },
            },
            wgpu::Extent3d { width, height, depth_or_array_layers: 1 },
        );
        queue.submit(std::iter::once(encoder.finish()));
        readback.slice(..).map_async(wgpu::MapMode::Read, |_| {});
        instance.poll_all(true);

        let mut png = Vec::with_capacity((row_bytes * height) as usize);
        {
            let mapped = readback.slice(..).get_mapped_range().expect("buffer mapped");
            for row in 0..height as usize {
                let s = row * padded as usize;
                png.extend_from_slice(&mapped[s..s + row_bytes as usize]);
            }
        }
        readback.unmap();
        image::RgbaImage::from_raw(width, height, png)
            .expect("image buffer")
            .save(out.join(format!("{i:06}.png")))
            .expect("save png");
        if i % 60 == 0 {
            println!("frame {i}/{frames}");
        }
    }
    if let Some(err) = pollster::block_on(scope.pop()) {
        eprintln!("VALIDATION ERROR: {err:?}");
    }
    println!("render complete: {frames} frames in {}", out.display());
}

