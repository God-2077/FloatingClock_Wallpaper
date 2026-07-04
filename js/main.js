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
            hitokotoEl.classList.remove('loading');
            hitokotoText.textContent = '……';

            const res = await fetch('https://v1.hitokoto.cn/?c=d&c=k&c=h&c=i&c=j&encode=json');
            if (!res.ok) throw new Error('API 响应异常');

            const data = await res.json();
            const text = data.hitokoto || '生活明朗，万物可爱。';
            const from = data.from ? `—— ${data.from}` : '';

            hitokotoText.textContent = text;
            hitokotoFrom.textContent = from;

            hitokotoEl.style.transition = 'opacity 0.3s, transform 0.3s';
            hitokotoEl.style.opacity = '0.7';
            hitokotoEl.style.transform = 'scale(0.98)';
            requestAnimationFrame(() => {
                hitokotoEl.style.opacity = '1';
                hitokotoEl.style.transform = 'scale(1)';
            });

            // 打印一言到控制台
            console.log(`📌 一言: "${text}"，${from}`);

        } catch (err) {
            console.warn('一言加载失败，使用备用句子', err);
            hitokotoText.textContent = '且听风吟，静待花开。';
            hitokotoFrom.textContent = '';
            hitokotoEl.classList.remove('loading');
        }
    }

    fetchHitokoto();

    hitokotoWrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        hitokotoEl.style.transition = 'opacity 0.15s';
        hitokotoEl.style.opacity = '0.4';
        setTimeout(() => {
            fetchHitokoto();
        }, 180);
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
