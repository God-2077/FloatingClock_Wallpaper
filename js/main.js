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

    VanillaTilt.init(clockEl, {
        max: 2,
        speed: 300,
        scale: 1.01,
        glare: true,
        'max-glare': 0.15,
        perspective: 1000,
    });

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

    async function fetchHitokoto() {
        try {
            if (!hitokotoEl.classList.contains('hidden')) {
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
            hitokotoEl.classList.add('entering');
            hitokotoEl.addEventListener('animationend', function onEnterEnd() {
                hitokotoEl.classList.remove('entering');
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

    hitokotoWrapper.addEventListener('click', function (e) {
        e.stopPropagation();
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

})();
