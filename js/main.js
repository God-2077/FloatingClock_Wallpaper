const CONFIG = {
    wallpaper: {
        mode: 'carousel',          // 'default' | 'online' | 'carousel'
        onlineUrl: '',            // mode='online' 时填写
        carouselUrls: ['https://t.alcy.cc/ycy'],         // mode='carousel' 时填写
        carouselInterval: 60 * 1000,  // 轮播间隔(ms)
    },
    hitokoto: {
        autoRefreshInterval: 1000 * 60,
    }
};

(function () {
    'use strict';

    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const clockEl = document.getElementById('clock');
    const hitokotoEl = document.getElementById('hitokoto');
    const hitokotoText = document.getElementById('hitokotoText');
    const hitokotoFrom = document.getElementById('hitokotoFrom');
    const hitokotoWrapper = document.getElementById('hitokotoWrapper');

    const AUTO_REFRESH_INTERVAL = CONFIG.hitokoto.autoRefreshInterval;

    const VanillaTiltConfig = {
        max: 2,
        speed: 300,
        scale: 1.01,
        glare: true,
        'max-glare': 0.15,
        perspective: 1000,
    }

    VanillaTilt.init(clockEl, VanillaTiltConfig);
    VanillaTilt.init(hitokotoEl, VanillaTiltConfig);

    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        hoursEl.textContent = h;
        minutesEl.textContent = m;
        secondsEl.textContent = s;
    }

    updateClock();
    setInterval(updateClock, 1000);

    async function fetchHitokoto(isAuto = false) {
        try {
            if (!hitokotoEl.classList.contains('hidden') && !isAuto) {
                hitokotoEl.classList.add('loading');
            }

            const params = [
                ['c', 'a'],
                ['c', 'b'],
                ['c', 'c'],
                ['c', 'd'],
                ['c', 'f'],
                ['c', 'h'],
                ['c', 'i'],
                ['c', 'j'],
                ['c', 'k'],
                ['c', 'l'],
                ['encode', 'json']
            ];

            const searchParams = new URLSearchParams(params);

            const baseApi = new URL('https://v1.hitokoto.cn/');
            baseApi.search = searchParams.toString();

            const res = await fetch(baseApi.toString());

            if (!res.ok) throw new Error('API 响应异常');

            const data = await res.json();
            const text = data.hitokoto || '生活明朗，万物可爱。';
            const from = data.from ? `—— ${data.from}` : '';

            hitokotoEl.classList.remove('loading', 'hidden');
            hitokotoText.textContent = text;
            hitokotoFrom.textContent = from;

            const enterClass = isAuto ? 'entering-auto' : 'entering';
            hitokotoEl.classList.add(enterClass);
            hitokotoEl.addEventListener('animationend', function onEnterEnd() {
                hitokotoEl.classList.remove(enterClass);
            }, { once: true });

            console.log(`一言: "${text}"，${from}`);

        } catch (err) {
            console.warn('一言加载失败，使用备用句子', err);
            hitokotoEl.classList.remove('loading', 'hidden');
            hitokotoText.textContent = '且听风吟，静待花开。';
            hitokotoFrom.textContent = '';
        }
    }

    fetchHitokoto();

    let autoTimer = null;

    function startAutoRefresh() {
        if (AUTO_REFRESH_INTERVAL <= 0) return;
        autoTimer = setInterval(() => fetchHitokoto(true), AUTO_REFRESH_INTERVAL);
    }

    function resetAutoRefresh() {
        if (autoTimer !== null) {
            clearInterval(autoTimer);
            startAutoRefresh();
        }
    }

    startAutoRefresh();

    hitokotoWrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        resetAutoRefresh();
        fetchHitokoto();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                hitokotoWrapper.click();
            }
        }
    });

    let decorVisible = true;
    clockEl.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        const brushes = document.querySelectorAll('.art-brush, .clock-underline');
        decorVisible = !decorVisible;
        brushes.forEach(el => {
            el.style.transition = 'opacity 0.6s ease';
            el.style.opacity = decorVisible ? '' : '0';
        });
        clockEl.style.transition = 'transform 0.15s';
        clockEl.style.transform = 'scale(0.97)';
        setTimeout(() => {
            clockEl.style.transform = 'scale(1)';
        }, 150);
    });

    console.log('✦ 插画壁纸 · 悬浮时钟 ✦');
    console.log('📌 点击一言 → 刷新句子');
    console.log('📌 按 R 键 → 刷新一言');
    console.log('📌 双击时钟 → 切换装饰显示');

    const wallpaperBg = document.querySelector('.wallpaper-bg');

    function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
    }

    function crossfade(fromEl, imgUrl) {
        return new Promise(resolve => {
            const nextBg = document.createElement('div');
            nextBg.className = 'wallpaper-bg';
            nextBg.style.backgroundImage = `url('${imgUrl}')`;
            nextBg.style.opacity = '0';
            nextBg.style.zIndex = '1';
            nextBg.style.transition = 'none';

            fromEl.style.zIndex = '0';
            fromEl.parentNode.appendChild(nextBg);

            void nextBg.offsetHeight;

            nextBg.style.transition = '';
            nextBg.style.opacity = '1';
            fromEl.style.opacity = '0';

            let resolved = false;
            function done() {
                if (resolved) return;
                resolved = true;
                fromEl.remove();
                resolve(nextBg);
            }

            nextBg.addEventListener('transitionend', function (e) {
                if (e.propertyName === 'opacity') done();
            });

            setTimeout(done, 1200);
        });
    }

    function initWallpaper() {
        const cfg = CONFIG.wallpaper;

        if (cfg.mode === 'default') return;

        wallpaperBg.style.backgroundImage = 'none';
        wallpaperBg.style.opacity = '0';

        if (cfg.mode === 'online') {
            initOnline(cfg);
            return;
        }

        if (cfg.mode === 'carousel') {
            initCarousel(cfg);
            return;
        }
    }

    async function initOnline(cfg) {
        if (!cfg.onlineUrl) {
            console.warn('onlineUrl 为空，使用默认壁纸');
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
            return;
        }

        try {
            const img = await preloadImage(cfg.onlineUrl);
            wallpaperBg.style.backgroundImage = `url('${img.src}')`;
            wallpaperBg.style.opacity = '1';
            console.log('在线壁纸已加载');
        } catch (err) {
            console.warn('在线壁纸加载失败，使用默认壁纸', err);
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
        }
    }

    async function initCarousel(cfg) {
        const urls = cfg.carouselUrls;
        if (!urls || urls.length === 0) {
            console.warn('carouselUrls 为空，使用默认壁纸');
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
            return;
        }

        const interval = cfg.carouselInterval || 30000;
        let currentBg = wallpaperBg;
        let index = 0;
        let firstLoad = true;

        while (true) {
            try {
                const delim = urls[index].includes('?') ? '&' : '?';
                const cacheBustUrl = urls[index] + delim + '_t=' + Date.now(); // 绕过图片缓存
                const img = await preloadImage(cacheBustUrl);

                if (firstLoad) {
                    currentBg.style.backgroundImage = `url('${img.src}')`;
                    currentBg.style.opacity = '1';
                    firstLoad = false;
                } else {
                    currentBg = await crossfade(currentBg, img.src);
                }

                console.log(`轮播 [${index + 1}/${urls.length}]`);
            } catch (err) {
                console.warn(`轮播: 图片加载失败 [${index}] ${urls[index]}`, err);
            }

            index = (index + 1) % urls.length;
            await new Promise(r => setTimeout(r, interval));
        }
    }

    initWallpaper();

})();
