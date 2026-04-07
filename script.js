const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; 
let accessToken = localStorage.getItem('twitch_access_token');
let favorites = JSON.parse(localStorage.getItem('twitch_favorites') || '[]');

const awardsData = [
    {
        year: 2025,
        winners: [
            { nom: "Стример року", login: "roolex9" },
            { nom: "Стримерка року", login: "sheisfoxy" },
            { nom: "Дебют року", login: "valentinopradagucci" },
            { nom: "Non-gaming стример", login: "leb1ga" },
            { nom: "Кращий стример з CS2", login: "leb1ga" },
            { nom: "Кращий стример з Dota 2", login: "ghostik" },
            { nom: "VTuber року", login: "luma_rum" },
            { nom: "Завжди в етері", login: "guthriee" },
            { nom: "Вибір спільноти", login: "thetremba" }
        ]
    },
    {
        year: 2024,
        winners: [
            { nom: "Стример року", login: "leb1ga" },
            { nom: "Стримерка року", login: "dobra_divka" },
            { nom: "Дебют року", login: "otoysounds" },
            { nom: "Кращий стример з CS2", login: "leniniw" },
            { nom: "Кращий стример з Dota 2", login: "ghostik" }
        ]
    }
];

window.onload = function() {
    const mainContent = document.getElementById('main-content');
    const hallOfFame = document.getElementById('hall-of-fame');
    const showMain = document.getElementById('show-main');
    const showHall = document.getElementById('show-hall');
    const statusText = document.getElementById('status');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    showMain.onclick = () => { mainContent.style.display = 'block'; hallOfFame.style.display = 'none'; };
    showHall.onclick = () => { mainContent.style.display = 'none'; hallOfFame.style.display = 'block'; renderHall(); };

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('access_token')) {
        accessToken = params.get('access_token');
        localStorage.setItem('twitch_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken) { loadInitialStreams(); renderHistory(); }
    else { statusText.textContent = "Авторизуйтесь для пошуку."; }

    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };

    async function loadInitialStreams() {
        statusText.textContent = "Завантаження популярних UA стрімів...";
        try {
            const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            onlineStreams = data.data || [];
            render(onlineStreams, false);
        } catch (e) { statusText.textContent = "Помилка доступу до Twitch."; }
    }

    async function searchTwitch(query) {
        statusText.textContent = `Шукаємо: ${query}...`;
        saveToHistory(query);
        try {
            // Використовуємо search/channels щоб знайти і офлайн стрімерів
            const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=50`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            render(data.data || [], true);
        } catch (e) { statusText.textContent = "Помилка пошуку."; }
    }

    function render(data, isSearch) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        if (data.length === 0) { statusText.textContent = "Нікого не знайдено."; return; }
        
        statusText.textContent = isSearch ? "Результати пошуку (Онлайн та Офлайн):" : "Зараз в ефірі (UA):";

        data.forEach(item => {
            const login = item.user_login || item.broadcaster_login;
            const name = item.user_name || item.display_name;
            const isLive = item.type === 'live' || item.is_live;
            const isFav = favorites.includes(login);
            
            // Якщо це пошук, Twitch повертає маленьку аватарку, якщо стрім - прев'ю
            let thumb = item.thumbnail_url || '';
            thumb = thumb.replace('{width}', '440').replace('{height}', '248');
            if (isSearch && !isLive) thumb = item.thumbnail_url; // Для офлайну залишаємо фото профілю

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="window.toggleFav('${login}')">${isFav ? '❤️' : '🤍'}</button>
                <a href="https://twitch.tv/${login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <div style="position:relative;">
                        <img src="${thumb || 'https://via.placeholder.com/440x248?text=No+Preview'}">
                        <span class="status-badge ${isLive ? 'status-online' : 'status-offline'}">
                            ${isLive ? '🔴 LIVE' : '⚪ OFFLINE'}
                        </span>
                    </div>
                    <div class="info">
                        <b style="font-size:1.1rem;">${name}</b><br>
                        <small style="color:#adadb8;">${item.game_name || 'Не вказано'}</small>
                        ${isLive && item.viewer_count ? `<div style="color:#ff4a4a; font-weight:bold; font-size:0.8rem; margin-top:5px;">👥 ${item.viewer_count.toLocaleString()}</div>` : ''}
                    </div>
                </a>`;
            grid.appendChild(card);
        });
    }

    window.toggleFav = (login) => {
        if (favorites.includes(login)) favorites = favorites.filter(f => f !== login);
        else favorites.push(login);
        localStorage.setItem('twitch_favorites', JSON.stringify(favorites));
        applyFilters();
    };

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        if (query) searchTwitch(query); else loadInitialStreams();
    }

    async function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '<p style="text-align:center;">Завантаження легенд...</p>';
        const allLogins = [...new Set(awardsData.flatMap(y => y.winners.map(w => w.login)))];
        try {
            const res = await fetch(`https://api.twitch.tv/helix/users?login=${allLogins.join('&login=')}`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const userData = await res.json();
            const avatars = {};
            userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

            container.innerHTML = '';
            awardsData.forEach(yearSec => {
                let html = `<div style="margin-bottom:40px;"><h2 style="color:#FFE600; border-bottom:1px solid #333; padding-bottom:10px;">${yearSec.year} РІК</h2><div class="hall-grid">`;
                yearSec.winners.forEach(w => {
                    html += `
                        <a href="https://twitch.tv/${w.login}" target="_blank" class="award-card">
                            <img src="${avatars[w.login] || ''}" class="award-avatar">
                            <div style="font-size:0.7rem; color:#adadb8; text-transform:uppercase;">${w.nom}</div>
                            <div style="font-weight:bold; color:#FFE600;">${w.login}</div>
                        </a>`;
                });
                container.innerHTML += html + `</div></div>`;
            });
        } catch (e) { container.innerHTML = "Помилка завантаження аватарок."; }
    }

    function saveToHistory(q) {
        if(!q) return;
        let h = JSON.parse(localStorage.getItem('search_history') || '[]');
        h = [q, ...h.filter(x => x !== q)].slice(0, 5);
        localStorage.setItem('search_history', JSON.stringify(h));
        renderHistory();
    }

    function renderHistory() {
        const box = document.getElementById('search-history');
        const h = JSON.parse(localStorage.getItem('search_history') || '[]');
        box.innerHTML = h.map(x => `<span onclick="document.getElementById('search-input').value='${x}'; window.dispatchEvent(new Event('input'));" style="background:#1f1f23; padding:5px 12px; border-radius:15px; font-size:0.8em; cursor:pointer; border:1px solid #333; margin-right:5px;">${x}</span>`).join('');
    }

    searchInput.addEventListener('input', () => { 
        clearTimeout(window.searchTimer); 
        window.searchTimer = setTimeout(applyFilters, 700); 
    });
};
