let CONFIG = {
    wallpaper: {
        mode: 'carousel',
        onlineUrl: '',
        carouselUrls: ['https://t.alcy.cc/ycy'],
        carouselInterval: 60 * 1000,
    },
    hitokoto: {
        autoRefresh: {
            enabled: true,
            autoRefreshInterval: 1000 * 60,
        }
    },
    ui: {
        scale: 0.9,
    }
};

(function () {
    'use strict';

    const UIEl = document.getElementById('uiLayer');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const clockEl = document.getElementById('clock');
    const hitokotoEl = document.getElementById('hitokoto');
    const hitokotoText = document.getElementById('hitokotoText');
    const hitokotoFrom = document.getElementById('hitokotoFrom');
    const hitokotoWrapper = document.getElementById('hitokotoWrapper');
    const wallpaperBg = document.querySelector('.wallpaper-bg');

    VanillaTilt.init(clockEl, {
        max: 2,
        speed: 300,
        scale: 1.01,
        glare: true,
        'max-glare': 0.15,
        perspective: 1000,
    });
    VanillaTilt.init(hitokotoEl, {
        max: 2,
        speed: 300,
        scale: 1.01,
        glare: false,
        perspective: 1000,
    });

    let carouselRunning = false;
    let carouselTimer = null;
    let currentBg = wallpaperBg;
    let autoRefreshTimer = null;
    let initialized = false;

    function applyUIScale() {
        UIEl.style.transform = `scale(${CONFIG.ui.scale})`;
    }

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

    async function fetchHitokoto(isAuto) {
        if (isAuto === undefined) isAuto = false;
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
            const from = data.from ? '—— ' + data.from : '';

            hitokotoEl.classList.remove('loading', 'hidden');
            hitokotoText.textContent = text;
            hitokotoFrom.textContent = from;

            const enterClass = isAuto ? 'entering-auto' : 'entering';
            hitokotoEl.classList.add(enterClass);
            hitokotoEl.addEventListener('animationend', function onEnterEnd() {
                hitokotoEl.classList.remove(enterClass);
            }, { once: true });

            console.log('一言: "' + text + '"，' + from);
        } catch (err) {
            console.warn('一言加载失败，使用备用句子', err);
            hitokotoEl.classList.remove('loading', 'hidden');
            hitokotoText.textContent = '且听风吟，静待花开。';
            hitokotoFrom.textContent = '';
        }
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer !== null) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }

    function startAutoRefresh() {
        stopAutoRefresh();
        if (!CONFIG.hitokoto.autoRefresh.enabled) return;
        var interval = CONFIG.hitokoto.autoRefresh.autoRefreshInterval;
        if (interval <= 0) return;
        autoRefreshTimer = setInterval(function () { fetchHitokoto(true); }, interval);
    }

    function resetAutoRefresh() {
        stopAutoRefresh();
        startAutoRefresh();
    }

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

    var decorVisible = true;
    clockEl.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        var brushes = document.querySelectorAll('.art-brush, .clock-underline');
        decorVisible = !decorVisible;
        brushes.forEach(function (el) {
            el.style.transition = 'opacity 0.6s ease';
            el.style.opacity = decorVisible ? '' : '0';
        });
        clockEl.style.transition = 'transform 0.15s';
        clockEl.style.transform = 'scale(0.97)';
        setTimeout(function () {
            clockEl.style.transform = 'scale(1)';
        }, 150);
    });

    console.log('✦ 插画壁纸 · 悬浮时钟 ✦');
    console.log('📌 点击一言 → 刷新句子');
    console.log('📌 按 R 键 → 刷新一言');
    console.log('📌 双击时钟 → 切换装饰显示');

    function preloadImage(url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error('Failed to load image')); };
            img.src = url;
        });
    }

    function crossfade(fromEl, imgUrl) {
        return new Promise(function (resolve) {
            var nextBg = document.createElement('div');
            nextBg.className = 'wallpaper-bg';
            nextBg.style.backgroundImage = "url('" + imgUrl + "')";
            nextBg.style.opacity = '0';
            nextBg.style.zIndex = '1';
            nextBg.style.transition = 'none';

            fromEl.style.zIndex = '0';
            fromEl.parentNode.appendChild(nextBg);

            void nextBg.offsetHeight;

            nextBg.style.transition = '';
            nextBg.style.opacity = '1';
            fromEl.style.opacity = '0';

            var resolved = false;
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

    function resetWallpaperDOM() {
        var allBgs = document.querySelectorAll('.wallpaper > .wallpaper-bg');
        for (var i = allBgs.length - 1; i > 0; i--) {
            allBgs[i].remove();
        }
        currentBg = wallpaperBg;
        wallpaperBg.style.opacity = '1';
        wallpaperBg.style.backgroundImage = '';
        wallpaperBg.style.zIndex = '';
        wallpaperBg.style.transition = '';
    }

    function stopWallpaper() {
        carouselRunning = false;
        if (carouselTimer !== null) {
            clearTimeout(carouselTimer);
            carouselTimer = null;
        }
    }

    function startWallpaper() {
        stopWallpaper();
        var cfg = CONFIG.wallpaper;

        if (cfg.mode === 'default') {
            resetWallpaperDOM();
            return;
        }

        resetWallpaperDOM();
        wallpaperBg.style.backgroundImage = 'none';
        wallpaperBg.style.opacity = '0';

        if (cfg.mode === 'online') {
            startOnline(cfg);
            return;
        }

        if (cfg.mode === 'carousel') {
            startCarousel(cfg);
            return;
        }
    }

    function startOnline(cfg) {
        if (!cfg.onlineUrl) {
            console.warn('onlineUrl 为空，使用默认壁纸');
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
            return;
        }

        preloadImage(cfg.onlineUrl).then(function (img) {
            wallpaperBg.style.backgroundImage = "url('" + img.src + "')";
            wallpaperBg.style.opacity = '1';
            console.log('在线壁纸已加载');
        }).catch(function (err) {
            console.warn('在线壁纸加载失败，使用默认壁纸', err);
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
        });
    }

    function startCarousel(cfg) {
        var urls = cfg.carouselUrls;
        if (!urls || urls.length === 0) {
            console.warn('carouselUrls 为空，使用默认壁纸');
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
            return;
        }

        var interval = cfg.carouselInterval || 30000;
        currentBg = wallpaperBg;
        var index = 0;
        var firstLoad = true;
        carouselRunning = true;

        function nextSlide() {
            if (!carouselRunning) return;

            var delim = urls[index].indexOf('?') !== -1 ? '&' : '?';
            var cacheBustUrl = urls[index] + delim + '_t=' + Date.now();

            preloadImage(cacheBustUrl).then(function (img) {
                var handleResult = function () {
                    index = (index + 1) % urls.length;
                    if (carouselRunning) {
                        carouselTimer = setTimeout(nextSlide, interval);
                    }
                };

                if (firstLoad) {
                    currentBg.style.backgroundImage = "url('" + img.src + "')";
                    currentBg.style.opacity = '1';
                    firstLoad = false;
                    handleResult();
                } else {
                    crossfade(currentBg, img.src).then(function (newBg) {
                        currentBg = newBg;
                        handleResult();
                    });
                }

                console.log('轮播 [' + (index + 1) + '/' + urls.length + ']');
            }).catch(function (err) {
                console.warn('轮播: 图片加载失败 [' + index + '] ' + urls[index], err);
                index = (index + 1) % urls.length;
                if (carouselRunning) {
                    carouselTimer = setTimeout(nextSlide, interval);
                }
            });
        }

        nextSlide();
    }

    function initAll() {
        if (initialized) return;
        initialized = true;
        applyUIScale();
        startWallpaper();
        fetchHitokoto();
        startAutoRefresh();
    }

    // ====== wallpaperPropertyListener ======
    window.wallpaperPropertyListener = {
        applyUserProperties: function (properties) {
            var needsWallpaperRestart = false;
            var needsHitokotoRestart = false;
            var needsUIScaleUpdate = false;

            if (properties.wallpapermode) {
                CONFIG.wallpaper.mode = properties.wallpapermode.value;
                needsWallpaperRestart = true;
            }

            if (properties.onlineurl) {
                CONFIG.wallpaper.onlineUrl = properties.onlineurl.value;
                if (CONFIG.wallpaper.mode === 'online') {
                    needsWallpaperRestart = true;
                }
            }

            if (properties.carouselurls) {
                var raw = properties.carouselurls.value.trim();
                CONFIG.wallpaper.carouselUrls = raw
                    ? raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
                    : [];
                if (CONFIG.wallpaper.mode === 'carousel') {
                    needsWallpaperRestart = true;
                }
            }

            if (properties.carouselinterval) {
                var val = parseInt(properties.carouselinterval.value, 10);
                CONFIG.wallpaper.carouselInterval = (isNaN(val) || val <= 0) ? 60000 : val;
                if (CONFIG.wallpaper.mode === 'carousel') {
                    needsWallpaperRestart = true;
                }
            }

            if (properties.hitokotoautorefresh) {
                CONFIG.hitokoto.autoRefresh.enabled = properties.hitokotoautorefresh.value;
                needsHitokotoRestart = true;
            }

            if (properties.hitokotorefreshinterval) {
                var val2 = parseInt(properties.hitokotorefreshinterval.value, 10);
                CONFIG.hitokoto.autoRefresh.autoRefreshInterval = (isNaN(val2) || val2 <= 0) ? 60000 : val2;
                if (CONFIG.hitokoto.autoRefresh.enabled) {
                    needsHitokotoRestart = true;
                }
            }

            if (properties.uiscale) {
                CONFIG.ui.scale = properties.uiscale.value;
                needsUIScaleUpdate = true;
            }

            if (!initialized) {
                initAll();
            } else {
                if (needsWallpaperRestart) startWallpaper();
                if (needsHitokotoRestart) resetAutoRefresh();
                if (needsUIScaleUpdate) applyUIScale();
            }
        }
    };

    setTimeout(function () { initAll(); }, 1000);

})();
