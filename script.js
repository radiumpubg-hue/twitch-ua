const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

window.onload = function() {
    // 1. Спроба дістати токен з URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Перевірка авторизації
    if (!accessToken) {
        document.getElementById('status').innerHTML = 'Будь ласка, <b>увійдіть через Twitch</b> для перегляду стрімів.';
    } else {
        loadTopStreams();
        loadUserProfile();
    }

    // Логіка кнопок навігації
    initNavigation();
};

async function loadTopStreams() {
    const statusEl = document.getElementById('status');
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 
                'Client-ID': CLIENT_ID, 
                'Authorization': `Bearer ${accessToken}` 
            }
        });

        if (res.status === 401) {
            localStorage.removeItem('twitch_access_token');
            statusEl.innerHTML = 'Сесія закінчилася. Авторизуйтесь знову.';
            return;
        }

        const data = await res.json();
        if (data.data && data.data.length > 0) {
            renderGrid(data.data, true);
        } else {
            statusEl.textContent = 'Зараз немає активних українських стрімів.';
        }
    } catch (e) {
        statusEl.textContent = 'Помилка завантаження даних. Перевірте з’єднання.';
        console.error(e);
    }
}

function initNavigation() {
    document.getElementById('show-main').onclick = () => {
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('hall-of-fame').style.display = 'none';
    };
    document.getElementById('show-hall').onclick = () => {
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('hall-of-fame').style.display = 'block';
        renderHall(); // Виклик функції рендеру залу слави (вона лишається без змін)
    };
    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };
}

// Функції renderGrid та renderHall залишаються як у попередній версії
