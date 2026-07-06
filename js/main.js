let CONFIG = {
    wallpaper: {
        mode: 'carousel',  // 模式, 可选值: 默认壁纸(default)、轮播图(carousel)、在线壁纸(online)
        onlineUrl: '',  // 在线壁纸URL, 仅在mode为online时有效
        carouselUrls: ['https://t.alcy.cc/ycy'],  // 轮播图壁纸URL列表, 仅在mode为carousel时有效，可填入随机壁纸URL
        carouselInterval: 60 * 1000,  // 轮播图壁纸切换间隔, 单位毫秒, 默认60秒
    },
    hitokoto: {
        autoRefresh: {
            enabled: true,
            autoRefreshInterval: 1000 * 60,
        },
        // 一言句子类型
        types: {
            a: true,
            b: true,
            c: true,
            d: true,
            e: false,
            f: true,
            h: true,
            i: true,
            j: true,
            k: true,
            l: true,
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
    // 一言加载失败，使用备用句子
    const fallbackHitokotoItems = [
        {
            "hitokoto": "牛高达可不只是好看而已!",
            "type": "a",
            "from": "机动战士高达",
        },
        {
            "hitokoto": "温柔正确的人总是难以生存，因为这世界既不温柔，也不正确。",
            "type": "b",
            "from": "我的青春恋爱物语果然有问题",
        },
        {
            "hitokoto": "人，百年一世；龙，百年一岁。君生吾已老，君未变，而吾已老。",
            "type": "b",
            "from": "妖怪名单",
        },
        {
            "hitokoto": "好了 接下来就让你们见识一下程序员的本事",
            "type": "a",
            "from": "骑士与魔法",
        },
        {
            "hitokoto": "幻术世界有什么不好，现实太残酷，只会让这空洞越来越大。",
            "type": "b",
            "from": "火影忍者",
        },
        {
            "hitokoto": "我命令你，喜欢我！",
            "type": "b",
            "from": "加油大魔王",
        },
        {
            "hitokoto": "你愿意陪我走到地狱的底端吗？",
            "type": "a",
            "from": "魔法禁书目录",
        },
        {
            "hitokoto": "一直保持微笑是有诀窍的，那就是，在想哭的时候放声大哭。",
            "type": "a",
            "from": "天使领域",
        },
    ];

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
    let preloadedHitokoto = null;  // 预加载的一言数据
    let initialized = false;
    let paused = false;
    let hitokotoPending = false;
    let carouselPending = false;
    let _carouselPreload = null;
    let _carouselTick = null;
    let _carouselInterval = null;

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

    function updateHitokoto(data, isAuto) {
        if (isAuto === undefined) isAuto = true;
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
    }

    // 从 API 获取一言数据，返回 Promise<data>
    async function fetchHitokotoData() {
        var types = CONFIG.hitokoto.types;
        var typeKeys = Object.keys(types);
        var enabledTypes = [];
        for (var i = 0; i < typeKeys.length; i++) {
            if (types[typeKeys[i]]) {
                enabledTypes.push(typeKeys[i]);
            }
        }
        if (enabledTypes.length === 0) {
            enabledTypes = typeKeys;
            console.warn('一言: 未选择任何句子类型，使用全部类型');
        }

        var params = [];
        for (var j = 0; j < enabledTypes.length; j++) {
            params.push(['c', enabledTypes[j]]);
        }
        params.push(['encode', 'json']);

        const searchParams = new URLSearchParams(params);
        const baseApi = new URL('https://v1.hitokoto.cn/');
        baseApi.search = searchParams.toString();
        const res = await fetch(baseApi.toString());

        if (!res.ok) throw new Error('API 响应异常');

        return await res.json();
    }

    async function fetchHitokoto(isAuto) {
        if (isAuto === undefined) isAuto = false;
        try {
            if (!hitokotoEl.classList.contains('hidden') && !isAuto) {
                hitokotoEl.classList.add('loading');
            }

            const data = await fetchHitokotoData();
            updateHitokoto(data, isAuto);

        } catch (err) {
            console.warn('一言加载失败，使用备用句子', err);
            iziToast.error({
                position: 'topRight',
                title: 'ERROR',
                message: '一言加载失败，' + err.message,
                timeout: 10000,
            });

            const fallbackItem = fallbackHitokotoItems[Math.floor(Math.random() * fallbackHitokotoItems.length)];
            updateHitokoto(fallbackItem, isAuto);
        }
    }

    // 预加载下一句一言（不显示，仅缓存）
    async function preloadNextHitokoto() {
        try {
            preloadedHitokoto = await fetchHitokotoData();
            console.log('一言: 预加载完成');
        } catch (err) {
            console.warn('一言预加载失败，使用备用句子', err);
            const fallbackItem = fallbackHitokotoItems[Math.floor(Math.random() * fallbackHitokotoItems.length)];
            preloadedHitokoto = fallbackItem;
        }
    }

    function onHitokotoTick() {
        if (!CONFIG.hitokoto.autoRefresh.enabled) return;

        if (preloadedHitokoto) {
            updateHitokoto(preloadedHitokoto, true);
            preloadedHitokoto = null;
        }

        if (paused) {
            hitokotoPending = true;
            return;
        }

        preloadNextHitokoto();

        autoRefreshTimer = setTimeout(onHitokotoTick, CONFIG.hitokoto.autoRefresh.autoRefreshInterval);
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer !== null) {
            clearTimeout(autoRefreshTimer);
            autoRefreshTimer = null;
        }
        preloadedHitokoto = null;
    }

    function startAutoRefresh() {
        stopAutoRefresh();
        if (!CONFIG.hitokoto.autoRefresh.enabled) return;
        var interval = CONFIG.hitokoto.autoRefresh.autoRefreshInterval;
        if (interval <= 0) return;

        // 计时器开始 → 预加载下一句 → 计时器到时间 → 切换
        preloadNextHitokoto();
        autoRefreshTimer = setTimeout(onHitokotoTick, interval);
    }

    function resetAutoRefresh() {
        stopAutoRefresh();
        startAutoRefresh();
    }

    hitokotoWrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        resetAutoRefresh();
        fetchHitokoto(false);
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
            img.onload = function () {
                img.decode().then(function () { resolve(img); }).catch(function () { resolve(img); });
            };
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
            void wallpaperBg.offsetHeight;
            wallpaperBg.style.opacity = '1';
            console.log('在线壁纸已加载');
        }).catch(function (err) {
            console.warn('在线壁纸加载失败，使用默认壁纸', err);
            iziToast.error({
                position: 'topRight',
                title: 'ERROR',
                message: '在线壁纸加载失败，' + err.message,
                timeout: 10000,
            });
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
        carouselRunning = true;
        var preloadedImg = null;   // 预加载好的图片
        var nextIndex = 0;         // 下一个要预加载的图片索引

        function getCacheBustUrl(url) {
            var delim = url.indexOf('?') !== -1 ? '&' : '?';
            return url + delim + '_t=' + Date.now();
        }

        // 切换到预加载好的图片（crossfade）
        function switchToPreloaded() {
            if (!carouselRunning) return;
            if (!preloadedImg) return;

            crossfade(currentBg, preloadedImg.src).then(function (newBg) {
                currentBg = newBg;
            });
            preloadedImg = null;
        }

        // 预加载下一张图片
        function preloadNextImage() {
            if (!carouselRunning) return;
            var url = urls[nextIndex];
            var cacheBustUrl = getCacheBustUrl(url);

            preloadImage(cacheBustUrl).then(function (img) {
                preloadedImg = img;
                console.log('轮播: 预加载完成 [' + (nextIndex + 1) + '/' + urls.length + ']');
                nextIndex = (nextIndex + 1) % urls.length;
            }).catch(function (err) {
                console.warn('轮播: 预加载失败 [' + nextIndex + '] ' + url, err);
                nextIndex = (nextIndex + 1) % urls.length;
                // 重试预加载下一张
                preloadNextImage();
            });
        }

        function onCarouselTick() {
            if (!carouselRunning) return;

            switchToPreloaded();

            if (paused) {
                carouselPending = true;
                return;
            }

            preloadNextImage();

            carouselTimer = setTimeout(onCarouselTick, interval);
        }

        _carouselPreload = preloadNextImage;
        _carouselTick = onCarouselTick;
        _carouselInterval = interval;

        // ===== 第一次请求 =====
        var firstUrl = urls[0];
        var firstCacheBustUrl = getCacheBustUrl(firstUrl);

        preloadImage(firstCacheBustUrl).then(function (img) {
            if (!carouselRunning) return;

            // 显示第一张图片
            currentBg.style.backgroundImage = "url('" + img.src + "')";
            void currentBg.offsetHeight;
            currentBg.style.opacity = '1';
            console.log('轮播 [' + 1 + '/' + urls.length + ']');

            // 下一张从索引1开始预加载
            nextIndex = 1 % urls.length;

            // 计时器开始 → 预加载下一张
            preloadNextImage();
            carouselTimer = setTimeout(onCarouselTick, interval);
        }).catch(function (err) {
            console.warn('轮播: 第一张图片加载失败', err);
            iziToast.error({
                position: 'topRight',
                title: 'ERROR',
                message: '轮播首张图片加载失败，' + err.message,
                timeout: 10000,
            });
            wallpaperBg.style.opacity = '1';
            wallpaperBg.style.backgroundImage = '';
        });
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

            var needsHitokotoRefresh = false;
            var typePropKeys = Object.keys(CONFIG.hitokoto.types);
            for (var ti = 0; ti < typePropKeys.length; ti++) {
                var propName = 'hitokototype' + typePropKeys[ti];
                if (properties[propName] !== undefined) {
                    CONFIG.hitokoto.types[typePropKeys[ti]] = properties[propName].value;
                    needsHitokotoRestart = true;
                    needsHitokotoRefresh = true;
                }
            }

            if (!initialized) {
                initAll();
            } else {
                if (needsWallpaperRestart) startWallpaper();
                if (needsHitokotoRestart) resetAutoRefresh();
                if (needsUIScaleUpdate) applyUIScale();
                if (needsHitokotoRefresh) fetchHitokoto(true);
            }
        },
        setPaused: function(isPaused) {
            paused = isPaused;
            if (!isPaused) {
                if (hitokotoPending) {
                    hitokotoPending = false;
                    startAutoRefresh();
                }
                if (carouselPending) {
                    carouselPending = false;
                    if (_carouselPreload) _carouselPreload();
                    if (_carouselTick) carouselTimer = setTimeout(_carouselTick, _carouselInterval);
                }
            }
        }
    };

    setTimeout(function () { initAll(); }, 1000);

})();
