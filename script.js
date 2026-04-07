const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; // Топ онлайн UA
let accessToken = null;

window.onload = function() {
    const loginBtn = document.getElementById('login-btn');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const grid = document.getElementById('streamers-grid');

    loginBtn.onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    accessToken = params.get('access_token');

    if (accessToken) {
        loginBtn.textContent = "Ви ввійшли ✅";
        loadInitialStreams();
    } else {
        statusText.textContent = "Авторизуйтесь, щоб почати пошук";
    }

    async function loadInitialStreams() {
        statusText.textContent = "Завантаження онлайн стрімерів...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            onlineStreams = data.data;
            render(onlineStreams);
        } catch (e) { statusText.textContent = "Помилка завантаження."; }
    }

    // ЛОГИКА ГЛОБАЛЬНОГО ПОИСКА И СОРТИРОВКИ
    async function searchTwitch(query) {
        if (!query) { render(onlineStreams); return; }

        statusText.textContent = `Шукаємо: ${query}...`;
        const cleanQuery = query.toLowerCase().trim();

        try {
            const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(cleanQuery)}&first=40`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            
            // --- СУПЕР-СОРТИРОВКА ---
            const sorted = data.data.sort((a, b) => {
                const nameA = a.broadcaster_login.toLowerCase();
                const nameB = b.broadcaster_login.toLowerCase();

                // 1. Приоритет точному совпадению
                if (nameA === cleanQuery) return -1;
                if (nameB === cleanQuery) return 1;

                // 2. Приоритет тем, кто Live
                if (a.is_live && !b.is_live) return -1;
                if (!a.is_live && b.is_live) return 1;

                // 3. (Опционально) Сортировка по дате стрима для оффлайн (тут пропустим)
                return 0;
            });

            renderSearchResults(sorted, cleanQuery);
        } catch (e) { console.error(e); }
    }

    // Задержка поиска
    let timeout = null;
    searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => searchTwitch(searchInput.value), 600);
    };

    function renderSearchResults(channels, cleanQuery) {
        grid.innerHTML = '';
        statusText.textContent = `Результати пошуку`;

        channels.forEach(c => {
            const isLive = c.is_live;
            const card = document.createElement('div');
            card.className = 'card';
            
            // Стилизация для точного совпадения (чтобы выделить его)
            if (c.broadcaster_login.toLowerCase() === cleanQuery) {
                card.style.border = "2px solid #FFE600"; // Желтая рамка
                card.style.boxShadow = "0 0 20px rgba(255, 230, 0, 0.4)";
            }
            if (!isLive) card.style.opacity = "0.6";

            card.innerHTML = `
                <a href="https://twitch.tv/${c.broadcaster_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${c.thumbnail_url}" style="border-radius: 50%; width: 80px; height: 80px; margin: 15px auto; display: block; border: 3px solid ${isLive ? '#9146ff' : '#444'}">
                    <div class="info" style="text-align: center;">
                        <div class="name" style="font-size: 1.1em; color: white; font-weight: bold;">${c.display_name}</div>
                        <div style="font-size: 0.8em; margin-top: 5px;">${isLive ? '🔴 В ЕФІРІ' : '⚪ ОФЛАЙН'}</div>
                        ${isLive ? `<div style="color: #adadb8; font-size:0.8em; margin-top:5px;">${c.game_name}</div>` : ''}
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
