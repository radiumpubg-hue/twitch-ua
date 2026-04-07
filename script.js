const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.innerHTML = text;
    console.log("Status update:", text);
}

window.onload = function() {
    // 1. Обробка кнопок відразу
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
            window.location.href = authUrl;
        };
    }

    // 2. Перевірка токена в посиланні
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log("Токен отримано з URL");
    }

    // 3. Якщо токена немає зовсім
    if (!accessToken) {
        setStatus("<span style='color: #9146ff; font-size: 1.2rem;'>Привіт! Натисни кнопку 'Увійти через Twitch' зверху, щоб все запрацювало.</span>");
        return;
    }

    // 4. Завантаження даних
    loadStreams();
};

async function loadStreams() {
    setStatus("Завантаження стрімів...");
    try {
        const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=50', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('twitch_access_token');
            setStatus("Помилка: Сесія закінчилася. Натисніть 'Увійти' ще раз.");
            return;
        }

        if (!response.ok) {
            throw new Error(`Помилка сервера Twitch: ${response.status}`);
        }

        const data = await response.json();
        renderGrid(data.data);
    } catch (error) {
        console.error("Повна помилка:", error);
        setStatus(`Щось пішло не так: ${error.message}. Перевір інтернет або Client ID.`);
    }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!streams || streams.length === 0) {
        setStatus("На жаль, зараз ніхто з українців не стрімить.");
        return;
    }

    setStatus(`Знайдено стрімів: ${streams.length}`);

    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}" onerror="this.src='https://via.placeholder.com/400x225?text=Stream+Offline'">
                    <div class="info">
                        <b>${s.user_name}</b><br>
                        <small>${s.game_name || 'Без категорії'}</small><br>
                        <small>👥 ${s.viewer_count.toLocaleString()}</small>
                    </div>
                </a>
            </div>`;
    });
}
