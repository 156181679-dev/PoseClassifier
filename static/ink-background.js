(function () {
    function startInkBackground() {
        const container = document.getElementById("webgl-container");
        if (!container || container.dataset.localInk === "true" || container.querySelector("canvas")) return;

        container.dataset.localInk = "true";
        if (window.THREE) {
            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.domElement.id = "inkCanvas";
            container.appendChild(renderer.domElement);

            const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `;

            const fragmentShader = `
                uniform float u_time;
                uniform vec2 u_resolution;
                varying vec2 vUv;

                vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
                    m = m * m;
                    m = m * m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
                    vec3 g;
                    g.x = a0.x * x0.x + h.x * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                float fbm(vec2 st) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 5; i++) {
                        value += amplitude * snoise(st);
                        st *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                void main() {
                    vec2 st = gl_FragCoord.xy / u_resolution.xy;
                    st.x *= u_resolution.x / u_resolution.y;
                    float time = u_time * 0.05;

                    vec2 q = vec2(0.0);
                    q.x = fbm(st + vec2(time));
                    q.y = fbm(st + vec2(1.0));

                    vec2 r = vec2(0.0);
                    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
                    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);

                    float f = fbm(st + r);
                    vec3 colorPaper = vec3(0.82, 0.80, 0.77);
                    vec3 colorSlate = vec3(0.54, 0.55, 0.53);
                    vec3 colorUmber = vec3(0.42, 0.36, 0.32);
                    vec3 colorMist = vec3(0.64, 0.68, 0.67);
                    vec3 colorWhite = vec3(0.92, 0.92, 0.90);

                    vec3 color = mix(colorPaper, colorMist, clamp((f * f) * 4.0, 0.0, 1.0));
                    color = mix(color, colorSlate, clamp(length(q), 0.0, 1.0));
                    color = mix(color, colorUmber, clamp(length(r.x), 0.0, 1.0) * 0.5);
                    color = mix(color, colorWhite, smoothstep(0.6, 1.0, f) * 0.8);
                    color += sin(st.y * 100.0) * 0.02;

                    gl_FragColor = vec4(color, 1.0);
                }
            `;

            const uniforms = {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) }
            };
            const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
            const geometry = new THREE.PlaneGeometry(2, 2);
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            const clock = new THREE.Clock();
            let animationFrameId = 0;
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                uniforms.u_time.value = clock.getElapsedTime();
                renderer.render(scene, camera);
            };
            animate();

            const resize = () => {
                const width = container.clientWidth;
                const height = container.clientHeight;
                renderer.setSize(width, height);
                uniforms.u_resolution.value.set(width, height);
            };
            window.addEventListener("resize", resize);
            window.addEventListener("pagehide", () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener("resize", resize);
                geometry.dispose();
                material.dispose();
                renderer.dispose();
            }, { once: true });
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.id = "inkCanvas";
        container.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        const layers = [
            { x: 0.18, y: 0.42, rx: 0.34, ry: 0.42, color: "rgba(126,139,136,0.34)", speed: 0.16 },
            { x: 0.45, y: 0.48, rx: 0.42, ry: 0.34, color: "rgba(94,91,83,0.28)", speed: 0.12 },
            { x: 0.76, y: 0.50, rx: 0.30, ry: 0.40, color: "rgba(119,87,66,0.16)", speed: 0.15 },
            { x: 0.58, y: 0.68, rx: 0.46, ry: 0.22, color: "rgba(220,219,211,0.36)", speed: 0.09 },
            { x: 0.35, y: 0.28, rx: 0.24, ry: 0.18, color: "rgba(190,196,190,0.24)", speed: 0.19 }
        ];

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawVein(width, height, time, offset, alpha) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(42,41,39,0.34)";
            ctx.beginPath();
            for (let i = 0; i <= 96; i += 1) {
                const p = i / 96;
                const x = width * p;
                const y = height * (
                    0.48
                    + Math.sin(p * 8.5 + time * 0.15 + offset) * 0.075
                    + Math.sin(p * 24 + offset) * 0.024
                );
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        resize();
        const started = performance.now();
        let animationFrameId = 0;

        function animate() {
            animationFrameId = requestAnimationFrame(animate);

            const width = container.clientWidth;
            const height = container.clientHeight;
            const time = (performance.now() - started) / 1000;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#d3d0c8";
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.filter = "blur(34px)";
            layers.forEach((layer, index) => {
                const driftX = Math.sin(time * layer.speed + index * 1.7) * width * 0.052;
                const driftY = Math.cos(time * layer.speed * 0.82 + index) * height * 0.046;
                ctx.beginPath();
                ctx.ellipse(
                    width * layer.x + driftX,
                    height * layer.y + driftY,
                    width * layer.rx,
                    height * layer.ry,
                    Math.sin(time * 0.05 + index) * 0.24,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = layer.color;
                ctx.fill();
            });
            ctx.restore();

            drawVein(width, height, time, 0, 0.15);
            drawVein(width, height * 0.88, time, 2.4, 0.09);
            drawVein(width, height * 1.08, time, 4.9, 0.08);

            ctx.save();
            ctx.globalAlpha = 0.07;
            ctx.fillStyle = "rgba(42,41,39,0.56)";
            for (let y = 0; y < height; y += 7) {
                ctx.fillRect(0, y, width, 1);
            }
            ctx.restore();
        }

        animate();
        window.addEventListener("resize", resize);
        window.addEventListener("pagehide", () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
        }, { once: true });
    }

    window.startInkBackground = startInkBackground;
    if (document.getElementById("webgl-container")) {
        startInkBackground();
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startInkBackground, { once: true });
    } else {
        startInkBackground();
    }
}());
