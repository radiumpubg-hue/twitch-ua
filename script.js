const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; // Список тех, кто онлайн

window.onload = function() {
    const loginBtn = document.getElementById('login-btn');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const grid = document.getElementById('streamers-grid');

    loginBtn.onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        loginBtn.textContent = "Ви ввійшли ✅";
        loadInitialStreams(accessToken);
    } else {
        statusText.textContent = "Авторизуйтесь, щоб почати пошук";
    }

    // Загрузка топа онлайн стримеров (UA) при старте
    async function loadInitialStreams(token) {
        statusText.textContent = "Завантаження онлайн стрімерів...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            onlineStreams = data.data;
            render(onlineStreams);
        } catch (e) {
            statusText.textContent = "Помилка завантаження даних.";
        }
    }

    // Глобальный поиск (включая оффлайн)
    async function searchTwitch(query) {
        if (!query) {
            render(onlineStreams);
            return;
        }

        statusText.textContent = `Шукаємо: ${query}...`;
        try {
            const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=20`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            renderSearchResults(data.data);
        } catch (e) {
            console.error(e);
        }
    }

    // Поиск по вводу (с задержкой, чтобы не спамить API)
    let timeout = null;
    searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            searchTwitch(searchInput.value);
        }, 500);
    };

    // Отрисовка результатов поиска (онлайн + оффлайн)
    function renderSearchResults(channels) {
        grid.innerHTML = '';
        statusText.textContent = `Результати пошуку для "${searchInput.value}"`;

        channels.forEach(c => {
            const isLive = c.is_live;
            const card = document.createElement('div');
            card.className = 'card';
            if (!isLive) card.style.opacity = "0.6"; // Оффлайн каналы чуть прозрачные

            card.innerHTML = `
                <a href="https://twitch.tv/${c.broadcaster_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${c.thumbnail_url}" style="border-radius: 50%; width: 80px; height: 80px; margin: 15px auto; display: block; border: 3px solid ${isLive ? '#9146ff' : '#444'}">
                    <div class="info" style="text-align: center;">
                        <div class="name" style="font-size: 1.1em; color: white; font-weight: bold;">${c.display_name}</div>
                        <div style="font-size: 0.8em; margin-top: 5px;">${isLive ? '🔴 В ЕФІРІ' : '⚪ ОФЛАЙН'}</div>
                        ${isLive ? `<div class="viewers" style="color: #eb0400;">${c.game_name}</div>` : ''}
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    function render(streams) {
        grid.innerHTML = '';
        statusText.textContent = `Зараз в ефірі (UA): ${streams.length}`;
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb}">
                        <div class="info">
                            <div class="title">${s.title}</div>
                            <div class="name">${s.user_name} • ${s.game_name}</div>
                            <div class="viewers">🔴 ${s.viewer_count.toLocaleString()}</div>
                        </div>
                    </a>
                </div>`;
        });
    }
};
