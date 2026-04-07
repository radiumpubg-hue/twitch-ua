const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

window.onload = function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('access_token')) {
        accessToken = params.get('access_token');
        localStorage.setItem('twitch_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken) {
        loadTopStreams();
        loadUserProfile();
    } else {
        document.getElementById('status').innerHTML = "Натисніть <b>'Увійти через Twitch'</b>";
    }

    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };

    document.getElementById('show-main').onclick = () => {
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('hall-of-fame').style.display = 'none';
    };

    document.getElementById('show-hall').onclick = () => {
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('hall-of-fame').style.display = 'block';
        renderHall();
    };

    // Пошук онлайн + офлайн стрімерів
    let searchTimer;
    document.getElementById('search-input').oninput = (e) => {
        clearTimeout(searchTimer);
        const query = e.target.value.trim();
        if (query.length < 2) return;
        searchTimer = setTimeout(() => searchChannels(query), 500);
    };
};

async function loadTopStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        renderGrid(data.data, true);
    } catch (e) { console.error(e); }
}

async function searchChannels(query) {
    document.getElementById('status').textContent = "Шукаємо канали...";
    try {
        const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=50`, {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        renderGrid(data.data, false);
    } catch (e) { console.error(e); }
}

function renderGrid(channels, isLiveOnly) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    document.getElementById('status').textContent = isLiveOnly ? `Зараз в ефірі (UA): ${channels.length}` : "Результати пошуку:";

    channels.forEach(c => {
        const isLive = isLiveOnly ? true : c.is_live;
        const login = c.user_login || c.broadcaster_login;
        const name = c.user_name || c.display_name;
        const thumb = isLiveOnly ? c.thumbnail_url.replace('{width}', '440').replace('{height}', '248') : c.thumbnail_url;

        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb || 'https://via.placeholder.com/440x248?text=Offline'}">
                    <span class="badge ${isLive ? 'badge-live' : 'badge-offline'}">${isLive ? 'LIVE' : 'OFFLINE'}</span>
                    <div class="info">
                        <b>${name}</b>
                        <small>${c.game_name || 'Не вказано'}</small>
                    </div>
                </a>
            </div>`;
    });
}

// Зал слави (скорочено для стабільності)
function renderHall() {
    const hall = document.getElementById('hall-content');
    hall.innerHTML = '<h2 class="hall-title">🏆 LEGENDS OF UA TWITCH 🏆</h2><p style="text-align:center;">Тут будуть твої переможці з картинками!</p>';
}

async function loadUserProfile() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/users', { headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` } });
        const data = await res.json();
        if (data.data[0]) document.getElementById('auth-container').innerHTML = `<img src="${data.data[0].profile_image_url}" width="35" style="border-radius:50%; border:2px solid #9146ff;">`;
    } catch (e) {}
}
