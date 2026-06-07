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
    const colors = ["#ff4d6d", "#ff758f", "#ff8da1", "#ffb3c1", "#ffccd5", "#ff8da1"];

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
    
    // Hàm di chuyển nút "Không" ngẫu nhiên
    function moveNoButton() {
        const box = document.querySelector(".question-box");
        const boxRect = box.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();

        // Đảm bảo nút ở trạng thái absolute
        noBtn.classList.add("moving");

        // Phạm vi di chuyển tối đa trong hộp câu hỏi (tránh vượt ra viền ngoài)
        const maxX = boxRect.width - btnRect.width - 30;
        const maxY = boxRect.height - btnRect.height - 30;

        // Tính tọa độ ngẫu nhiên
        const randomX = Math.floor(Math.random() * maxX) + 15;
        const randomY = Math.floor(Math.random() * maxY) + 15;

        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;

        // Mỗi lần chạy trốn, sinh ra vài hạt trái tim lấp lánh trêu chọc dễ thương
        burstHearts(8, btnRect.left + btnRect.width/2, btnRect.top + btnRect.height/2);
    }

    // Trên Desktop: di chuyển khi rê chuột vào
    noBtn.addEventListener("mouseenter", moveNoButton);

    // Trên Điện thoại di động: di chuyển khi chạm màn hình hoặc click
    noBtn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Tránh kích hoạt click mặc định
        moveNoButton();
    }, { passive: false });

    noBtn.addEventListener("click", (e) => {
        e.preventDefault();
        moveNoButton();
    });

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
});
