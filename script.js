document.addEventListener("DOMContentLoaded", () => {
    const img          = document.getElementById("myImage");
    const wordEl       = document.getElementById("wordPlaceholder");
    const prevBtn      = document.getElementById("prevBtn");
    const nextBtn      = document.getElementById("nextBtn");
    const pauseBtn     = document.getElementById("pauseBtn");
    const shuffleBtn   = document.getElementById("shuffleBtn");
    const fullscreenBtn= document.getElementById("fullscreenBtn");
    const newWordBtn   = document.getElementById("newWordBtn");
    const currentIdx   = document.getElementById("currentIndex");
    const totalCount   = document.getElementById("totalCount");
    const timerBar     = document.getElementById("timerBar");

    let imageList = [];
    let words     = [];
    let index     = 0;
    let paused    = false;
    let timer     = null;
    const INTERVAL = 60000; // 60 seconds
    let timerStart = 0;
    let timerRAF   = null;

    // ── Shuffle helper ──
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Display image with fade transition ──
    function showImage(i) {
        index = ((i % imageList.length) + imageList.length) % imageList.length;
        img.classList.add("fade-out");
        setTimeout(() => {
            img.src = imageList[index];
            img.onload = () => img.classList.remove("fade-out");
            // In case image is cached and onload fires sync
            if (img.complete) img.classList.remove("fade-out");
        }, 250);
        currentIdx.textContent = index + 1;
        resetTimer();
    }

    // ── Timer & progress bar ──
    function resetTimer() {
        clearTimeout(timer);
        cancelAnimationFrame(timerRAF);
        if (paused) {
            timerBar.style.width = "0%";
            return;
        }
        timerStart = performance.now();
        timerBar.classList.add("no-transition");
        timerBar.style.width = "0%";
        // Force reflow
        void timerBar.offsetWidth;
        timerBar.classList.remove("no-transition");
        animateBar();
        timer = setTimeout(() => showImage(index + 1), INTERVAL);
    }

    function animateBar() {
        const elapsed = performance.now() - timerStart;
        const pct = Math.min(100, (elapsed / INTERVAL) * 100);
        timerBar.style.width = pct + "%";
        if (pct < 100 && !paused) {
            timerRAF = requestAnimationFrame(animateBar);
        }
    }

    // ── Word of the Day ──
    function showRandomWord() {
        if (!words.length) return;
        const w = words[Math.floor(Math.random() * words.length)];
        wordEl.textContent = w;
    }

    // ── Controls ──
    prevBtn.addEventListener("click", () => showImage(index - 1));
    nextBtn.addEventListener("click", () => showImage(index + 1));

    pauseBtn.addEventListener("click", () => {
        paused = !paused;
        pauseBtn.textContent = paused ? "▶" : "❚❚";
        pauseBtn.classList.toggle("active", paused);
        if (paused) {
            clearTimeout(timer);
            cancelAnimationFrame(timerRAF);
        } else {
            resetTimer();
        }
    });

    shuffleBtn.addEventListener("click", () => {
        imageList = shuffle(imageList);
        index = 0;
        showImage(0);
        shuffleBtn.classList.add("active");
        setTimeout(() => shuffleBtn.classList.remove("active"), 600);
    });

    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    newWordBtn.addEventListener("click", showRandomWord);

    // ── Keyboard navigation ──
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "ArrowLeft":  showImage(index - 1); break;
            case "ArrowRight": showImage(index + 1); break;
            case " ":
                e.preventDefault();
                pauseBtn.click();
                break;
            case "f": case "F":
                fullscreenBtn.click();
                break;
        }
    });

    // ── Touch swipe support ──
    let touchStartX = 0;
    document.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    document.addEventListener("touchend", (e) => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 60) {
            diff > 0 ? showImage(index - 1) : showImage(index + 1);
        }
    }, { passive: true });

    // ── Init: fetch data ──
    fetch("get_images.php")
        .then(r => r.json())
        .then(list => {
            imageList = shuffle(list);
            totalCount.textContent = imageList.length;
            showImage(0);
        })
        .catch(err => console.error("Error fetching images:", err));

    fetch("dictionary.txt")
        .then(r => r.text())
        .then(text => {
            words = text.split("\n").filter(w => w.trim());
            showRandomWord();
        })
        .catch(err => console.error("Error fetching words:", err));
});
