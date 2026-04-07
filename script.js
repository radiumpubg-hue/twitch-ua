const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';
let accessToken = localStorage.getItem('twitch_access_token');

const awardsData = [
    {
        year: 2025,
        winners: [
            { nom: "Стример року", login: "roolex9", type: "person" },
            { nom: "Стримерка року", login: "sheisfoxy", type: "person" },
            { nom: "Дебют року", login: "valentinopradagucci", type: "person" },
            { nom: "Non-gaming стример", login: "leb1ga", type: "person" },
            { nom: "Кращий стример з CS2", login: "leb1ga", type: "person" },
            { nom: "Кращий стрімер з Dota 2", login: "ghostik", type: "person" },
            { nom: "VTuber року", login: "luma_rum", type: "person" },
            { nom: "Завжди в етері", login: "guthriee", type: "person" },
            { nom: "Краще шоу на етерах", login: "leb1ga", type: "local", file: "mafiia-zi-strimerami-leb1ga.webp", title: "Мафія зі стрімерами" },
            { nom: "Колаборація року", login: "leb1ga", type: "local", file: "vizivannia-24-godini-v-lisi-leb1ga-luzan....webp", title: "Виживання 24 години" },
            { nom: "Марафон року", login: "leb1ga", type: "local", file: "marafon-sxudnennia-leb1ga.webp", title: "Марафон схуднення" },
            { nom: "Гра року", type: "game", title: "Counter-Strike 2", appId: "730" },
            { nom: "Вибір спільноти", login: "thetremba", type: "person" }
        ]
    },
    {
        year: 2024,
        winners: [
            { nom: "Стример року", login: "leb1ga", type: "person" },
            { nom: "Стримерка року", login: "dobra_divka", type: "person" },
            { nom: "Дебют року", login: "otoysounds", type: "person" },
            { nom: "Краще шоу", login: "leb1ga", type: "local", file: "leb1ga_tour.png", title: "Стрім Тур Селами" },
            { nom: "Гра року", type: "game", title: "S.T.A.L.K.E.R. 2", appId: "1643320" }
        ]
    }
];

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
    }

    // Навігація
    document.getElementById('show-main').onclick = () => {
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('hall-of-fame').style.display = 'none';
    };
    document.getElementById('show-hall').onclick = () => {
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('hall-of-fame').style.display = 'block';
        renderHall();
    };

    document.getElementById('login-btn').onclick = () => {
        window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
    };

    // Глобальний пошук (Онлайн + Офлайн)
    let searchTimer;
    document.getElementById('search-input').oninput = (e) => {
        clearTimeout(searchTimer);
        const q = e.target.value.trim();
        if (q.length < 2) return;
        searchTimer = setTimeout(() => performGlobalSearch(q), 600);
    };

    async function loadTopStreams() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            renderGrid(data.data, true);
        } catch (e) {}
    }

    async function performGlobalSearch(query) {
        document.getElementById('status').textContent = "Шукаємо серед усіх каналів...";
        try {
            const res = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=40`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            renderGrid(data.data, false);
        } catch (e) {}
    }

    function renderGrid(data, isLiveOnly) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        document.getElementById('status').textContent = isLiveOnly ? `Зараз в ефірі (UA): ${data.length}` : `Знайдено каналів:`;

        data.forEach(s => {
            const isLive = isLiveOnly ? true : s.is_live;
            const login = s.user_login || s.broadcaster_login;
            const name = s.user_name || s.display_name;
            const thumb = isLiveOnly ? s.thumbnail_url.replace('{width}', '440').replace('{height}', '248') : s.thumbnail_url;

            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb || 'https://via.placeholder.com/440x248?text=Offline'}">
                        <span class="badge ${isLive ? 'badge-live' : 'badge-offline'}">${isLive ? 'LIVE' : 'OFFLINE'}</span>
                        <div class="info">
                            <b>${name}</b>
                            <small>${s.game_name || 'Немає опису'}</small>
                            ${isLive && s.viewer_count ? `<br><small>👥 ${s.viewer_count.toLocaleString()}</small>` : ''}
                        </div>
                    </a>
                </div>`;
        });
    }

    async function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '<p style="text-align:center;">Завантаження легенд...</p>';
        const personLogins = [...new Set(awardsData.flatMap(y => y.winners.filter(w => w.type === 'person').map(w => w.login)))];
        
        try {
            const res = await fetch(`https://api.twitch.tv/helix/users?login=${personLogins.join('&login=')}`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const userData = await res.json();
            const avatars = {};
            userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

            container.innerHTML = '';
            awardsData.forEach(y => {
                let html = `<h2 class="hall-title">🏆 STREAM AWARDS ${y.year} 🏆</h2><div class="hall-grid">`;
                y.winners.forEach(w => {
                    let media = '';
                    if (w.type === 'person') media = `<img src="${avatars[w.login] || ''}" class="award-avatar">`;
                    else if (w.type === 'game') media = `<img src="https://cdn.akamai.steamstatic.com/steam/apps/${w.appId}/header.jpg" class="award-poster">`;
                    else if (w.type === 'local') media = `<img src="${w.file}" class="award-poster">`;

                    html += `
                        <div class="award-card">
                            ${media}
                            <span class="nomination-text">${w.nom}</span>
                            <div class="winner-name">${w.title || w.login}</div>
                        </div>`;
                });
                container.innerHTML += html + '</div>';
            });
        } catch (e) { container.innerHTML = "Помилка."; }
    }

    async function loadUserProfile() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', { headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` } });
            const data = await res.json();
            if (data.data[0]) document.getElementById('auth-container').innerHTML = `<img src="${data.data[0].profile_image_url}" width="35" style="border-radius:50%; border:2px solid #9146ff;">`;
        } catch (e) {}
    }
};
