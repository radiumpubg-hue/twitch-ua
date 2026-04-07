const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; 
let accessToken = localStorage.getItem('twitch_access_token');

window.onload = function() {
    const authContainer = document.getElementById('auth-container');
    const loginBtn = document.getElementById('login-btn');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const grid = document.getElementById('streamers-grid');
    const logoLink = document.getElementById('logo-link');
    const historyBox = document.getElementById('search-history');

    // 1. ПЕРЕВІРКА ТОКЕНА
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const newToken = params.get('access_token');

    if (newToken) {
        accessToken = newToken;
        localStorage.setItem('twitch_access_token', newToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken) {
        loadUserProfile();
        loadInitialStreams();
        renderHistory();
    } else {
        statusText.textContent = "Будь ласка, авторизуйтесь для перегляду стрімерів";
    }

    if (loginBtn) {
        loginBtn.onclick = () => {
            const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
            window.location.href = authUrl;
        };
    }

    logoLink.onclick = (e) => {
        e.preventDefault();
        searchInput.value = '';
        categoryFilter.value = 'all';
        applyFilters();
    };

    // 2. ІСТОРІЯ ПОШУКУ
    function saveToHistory(query) {
        if (!query || query.length < 2) return;
        let history = JSON.parse(localStorage.getItem('search_history') || '[]');
        history = history.filter(item => item !== query);
        history.unshift(query);
        history = history.slice(0, 6); // Зберігаємо 6 останніх
        localStorage.setItem('search_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('search_history') || '[]');
        historyBox.innerHTML = history.length > 0 ? '<span style="color:#555; font-size:0.8em; align-self:center;">Історія:</span>' : '';
        history.forEach(item => {
            const btn = document.createElement('span');
            btn.textContent = item;
            btn.style = "background: #26262c; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; cursor: pointer; border: 1px solid #333; color: #adadb8; transition: 0.2s;";
            btn.onmouseover = () => btn.style.borderColor = "#9146ff";
            btn.onmouseout = () => btn.style.borderColor = "#333";
            btn.onclick = () => {
                searchInput.value = item;
                applyFilters();
            };
            historyBox.appendChild(btn);
        });
    }

    // 3. РОБОТА З ПРОФІЛЕМ ТА API
    async function loadUserProfile() {
        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            const user = data.data[0];
            if (user) {
                authContainer.innerHTML = `
                    <div id="logout-btn" title="Натисніть щоб вийти" style="display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer;">
                        <img src="${user.profile_image_url}" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid #9146ff;">
                        <span style="font-size: 0.75em; font-weight: bold; color: #efeff1;">${user.display_name}</span>
                    </div>
                `;
                document.getElementById('logout-btn').onclick = () => {
                    if(confirm("Вийти з профілю?")) {
                        localStorage.removeItem('twitch_access_token');
                        location.reload();
                    }
                };
            }
        } catch (e) {
            localStorage.removeItem('twitch_access_token');
            location.reload();
        }
    }

    async function loadInitialStreams() {
        statusText.textContent = "Завантаження українських стрімів...";
        try {
            const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            onlineStreams = data.data;
            applyFilters();
        } catch (e) { statusText.textContent = "Помилка завантаження даних."; }
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
        statusText.textContent = `Шукаємо "${query}"...`;
        saveToHistory(query);
        try {
            const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=40`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            let channels = data.data;

            const category = categoryFilter.value;
            if (category !== "all") {
                channels = channels.filter(c => c.game_name === category);
            }

            // Збагачуємо дані для правильного сортування
            const enriched = await Promise.all(channels.map(async (c) => {
                const followers = await getFollowerCount(c.id);
                return { ...c, followersCount: followers };
            }));

            // ІЄРАРХІЯ: Стрім (за фоловерами) -> Офлайн (за фоловерами)
            enriched.sort((a, b) => {
                if (a.is_live && !b.is_live) return -1;
                if (!a.is_live && b.is_live) return 1;
                return b.followersCount - a.followersCount;
            });

            renderSearchResults(enriched, query);
        } catch (e) { console.error(e); }
    }

    let timeout = null;
    searchInput.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(applyFilters, 800);
    };

    categoryFilter.onchange = applyFilters;

    function renderSearchResults(channels, cleanQuery) {
        grid.innerHTML = '';
        statusText.textContent = `Результати пошуку: ${channels.length}`;
        channels.forEach(c => {
            const isLive = c.is_live;
            const card = document.createElement('div');
            card.className = 'card';
            if (c.broadcaster_login.toLowerCase() === cleanQuery) card.style.borderColor = "#FFE600";
            if (!isLive) card.style.opacity = "0.7";

            card.innerHTML = `
                <a href="https://twitch.tv/${c.broadcaster_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${c.thumbnail_url}" style="border-radius: 50%; width: 75px; height: 75px; margin: 15px auto; display: block; border: 3px solid ${isLive ? '#9146ff' : '#444'}">
                    <div class="info" style="text-align: center;">
                        <div class="name" style="font-weight: bold; color: #fff;">${c.display_name}</div>
                        <div style="font-size: 0.75em; color: #adadb8; margin: 4px 0;">👥 ${c.followersCount.toLocaleString()} підписників</div>
                        <div style="font-size: 0.8em; font-weight: bold; color: ${isLive ? '#eb0400' : '#adadb8'}">
                            ${isLive ? '🔴 В ЕФІРІ' : '⚪ ОФЛАЙН'}
                        </div>
                        <div style="color: #9146ff; font-size:0.7em; margin-top:5px; font-weight: bold;">${c.game_name || ''}</div>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });
    }

    function render(streams) {
        grid.innerHTML = '';
        statusText.textContent = `Зараз в ефірі: ${streams.length}`;
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb}">
                        <div class="info">
                            <div class="title" style="font-weight: bold; font-size: 0.9em; margin-bottom: 8px; height: 35px; overflow: hidden;">${s.title}</div>
                            <div class="name" style="color: #adadb8; font-size: 0.85em;">${s.user_name} • ${s.game_name}</div>
                            <div class="viewers" style="color: #eb0400; font-weight: bold; margin-top: 8px; font-size: 0.85em;">🔴 ${s.viewer_count.toLocaleString()} глядачів</div>
                        </div>
                    </a>
                </div>`;
        });
    }
};
