/* ==========================================================================
   ROMANTIC LOVE LANDING PAGE - SCRIPT.JS (THEME: HELLO KITTY & SWEET PINK)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // 1. DATE CONFIGURATION (LOVE START DATE)
    // ==========================================================================
    // Mặc định chọn ngày 20/10/2024 (Ngày Phụ nữ Việt Nam - cột mốc kỷ niệm đẹp)
    // Thùy Linh & Bạn có thể tùy chỉnh ngày này theo ý muốn
    const START_DATE = new Date("2024-02-14T00:00:00");

    // ==========================================================================
    // 2. DOM ELEMENTS & CONSTANTS
    // ==========================================================================
    const introScreen = document.getElementById("intro-screen");
    const openEnvelopeBtn = document.getElementById("open-envelope-btn");
    const envelopeWrapper = document.querySelector(".envelope-wrapper");
    const mainContent = document.getElementById("main-content");

    // Music elements
    const bgMusic = document.getElementById("bg-music");
    const playPauseBtn = document.getElementById("play-pause-btn");
    const volumeBtn = document.getElementById("music-volume-btn");
    const playIcon = document.getElementById("play-icon");
    const pauseIcon = document.getElementById("pause-icon");
    const volumeUpIcon = document.getElementById("volume-up-icon");
    const volumeOffIcon = document.getElementById("volume-off-icon");
    const vinylDisc = document.getElementById("vinyl-disc");
    const musicPlayer = document.getElementById("draggable-player");

    // Love Clock elements
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    // Letter elements
    const letterSection = document.querySelector(".letter-section");
    const typingArea = document.getElementById("typing-text-area");
    const typingCursor = document.getElementById("typing-cursor");

    // Question Game elements
    const yesBtn = document.getElementById("yes-btn");
    const noBtn = document.getElementById("no-btn");
    const successModal = document.getElementById("success-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");

    // State Variables
    let isMusicPlaying = false;
    let isMuted = false;
    let isSynthActive = false; // flag to determine if we are using the synthesized audio fallback
    let typingStarted = false;

    // ==========================================================================
    // 3. INTRO ENVELOPE OPENING & MUSIC START
    // ==========================================================================
    openEnvelopeBtn.addEventListener("click", () => {
        // Mở phong bì thư (chạy animation CSS)
        envelopeWrapper.classList.add("open");

        // Đợi 1.2s cho thư trượt lên hết, sau đó ẩn màn hình chào và hiện màn hình chính
        setTimeout(() => {
            introScreen.classList.add("fade-out");
            mainContent.classList.remove("hidden");
            
            // Kích hoạt hiển thị màn hình chính mượt mà
            setTimeout(() => {
                mainContent.classList.add("fade-in");
                // Khởi tạo kích thước canvas
                resizeCanvas();
            }, 100);

            // Bắt đầu phát nhạc
            startAudio();
        }, 1200);
    });

    // ==========================================================================
    // 4. MUSIC CONTROLLER (AUDIO TAG & WEB AUDIO API FALLBACK SYNTHESIZER)
    // ==========================================================================
    
    // Music Box Synth code
    let audioCtx = null;
    let synthInterval = null;
    let currentNoteIndex = 0;
    
    // Bản nhạc "Mariage d'Amour" / Giai điệu lãng mạn nhẹ nhàng
    const melody = [
        ['E', 5], ['G', 5], ['C', 6], ['E', 6],
        ['D', 5], ['G', 5], ['B', 5], ['D', 6],
        ['C', 5], ['E', 5], ['A', 5], ['C', 6],
        ['F', 5], ['A', 5], ['C', 6], ['F', 6],
        ['E', 6], ['C', 6], ['G', 5], ['E', 5],
        ['D', 6], ['B', 5], ['G', 5], ['D', 5],
        ['C', 6], ['A', 5], ['E', 5], ['C', 5],
        ['A', 5], ['C', 6], ['F', 6], ['A', 6]
    ];
    
    const noteFreqs = {
        'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88
    };

    function getFreq(note, octave) {
        const baseFreq = noteFreqs[note];
        return baseFreq * Math.pow(2, octave - 4);
    }

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSynthNote(freq, startTime, duration) {
        if (!audioCtx || isMuted) return;
        
        // Tạo Oscillator (Bộ dao động phát tiếng) và GainNode (Bộ tăng giảm âm lượng)
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Âm thanh dạng sóng sine trong trẻo như tiếng hộp nhạc (music box)
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Attack cực nhanh, Decay kéo dài tạo độ vang ngân chuông
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.01); // Âm lượng vừa phải dịu tai
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.05);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    function startSynthMelody() {
        initAudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        isSynthActive = true;
        const tempo = 130; // Nhịp độ bài hát (130 nhịp/phút)
        const noteDuration = 60 / tempo; // Thời gian mỗi nốt
        
        let nextNoteTime = audioCtx.currentTime;
        
        synthInterval = setInterval(() => {
            if (!isMusicPlaying) return;
            
            // Lên lịch phát nốt nhạc tiếp theo
            if (audioCtx.currentTime + 0.1 > nextNoteTime) {
                const noteInfo = melody[currentNoteIndex];
                const freq = getFreq(noteInfo[0], noteInfo[1]);
                
                playSynthNote(freq, nextNoteTime, noteDuration * 1.8);
                
                nextNoteTime += noteDuration;
                currentNoteIndex = (currentNoteIndex + 1) % melody.length;
            }
        }, 50);
    }

    function stopSynthMelody() {
        if (synthInterval) {
            clearInterval(synthInterval);
            synthInterval = null;
        }
        isSynthActive = false;
    }

    function startAudio() {
        isMusicPlaying = true;
        updateMusicUI();
        
        // Cố gắng phát nhạc từ thẻ audio MP3 trước
        bgMusic.play()
            .then(() => {
                console.log("Phát nhạc MP3 thành công!");
            })
            .catch(err => {
                console.warn("Không phát được MP3 (có thể lỗi mạng). Chuyển sang phát Hộp nhạc Synth tự động...");
                // Nếu bị lỗi mạng hoặc file không tải được, kích hoạt Hộp Nhạc Web Audio siêu đỉnh
                startSynthMelody();
            });
    }

    function togglePlay() {
        if (isMusicPlaying) {
            isMusicPlaying = false;
            bgMusic.pause();
            if (isSynthActive) {
                stopSynthMelody();
            }
        } else {
            isMusicPlaying = true;
            initAudioContext();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            if (isSynthActive) {
                startSynthMelody();
            } else {
                bgMusic.play().catch(() => {
                    startSynthMelody();
                });
            }
        }
        updateMusicUI();
    }

    function toggleMute() {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        
        if (isMuted) {
            volumeUpIcon.classList.add("hidden");
            volumeOffIcon.classList.remove("hidden");
        } else {
            volumeUpIcon.classList.remove("hidden");
            volumeOffIcon.classList.add("hidden");
        }
    }

    function updateMusicUI() {
        if (isMusicPlaying) {
            playIcon.classList.add("hidden");
            pauseIcon.classList.remove("hidden");
            musicPlayer.classList.add("playing");
        } else {
            playIcon.classList.remove("hidden");
            pauseIcon.classList.add("hidden");
            musicPlayer.classList.remove("playing");
        }
    }

    playPauseBtn.addEventListener("click", togglePlay);
    volumeBtn.addEventListener("click", toggleMute);

    // Xử lý kéo thả nhẹ nhàng trình phát nhạc trên PC/Mobile
    let isDragging = false;
    let startX, startY, initialX, initialY;

    musicPlayer.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    musicPlayer.addEventListener("touchstart", dragStart, { passive: true });
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("touchend", dragEnd);

    function dragStart(e) {
        if (e.target.closest('.control-btn')) return; // Không drag khi bấm nút điều khiển
        isDragging = true;
        
        const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
        
        const rect = musicPlayer.getBoundingClientRect();
        startX = clientX;
        startY = clientY;
        initialX = rect.left;
        initialY = rect.top;
    }

    function drag(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        
        const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        let newX = initialX + dx;
        let newY = initialY + dy;
        
        // Giới hạn trong màn hình
        const wWidth = window.innerWidth;
        const wHeight = window.innerHeight;
        const pRect = musicPlayer.getBoundingClientRect();
        
        newX = Math.max(10, Math.min(newX, wWidth - pRect.width - 10));
        newY = Math.max(10, Math.min(newY, wHeight - pRect.height - 10));
        
        musicPlayer.style.left = `${newX}px`;
        musicPlayer.style.top = `${newY}px`;
        musicPlayer.style.right = 'auto'; // Hủy neo bên phải ban đầu
    }

    function dragEnd() {
        isDragging = false;
    }

    // ==========================================================================
    // 5. LOVE COUNTER LOGIC
    // ==========================================================================
    function updateLoveClock() {
        const now = new Date();
        const diffMs = now - START_DATE;

        if (diffMs < 0) {
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        const msPerSecond = 1000;
        const msPerMinute = msPerSecond * 60;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;

        const days = Math.floor(diffMs / msPerDay);
        const hours = Math.floor((diffMs % msPerDay) / msPerHour);
        const minutes = Math.floor((diffMs % msPerHour) / msPerMinute);
        const seconds = Math.floor((diffMs % msPerMinute) / msPerSecond);

        // Định dạng thêm số 0 phía trước nếu số bé hơn 10
        daysEl.innerText = days.toString().padStart(2, "0");
        hoursEl.innerText = hours.toString().padStart(2, "0");
        minutesEl.innerText = minutes.toString().padStart(2, "0");
        secondsEl.innerText = seconds.toString().padStart(2, "0");
    }

    // Cập nhật đồng hồ mỗi giây
    updateLoveClock();
    setInterval(updateLoveClock, 1000);

    // ==========================================================================
    // 6. CANVAS FLOATING HEARTS & PARTICLES ON MOUSEMOVE
    // ==========================================================================
    const canvas = document.getElementById("hearts-canvas");
    const ctx = canvas.getContext("2d");
    
    let hearts = [];
    let particles = [];
    let petals = [];
    const colors = ["#ff4d6d", "#ff758f", "#ff8da1", "#ffb3c1", "#ffccd5", "#ff8da1"];
    const petalColors = ["#ffd6e0", "#ffc2d4", "#ffb3c8", "#ffe0ec", "#ffc8dd"];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener("resize", resizeCanvas);

    class Heart {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height; // Vị trí ngẫu nhiên ban đầu
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 12 + 8; // Kích thước trái tim
            this.speed = Math.random() * 1.2 + 0.6; // Tốc độ bay lên
            this.opacity = Math.random() * 0.5 + 0.2; // Độ mờ
            this.swing = Math.random() * 2 + 1; // Độ lắc qua lại
            this.swingSpeed = Math.random() * 0.02 + 0.01;
            this.angle = Math.random() * Math.PI * 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.y -= this.speed;
            this.angle += this.swingSpeed;
            this.x += Math.sin(this.angle) * (this.swing * 0.3);

            if (this.y < -30) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            
            const x = this.x;
            const y = this.y;
            const size = this.size;
            
            // Hàm vẽ hình trái tim chuẩn trên canvas
            ctx.moveTo(x, y + size / 4);
            ctx.quadraticCurveTo(x, y, x + size / 2, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
            ctx.quadraticCurveTo(x + size, y + size * 2/3, x, y + size);
            ctx.quadraticCurveTo(x - size, y + size * 2/3, x - size, y + size / 3);
            ctx.quadraticCurveTo(x - size, y, x - size / 2, y);
            ctx.quadraticCurveTo(x, y, x, y + size / 4);
            
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * -2 - 0.5; // Bay nhẹ lên trên
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = 1;
            this.decay = Math.random() * 0.02 + 0.015;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.opacity -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            
            const x = this.x;
            const y = this.y;
            const size = this.size;
            
            // Vẽ hạt hình tròn nhỏ lấp lánh hoặc hình thoi
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // Cánh hoa rơi nhẹ nhàng (sakura) bay xuống, đung đưa qua lại
    class Petal {
        constructor() { this.reset(true); }

        reset(initial) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? Math.random() * canvas.height : -20 - Math.random() * 60;
            this.size = Math.random() * 7 + 6;
            this.speedY = Math.random() * 0.9 + 0.5;
            this.swayAmp = Math.random() * 1.6 + 0.6;
            this.swayAngle = Math.random() * Math.PI * 2;
            this.swaySpeed = Math.random() * 0.02 + 0.01;
            this.spin = Math.random() * 0.04 - 0.02;
            this.angle = Math.random() * Math.PI * 2;
            this.opacity = Math.random() * 0.4 + 0.45;
            this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
        }

        update() {
            this.y += this.speedY;
            this.swayAngle += this.swaySpeed;
            this.x += Math.sin(this.swayAngle) * this.swayAmp * 0.5;
            this.angle += this.spin;
            if (this.y > canvas.height + 30) this.reset(false);
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            // Hình cánh hoa (2 đường cong bezier tạo dáng giọt mềm)
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.bezierCurveTo(this.size * 0.7, -this.size * 0.6, this.size * 0.6, this.size * 0.6, 0, this.size);
            ctx.bezierCurveTo(-this.size * 0.6, this.size * 0.6, -this.size * 0.7, -this.size * 0.6, 0, -this.size);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function initPetals() {
        const count = Math.min(28, Math.floor(window.innerWidth / 45));
        for (let i = 0; i < count; i++) petals.push(new Petal());
    }

    // Khởi tạo các trái tim nền
    function initHearts() {
        const heartCount = Math.min(45, Math.floor(window.innerWidth / 30));
        for (let i = 0; i < heartCount; i++) {
            hearts.push(new Heart());
        }
    }

    // Tạo hiệu ứng lấp lánh khi di chuyển chuột
    document.addEventListener("mousemove", (e) => {
        // Chỉ sinh hạt khi trang đã mở phong bì thư
        if (mainContent.classList.contains("hidden")) return;
        
        if (Math.random() < 0.25) { // Tần suất vừa phải để không lag
            particles.push(new Particle(e.clientX, e.clientY));
        }
    });

    // Touch support cho điện thoại di động
    document.addEventListener("touchmove", (e) => {
        if (mainContent.classList.contains("hidden")) return;
        if (Math.random() < 0.25) {
            const touch = e.touches[0];
            particles.push(new Particle(touch.clientX, touch.clientY));
        }
    }, { passive: true });

    function burstHearts(count, x, y) {
        for (let i = 0; i < count; i++) {
            const p = new Particle(x, y);
            p.speedX = (Math.random() - 0.5) * 8;
            // Phun tung tóe lên trên
            p.speedY = (Math.random() * -6) - 2;
            p.size = Math.random() * 7 + 4;
            p.decay = Math.random() * 0.01 + 0.008;
            particles.push(p);
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ trái tim nền bay lên
        for (let i = 0; i < hearts.length; i++) {
            hearts[i].update();
            hearts[i].draw();
        }

        // Vẽ cánh hoa rơi nhẹ nhàng
        for (let i = 0; i < petals.length; i++) {
            petals[i].update();
            petals[i].draw();
        }

        // Vẽ các hạt nhấp nháy từ chuột
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].opacity <= 0) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    initHearts();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        initPetals();
    }
    animate();

    // ==========================================================================
    // 7. TYPEWRITER EFFECT FOR LOVE LETTER
    // ==========================================================================
    const letterText = `Gửi Trần Nguyễn Thuỳ Linh - công chúa nhỏ của anh... 🎀

Trong thế giới bao la này, anh cảm thấy mình là người may mắn nhất vì đã tìm thấy em. Em là cô gái đáng yêu nhất, bướng bỉnh nhưng lại vô cùng ấm áp, người mà anh luôn muốn cưng chiều và bảo vệ mỗi ngày.

Anh thích cách em cười, thích những lúc em hờn dỗi, và cả niềm đam mê Hello Kitty vô cùng dễ thương của em nữa. Mỗi ngày trôi qua, tình yêu anh dành cho em lại lớn hơn một chút.

Cảm ơn Linh vì đã đến bên anh, cùng anh chia sẻ những niềm vui và nỗi buồn trong cuộc sống. Hãy luôn tin tưởng anh và nắm chặt tay anh trên con đường phía trước em nhé!

Anh yêu em nhiều hơn cả những gì anh có thể viết ra... 💖`;

    let charIndex = 0;
    const typingSpeed = 55; // Tốc độ gõ chữ (ms/ký tự)

    function typeWriter() {
        if (charIndex < letterText.length) {
            const char = letterText.charAt(charIndex);
            
            if (char === "\n") {
                typingArea.innerHTML += "<br>";
            } else {
                typingArea.innerHTML += char;
            }
            
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            // Sau khi gõ xong, ẩn con trỏ nhấp nháy
            typingCursor.style.display = "none";
        }
    }

    // Kích hoạt hiệu ứng gõ chữ khi cuộn màn hình đến phần bức thư tình
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.25 // Bắt đầu gõ khi thấy 25% bức thư trên viewport
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !typingStarted) {
                typingStarted = true;
                setTimeout(typeWriter, 500); // Đợi 500ms trước khi bắt đầu gõ
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(letterSection);

    // ==========================================================================
    // 8. INTERACTIVE QUESTION "RUNAWAY" BUTTON LOGIC
    // ==========================================================================
    
    const questionBox = document.querySelector(".question-box");

    // Né con trỏ: nút "Không" nhảy thẳng tới GÓC XA CON TRỎ NHẤT trong vùng hộp câu hỏi.
    // Dùng toạ độ màn hình (position: fixed) nên không lệch, và luôn nằm trong tầm nhìn.
    function dodgeNoButton(pointerX, pointerY) {
        const box = questionBox.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();
        const bw = btnRect.width;
        const bh = btnRect.height;

        // QUAN TRỌNG: gắn nút thẳng vào <body> để thoát khỏi thẻ kính
        // (backdrop-filter + transform + overflow:hidden) — nếu không, position:fixed
        // sẽ bị thẻ kính "giam" và cắt mất. Ra ngoài body thì fixed = toạ độ màn hình thật.
        if (noBtn.parentElement !== document.body) {
            document.body.appendChild(noBtn);
        }

        // Chuyển nút sang định vị fixed theo màn hình
        noBtn.classList.add("moving");

        // Vùng cho phép (toạ độ màn hình): trải rộng theo bề ngang hộp, ở dải phía dưới
        // -> nút có thể nhảy sang tận mép trái/phải, thật xa con trỏ, mà không che tiêu đề.
        const margin = 14;
        const left0 = box.left + margin;
        const left1 = Math.max(left0, box.right - bw - margin);
        const top0 = box.top + box.height * 0.42;
        const top1 = Math.max(top0, box.bottom - bh - margin);

        // Tâm con trỏ (nếu là chạm/không có con trỏ thì lấy tâm nút hiện tại)
        const px = (typeof pointerX === "number") ? pointerX : btnRect.left + bw / 2;
        const py = (typeof pointerY === "number") ? pointerY : btnRect.top + bh / 2;

        // Chọn góc XA con trỏ nhất trong 4 góc của vùng -> luôn nhảy ra thật xa
        const corners = [
            [left0, top0], [left1, top0],
            [left0, top1], [left1, top1]
        ];
        let target = corners[0];
        let bestDist = -1;
        for (const [cx, cy] of corners) {
            const d = Math.hypot(cx + bw / 2 - px, cy + bh / 2 - py);
            if (d > bestDist) { bestDist = d; target = [cx, cy]; }
        }

        // Kéo nhẹ về phía giữa một chút cho tự nhiên (không cứng nhắc dính góc)
        const midX = (left0 + left1) / 2;
        const midY = (top0 + top1) / 2;
        let newLeft = target[0] + (midX - target[0]) * Math.random() * 0.4;
        let newTop = target[1] + (midY - target[1]) * Math.random() * 0.4;

        // Kẹp trong vùng an toàn (luôn thấy được)
        newLeft = Math.max(left0, Math.min(newLeft, left1));
        newTop = Math.max(top0, Math.min(newTop, top1));

        noBtn.style.left = `${newLeft}px`;
        noBtn.style.top = `${newTop}px`;

        // Trêu chọc: thi thoảng bắn vài hạt trái tim tại chỗ nút vừa rời đi
        if (Math.random() < 0.4) burstHearts(5, btnRect.left + bw / 2, btnRect.top + bh / 2);
    }

    // Desktop: né NGAY khi con trỏ lại gần (chưa cần chạm vào) -> không thể bấm
    const DODGE_RADIUS = 140; // bán kính cảnh giác quanh nút (px)
    document.addEventListener("mousemove", (e) => {
        if (mainContent.classList.contains("hidden")) return;
        const r = noBtn.getBoundingClientRect();
        if (!r.width) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // Chỉ né khi nút đang nằm trong khung nhìn (tránh chạy mất trước khi cuộn tới)
        if (cy < 0 || cy > window.innerHeight) return;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (d < DODGE_RADIUS) dodgeNoButton(e.clientX, e.clientY);
    });

    // Phòng hờ: nếu con trỏ vẫn chạm tới thì né tiếp và chặn click
    noBtn.addEventListener("mouseenter", (e) => dodgeNoButton(e.clientX, e.clientY));

    // Điện thoại: chạm là nhảy đi, không cho bấm
    noBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        dodgeNoButton();
    }, { passive: false });

    noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        dodgeNoButton();
    });

    // Khi nút đã "thoát ra" body (fixed), ẩn nó nếu mục câu hỏi không còn trong tầm nhìn
    // -> tránh nút lơ lửng giữa màn hình lúc cuộn qua mục khác.
    if ("IntersectionObserver" in window) {
        const qVisObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (noBtn.classList.contains("moving")) {
                    noBtn.style.visibility = entry.isIntersecting ? "visible" : "hidden";
                }
            });
        }, { threshold: 0.02 });
        qVisObserver.observe(questionBox);
    }

    // ==========================================================================
    // 9. CELEBRATION MODAL & CONFETTI CELEBRATION
    // ==========================================================================
    yesBtn.addEventListener("click", (e) => {
        // Hiện Modal Chúc mừng
        successModal.classList.remove("hidden");
        
        // Bắn tung tóe pháo hoa trái tim liên tục từ vị trí nút đồng ý
        const rect = yesBtn.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        
        // Bắn 3 đợt pháo hoa liên tiếp
        burstHearts(80, startX, startY);
        setTimeout(() => burstHearts(60, window.innerWidth / 3, window.innerHeight / 2), 300);
        setTimeout(() => burstHearts(60, window.innerWidth * 2 / 3, window.innerHeight / 2), 600);
        
        // Phát một tiếng ting dễ thương bằng synth nếu âm thanh được bật
        playCelebrationSound();
    });

    function playCelebrationSound() {
        if (!audioCtx || isMuted) return;
        
        const now = audioCtx.currentTime;
        // Tiếng chime arpeggio kép vui vẻ
        playSynthNote(523.25, now, 0.15); // C5
        playSynthNote(659.25, now + 0.1, 0.15); // E5
        playSynthNote(783.99, now + 0.2, 0.15); // G5
        playSynthNote(1046.50, now + 0.3, 0.4); // C6
    }

    closeModalBtn.addEventListener("click", () => {
        // Ẩn modal chúc mừng
        successModal.classList.add("hidden");

        // Tạo thêm một cơn mưa trái tim lấp lánh nhẹ nhàng
        burstHearts(40, window.innerWidth / 2, window.innerHeight / 2);
    });

    // ==========================================================================
    // 10. SCROLL REVEAL (Các phần nội dung hiện ra mượt mà khi cuộn tới)
    // ==========================================================================
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target); // Chỉ chạy 1 lần cho mỗi phần tử
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

        revealEls.forEach(el => revealObserver.observe(el));
    } else {
        // Trình duyệt quá cũ thì hiện luôn, không ẩn
        revealEls.forEach(el => el.classList.add("is-visible"));
    }

    // ==========================================================================
    // 11. PHOTO LIGHTBOX (Bấm vào ảnh polaroid để xem phóng to + lướt qua lại)
    // ==========================================================================
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxClose = document.getElementById("lightbox-close");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");
    // Gồm cả polaroid lẫn ảnh trong dải film -> bấm tấm nào cũng phóng to được
    const polaroidCards = Array.from(document.querySelectorAll(".polaroid-card, .film-frame"));

    // Thu thập dữ liệu ảnh + lời chú thích từ từng tấm
    const galleryItems = polaroidCards.map(card => {
        const img = card.querySelector("img");
        const cap = card.querySelector(".photo-caption");
        return {
            src: img ? img.getAttribute("src") : "",
            alt: img ? img.getAttribute("alt") : "",
            caption: cap ? cap.textContent.trim() : (img ? img.getAttribute("alt") : "")
        };
    });

    let currentLightboxIndex = 0;

    function showLightboxImage(index) {
        // Cho phép lướt vòng tròn (qua ảnh cuối thì quay về ảnh đầu)
        const total = galleryItems.length;
        currentLightboxIndex = (index + total) % total;
        const item = galleryItems[currentLightboxIndex];
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxCaption.textContent = item.caption;
    }

    function openLightbox(index) {
        showLightboxImage(index);
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden"; // Khoá cuộn nền khi đang xem ảnh
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    polaroidCards.forEach((card, i) => {
        card.addEventListener("click", () => openLightbox(i));
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxPrev.addEventListener("click", () => showLightboxImage(currentLightboxIndex - 1));
    lightboxNext.addEventListener("click", () => showLightboxImage(currentLightboxIndex + 1));

    // Bấm ra vùng nền tối để đóng
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Điều khiển bằng bàn phím: Esc đóng, mũi tên trái/phải để lướt
    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") showLightboxImage(currentLightboxIndex - 1);
        else if (e.key === "ArrowRight") showLightboxImage(currentLightboxIndex + 1);
    });

    // ==========================================================================
    // 12. RẢI ẢNH NGẪU NHIÊN (tự nhiên, thoải mái như scrapbook thật)
    //    Mỗi lần mở trang, mỗi tấm có góc nghiêng + băng dính lệch + màu băng khác nhau.
    // ==========================================================================
    function scatterPhotos() {
        const tapeColors = [
            "rgba(255, 182, 193, 0.62)", // hồng phấn
            "rgba(255, 209, 102, 0.55)", // vàng kem
            "rgba(214, 184, 255, 0.52)", // tím lavender
            "rgba(255, 159, 191, 0.55)", // hồng đào
            "rgba(178, 223, 219, 0.5)"   // xanh mint nhạt
        ];
        const rand = (min, max) => Math.random() * (max - min) + min;

        document.querySelectorAll(".polaroid-card").forEach((card) => {
            // Góc nghiêng -5°..+5° (qua biến --tilt để hover vẫn về thẳng được)
            card.style.setProperty("--tilt", `${rand(-5, 5).toFixed(2)}deg`);

            const tape = card.querySelector(".tape");
            if (tape) {
                tape.style.transform = `translateX(-50%) rotate(${rand(-9, 9).toFixed(1)}deg)`;
                tape.style.backgroundColor = tapeColors[Math.floor(Math.random() * tapeColors.length)];
                // Lệch ngang một chút cho tự nhiên
                tape.style.left = `${rand(38, 62).toFixed(0)}%`;
            }
        });

        // Ảnh thả góc (scrapbook) bồng bềnh lệch pha nhau cho sống động
        document.querySelectorAll(".photo-float").forEach((pf) => {
            pf.style.animationDelay = `${rand(0, 2.5).toFixed(2)}s`;
            pf.style.animationDuration = `${rand(5.5, 7.5).toFixed(2)}s`;
        });

        // Ảnh ở mục thư & câu hỏi: gim XEN KẼ trái/phải (zigzag) cho tự nhiên như gim ảnh thật.
        // Bắt đầu lệch bên nào thì ngẫu nhiên, nhưng sau đó luôn so le: trái -> phải -> trái...
        const startLeft = Math.random() < 0.5;
        document.querySelectorAll(".split-layout > .photo-float").forEach((pf, i) => {
            const leanLeft = startLeft ? (i % 2 === 0) : (i % 2 === 1);
            pf.classList.remove("pin-left", "pin-right");
            pf.classList.add(leanLeft ? "pin-left" : "pin-right");
            // Nghiêng theo đúng hướng lệch cho giống ảnh được gim hờ một góc
            const card = pf.querySelector(".polaroid-card");
            if (card) {
                const deg = (leanLeft ? -1 : 1) * rand(3, 7);
                card.style.setProperty("--tilt", `${deg.toFixed(2)}deg`);
            }
        });
    }
    scatterPhotos();

    // ==========================================================================
    // 13. HIỆU ỨNG NGHIÊNG 3D THEO CON TRỎ (interactive 3D tilt)
    //    Di chuột lên ảnh/thẻ -> nó nghiêng theo con trỏ tạo chiều sâu 3D.
    // ==========================================================================
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    function setupTilt(els, maxAngle, scale) {
        els.forEach((el) => {
            el.addEventListener("mousemove", (e) => {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transition = "transform 0.08s linear";
                el.style.transform =
                    `perspective(800px) rotateX(${(-py * maxAngle).toFixed(2)}deg) ` +
                    `rotateY(${(px * maxAngle).toFixed(2)}deg) scale(${scale})`;
                el.style.zIndex = "130";
                // Tạm dừng bồng bềnh của ảnh thả góc để không bị giật khi đang nghiêng
                const pf = el.closest(".photo-float");
                if (pf) pf.style.animationPlayState = "paused";
            });
            el.addEventListener("mouseleave", () => {
                el.style.transition = "transform 0.55s var(--ease-soft)";
                el.style.transform = "";
                el.style.zIndex = "";
                const pf = el.closest(".photo-float");
                if (pf) pf.style.animationPlayState = "";
            });
        });
    }

    if (!reduceMotion && canHover) {
        setupTilt(document.querySelectorAll(".polaroid-card"), 16, 1.06);
        setupTilt(document.querySelectorAll(".clock-card"), 18, 1.05);
        setupTilt(document.querySelectorAll(".film-strip"), 10, 1.03);
        setupTilt(document.querySelectorAll(".letter-box, .question-box"), 5, 1.0);
    }
});
