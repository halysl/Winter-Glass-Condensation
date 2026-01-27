/* ============================================
   Winter Glass Condensation - Application Logic
   Handles canvas drawing, physics simulation, and UI interaction
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const frostCanvas = document.getElementById('frost-canvas');
    const dropletsCanvas = document.getElementById('droplets-canvas');
    const fCtx = frostCanvas.getContext('2d');
    const dCtx = dropletsCanvas.getContext('2d');

    const elements = {
        backgroundLayer: document.getElementById('background-layer'),
        backgroundImage: document.getElementById('background-image'),
        defaultScene: document.getElementById('default-scene'),
        controlPanel: document.getElementById('control-panel'),
        togglePanelBtn: document.getElementById('toggle-panel'),
        brushSizeInput: document.getElementById('brush-size'),
        brushValueDisplay: document.getElementById('brush-value'),
        fogDensityInput: document.getElementById('fog-density'),
        fogValueDisplay: document.getElementById('fog-value'),
        dropletsToggle: document.getElementById('enable-droplets'),
        frostToggle: document.getElementById('enable-frost'),
        uploadInput: document.getElementById('upload-image'),
        resetBtn: document.getElementById('reset-canvas'),
        downloadBtn: document.getElementById('download-image'),
        hintOverlay: document.getElementById('hint-overlay')
    };

    // --- State ---
    const state = {
        isDrawing: false,
        brushSize: 40,
        fogDensity: 0.7,
        dropletsEnabled: true,
        bgImageLoaded: false,
        lastX: 0,
        lastY: 0
    };

    // --- Physics / Particles ---
    let droplets = [];
    let animationFrameId;

    // --- Initialization ---
    function init() {
        resizeCanvases();
        resetFrostLayers(true);
        setupEventListeners();
        startDropletLoop();

        // Initial control values
        updateUIFromState();
    }

    function resizeCanvases() {
        frostCanvas.width = window.innerWidth;
        frostCanvas.height = window.innerHeight;
        dropletsCanvas.width = window.innerWidth;
        dropletsCanvas.height = window.innerHeight;

        // Re-apply frost after resize
        resetFrostLayers(false);
    }

    function updateUIFromState() {
        elements.brushValueDisplay.textContent = `${state.brushSize}px`;
        elements.fogValueDisplay.textContent = `${Math.round(state.fogDensity * 100)}%`;
        elements.dropletsToggle.checked = state.dropletsEnabled;
    }

    // --- Frost Logic ---
    function createNoisePattern(opacity) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base fill - much more opaque foundation
        // Use a higher base alpha so 100% density truly blocks the view
        const baseAlpha = opacity;
        ctx.fillStyle = `rgba(220, 230, 240, ${baseAlpha})`;
        ctx.fillRect(0, 0, 256, 256);

        // Add Noise
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Random variation
            const noise = (Math.random() - 0.5) * 20;

            // Add noise to RGB channels
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));

            // Varied Alpha for texture
            // Add noise to the alpha channel too, but keep it high
            const alphaNoise = (Math.random() - 0.5) * 50 * opacity;
            data[i + 3] = Math.max(0, Math.min(255, data[i + 3] + alphaNoise));
        }

        ctx.putImageData(imageData, 0, 0);
        return fCtx.createPattern(canvas, 'repeat');
    }

    let fogPattern = null;

    function resetFrostLayers(fullClear = false) {
        if (!fogPattern || fullClear) {
            fogPattern = createNoisePattern(state.fogDensity);
        }

        fCtx.globalCompositeOperation = 'source-over';
        fCtx.fillStyle = fogPattern;
        // Since it's a pattern, we need to fill properly. 
        // If we just fill over, it might darken. 
        // Clear first if resetting density.
        fCtx.clearRect(0, 0, frostCanvas.width, frostCanvas.height);
        fCtx.fillRect(0, 0, frostCanvas.width, frostCanvas.height);

        if (fullClear) {
            droplets = [];
            dCtx.clearRect(0, 0, dropletsCanvas.width, dropletsCanvas.height);
        }
    }

    function clearFrostAt(x, y, size) {
        fCtx.globalCompositeOperation = 'destination-out';
        fCtx.beginPath();
        fCtx.arc(x, y, size / 2, 0, Math.PI * 2);
        fCtx.fill();
    }

    // --- Droplet System ---
    class Droplet {
        constructor(x, y, size = null) {
            this.x = x;
            this.y = y;
            // Droplets formed by wiping are often larger
            this.size = size || (Math.random() * 4 + 2);
            this.speed = 0;
            this.acceleration = Math.random() * 0.05 + 0.02; // Gravity
            this.maxSpeed = Math.random() * 4 + 3;
            // Wobble for realistic fluid path
            this.wobblePhase = Math.random() * Math.PI * 2;
            this.wobbleSpeed = Math.random() * 0.1 + 0.05;
        }

        update() {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
            this.y += this.speed;

            // Sinusoidal movement
            this.x += Math.sin(this.y * 0.05 + this.wobblePhase) * 0.5;

            clearFrostAt(this.x, this.y, this.size * 2);

            // Shrink slowly as it leaves a trail
            if (Math.random() > 0.96) this.size -= 0.1;
        }

        draw(ctx) {
            // Main body
            ctx.fillStyle = 'rgba(230, 240, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Reflection/Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        isDead() {
            return this.y > dropletsCanvas.height + 20 || this.size <= 0.5;
        }
    }

    function startDropletLoop() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        function loop() {
            dCtx.clearRect(0, 0, dropletsCanvas.width, dropletsCanvas.height);

            for (let i = droplets.length - 1; i >= 0; i--) {
                const d = droplets[i];
                d.update();
                d.draw(dCtx);
                if (d.isDead()) {
                    droplets.splice(i, 1);
                }
            }

            // Random ambient condensation (very rare now)
            if (state.dropletsEnabled && Math.random() < 0.005) {
                const x = Math.random() * dropletsCanvas.width;
                droplets.push(new Droplet(x, -10));
            }

            animationFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    function extractCoordinate(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // State for droplet throttle
    let lastDropletTime = 0;
    const DROPLET_COOLDOWN = 300; // ms

    // --- Interaction Handlers ---
    function startDraw(e) {
        state.isDrawing = true;

        if (elements.hintOverlay && !elements.hintOverlay.classList.contains('hidden')) {
            elements.hintOverlay.classList.add('hidden');
        }

        const { x, y } = extractCoordinate(e);
        state.lastX = x;
        state.lastY = y;

        // Instant clear
        clearFrostAt(x, y, state.brushSize);
    }

    function moveDraw(e) {
        if (!state.isDrawing) return;
        const { x, y } = extractCoordinate(e);

        // Continuous erasing
        fCtx.globalCompositeOperation = 'destination-out';
        fCtx.lineWidth = state.brushSize;
        fCtx.lineCap = 'round';
        fCtx.lineJoin = 'round';
        fCtx.beginPath();
        fCtx.moveTo(state.lastX, state.lastY);
        fCtx.lineTo(x, y);
        fCtx.stroke();

        // --- Improved Droplet Logic ---
        // Generate droplets at the bottom edge of the stroke
        if (state.dropletsEnabled) {
            const now = Date.now();
            // Distance moved
            const dist = Math.hypot(x - state.lastX, y - state.lastY);

            // Generate much less frequently:
            // 1. Must move enough distance
            // 2. Cooldown timer
            // 3. Low random chance
            if (dist > 10 && (now - lastDropletTime > DROPLET_COOLDOWN) && Math.random() < 0.2) {

                // Calculate position at the bottom of the brush
                const jitter = (Math.random() - 0.5) * (state.brushSize * 0.8);
                const dropX = x + jitter;

                // Spawn slightly below the cursor
                const dropY = y + (state.brushSize * 0.4);

                // Varied sizes based on brush size
                const size = (Math.random() * 2 + 1) + (state.brushSize / 20);

                droplets.push(new Droplet(dropX, dropY, size));

                // Update timestamp with some randomness to avoid rhythmic dropping
                lastDropletTime = now + (Math.random() * 200);
            }
        }

        state.lastX = x;
        state.lastY = y;
    }

    function endDraw() {
        state.isDrawing = false;
        fCtx.beginPath(); // Reset path
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Window
        window.addEventListener('resize', () => {
            // Debounce could be added here
            resizeCanvases();
        });

        // Mouse
        window.addEventListener('mousedown', (e) => {
            if (e.target === frostCanvas) startDraw(e);
        });
        window.addEventListener('mousemove', moveDraw);
        window.addEventListener('mouseup', endDraw);

        // Touch
        window.addEventListener('touchstart', (e) => {
            if (e.target === frostCanvas) {
                e.preventDefault(); // Prevent scrolling
                startDraw(e);
            }
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            moveDraw(e);
        }, { passive: false });
        window.addEventListener('touchend', endDraw);

        // UI Panel Toggles
        elements.togglePanelBtn.addEventListener('click', () => {
            elements.controlPanel.classList.toggle('collapsed');
        });

        // Sliders
        elements.brushSizeInput.addEventListener('input', (e) => {
            state.brushSize = parseInt(e.target.value);
            elements.brushValueDisplay.textContent = `${state.brushSize}px`;
        });

        elements.fogDensityInput.addEventListener('input', (e) => {
            elements.fogValueDisplay.textContent = `${e.target.value}%`;
        });

        elements.fogDensityInput.addEventListener('change', (e) => {
            state.fogDensity = parseInt(e.target.value) / 100;
            elements.fogValueDisplay.textContent = `${e.target.value}%`;
            resetFrostLayers(); // Apply logic
        });

        // Toggles
        elements.dropletsToggle.addEventListener('change', (e) => {
            state.dropletsEnabled = e.target.checked;
        });

        elements.frostToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('frost-border-active');
            } else {
                document.body.classList.remove('frost-border-active');
            }
        });

        // Actions
        elements.resetBtn.addEventListener('click', () => {
            resetFrostLayers(true);
        });

        elements.uploadInput.addEventListener('change', handleImageUpload);
        elements.downloadBtn.addEventListener('click', handleDownload);
    }

    // --- Image Handling ---
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            elements.backgroundImage.onload = () => {
                elements.backgroundImage.classList.add('visible');
                document.body.classList.add('background-hidden');
                state.bgImageLoaded = true;
            };
            elements.backgroundImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleDownload() {
        // Create a temporary canvas to composite everything
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frostCanvas.width;
        tempCanvas.height = frostCanvas.height;
        const ctx = tempCanvas.getContext('2d');

        // 1. Draw Background
        if (state.bgImageLoaded && elements.backgroundImage.src) {
            // Simulate object-fit: cover
            const img = elements.backgroundImage;
            const sWidth = tempCanvas.width;
            const sHeight = tempCanvas.height;
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const screenRatio = sWidth / sHeight;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > screenRatio) {
                drawHeight = sHeight;
                drawWidth = imgRatio * sHeight;
                offsetX = (sWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = sWidth;
                drawHeight = sWidth / imgRatio;
                offsetX = 0;
                offsetY = (sHeight - drawHeight) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            // Draw default gradient if no image uploaded
            const grad = ctx.createLinearGradient(0, 0, 0, tempCanvas.height);
            grad.addColorStop(0, '#1a2f4a');
            grad.addColorStop(0.5, '#2c4a6b');
            grad.addColorStop(1, '#8fb4d2');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // 2. Draw Frost Layer
        ctx.drawImage(frostCanvas, 0, 0);

        // 3. Draw Droplets Layer
        ctx.drawImage(dropletsCanvas, 0, 0);

        // 4. Branding/Watermark (Optional)
        ctx.font = '20px "Cormorant Garamond"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.fillText('Winter Glass', tempCanvas.width - 20, tempCanvas.height - 20);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `winter-glass-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }

    // Run
    init();
});
