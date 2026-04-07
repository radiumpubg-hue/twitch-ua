const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; 
let accessToken = null;

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
    accessToken = params.get('access_token');

    if (accessToken) {
        loginBtn.textContent = "Ви ввійшли ✅";
        loadInitialStreams();
    } else {
        statusText.textContent = "Авторизуйтесь через Twitch";
    }

    async function loadInitialStreams() {
        statusText.textContent = "Завантаження онлайн стрімерів...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            onlineStreams = data.data;
            applyFilters();
        } catch (e) { statusText.textContent = "Помилка завантаження."; }
    }

    async function getFollowerCount(broadcasterId) {
        try {
            const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            return data.total || 0;
        } catch (e) { return 0; }
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            searchTwitch(query);
        } else {
            const category = categoryFilter.value;
            const filtered = onlineStreams.filter(s => (category === "all") || (s.game_name === category));
            render(filtered);
        }
    }

    async function searchTwitch(query) {
        statusText.textContent = `Пошук: ${query}...`;
        try {
            const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=40`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            let channels = data.data;

            // Применяем фильтр категорий если выбран
            const category = categoryFilter.value;
            if (category !== "all") {
                channels = channels.filter(c => c.game_name === category);
            }

            // Обогащаем данные количеством подписчиков для сортировки оффлайна
            // И количеством зрителей для онлайна
            const enrichedChannels = await Promise.all(channels.map(async (c) => {
                const followers = await getFollowerCount(c.id);
                // Если стример онлайн, нам нужно найти его в API Streams, чтобы узнать точный онлайн
                // Но для поиска используем упрощенный вес
                return { ...c, followersCount: followers };
            }));

            // --- УМНАЯ ИЕРАРХИЧЕСКАЯ СОРТИРОВКА ---
            enrichedChannels.sort((a, b) => {
                // 1. Приоритет Live над Offline
                if (a.is_live && !b.is_live) return -1;
                if (!a.is_live && b.is_live) return 1;

                // 2. Если оба Live — сортируем по онлайну (в поиске Twitch это не всегда точно, используем followers как замену или доп. вес)
                if (a.is_live && b.is_live) {
                    return b.followersCount - a.followersCount; // Для Live-результатов поиска Twitch отдаем приоритет крупным
                }

                // 3. Если оба Offline — сортируем строго по подписчикам
                return b.followersCount - a.followersCount;
            });

            renderSearchResults(enrichedChannels, query);
        } catch (e) { console.error(e); }
    }

    let timeout = null;
    searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(applyFilters, 600);
    };

    function renderSearchResults(channels, cleanQuery) {
        grid.innerHTML = '';
        statusText.textContent = `Результати для "${cleanQuery}"`;

        channels.forEach(c => {
            const isLive = c.is_live;
            const card = document.createElement('div');
            card.className = 'card';
            
            if (c.broadcaster_login.toLowerCase() === cleanQuery) {
                card.style.border = "2px solid #FFE600";
            }
            if (!isLive) card.style.opacity = "0.7";

            card.innerHTML = `
                <a href="https://twitch.tv/${c.broadcaster_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${c.thumbnail_url}" style="border-radius: 50%; width: 70px; height: 70px; margin: 15px auto; display: block; border: 3px solid ${isLive ? '#9146ff' : '#444'}">
                    <div class="info" style="text-align: center;">
                        <div class="name" style="font-weight: bold;">${c.display_name}</div>
                        <div style="font-size: 0.75em; color: #adadb8; margin-top: 3px;">👥 ${c.followersCount.toLocaleString()} підписників</div>
                        <div style="font-size: 0.75em; margin-top: 5px; font-weight: bold; color: ${isLive ? '#eb0400' : '#adadb8'}">
                            ${isLive ? '🔴 В ЕФІРІ' : '⚪ ОФЛАЙН'}
                        </div>
                        <div style="color: #9146ff; font-size:0.7em; margin-top:5px;">${c.game_name || ''}</div>
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
                            <div class="viewers">🔴 ${s.viewer_count.toLocaleString()} глядачів</div>
                        </div>
                    </a>
                </div>`;
        });
    }
};
