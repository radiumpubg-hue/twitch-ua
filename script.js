const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

// Функція для відображення статусу
function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.innerHTML = text;
}

window.onload = function() {
    console.log("Скрипт завантажено");
    
    // Перевіряємо токен в URL
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    
    if (token) {
        accessToken = token;
        localStorage.setItem('twitch_access_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Логіка кнопок
    document.getElementById('login-btn').onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    if (!accessToken) {
        setStatus("Потрібна авторизація. Натисніть кнопку <b>'Увійти через Twitch'</b>.");
        return;
    }

    loadStreams();
};

async function loadStreams() {
    try {
        const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=50', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error("Помилка API: " + response.status);

        const data = await response.json();
        renderGrid(data.data);
    } catch (error) {
        console.error(error);
        setStatus("Не вдалося завантажити дані. Спробуйте оновити сторінку або зайти пізніше.");
    }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    
    if (streams.length === 0) {
        setStatus("Зараз немає активних UA стрімів.");
        return;
    }

    setStatus(`Зараз в ефірі (UA): ${streams.length}`);

    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}" alt="${s.user_name}">
                    <div class="info">
                        <b>${s.user_name}</b><br>
                        <small>${s.game_name}</small><br>
                        <small>👥 ${s.viewer_count}</small>
                    </div>
                </a>
            </div>`;
    });
}
