const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let accessToken = localStorage.getItem('twitch_access_token');
let onlineStreams = [];

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
            { nom: "Краще шоу", login: "leb1ga", customName: "Мафія зі стрімерами" },
            { nom: "Колаборація року", login: "leb1ga", customName: "Виживання 24 години" },
            { nom: "Марафон року", login: "leb1ga", customName: "Марафон схуднення" },
            { nom: "Гра року", login: "leb1ga", customName: "Counter-Strike 2" },
            { nom: "Вибір спільноти", login: "thetremba" }
        ]
    },
    {
        year: 2024,
        winners: [
            { nom: "Стример року", login: "leb1ga" },
            { nom: "Стримерка року", login: "dobra_divka" },
            { nom: "Дебют року", login: "otoysounds" },
            { nom: "Стример IRL", login: "leb1ga" },
            { nom: "Кращий стример з CS2", login: "leniniw" },
            { nom: "Кращий стример з Dota 2", login: "ghostik" },
            { nom: "VTuber року", login: "luma_rum" },
            { nom: "Краще шоу", login: "leb1ga", customName: "Стрім Тур Селами" },
            { nom: "Гра року", login: "leb1ga", customName: "S.T.A.L.K.E.R. 2" }
        ]
    }
];

window.onload = function() {
    // 1. Обробка токена (Авторизація)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('access_token')) {
        accessToken = params.get('access_token');
        localStorage.setItem('twitch_access_token', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const statusText = document.getElementById('status');
    
    if (accessToken) {
        loadInitialStreams();
        loadUserProfile();
    } else {
        statusText.innerHTML = "Авторизуйтесь, щоб побачити стріми.";
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

    async function loadInitialStreams() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            onlineStreams = data.data || [];
            render(onlineStreams);
        } catch (e) { statusText.textContent = "Помилка завантаження."; }
    }

    function render(streams) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        statusText.textContent = `Зараз в ефірі (UA): ${streams.length}`;
        streams.forEach(s => {
            const thumb = s.thumbnail_url.replace('{width}', '440').replace('{height}', '248');
            grid.innerHTML += `
                <div class="card">
                    <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                        <img src="${thumb}">
                        <span class="live-label">LIVE</span>
                        <div class="info">
                            <div style="font-weight:bold;">${s.user_name}</div>
                            <div style="color:#adadb8; font-size:0.8rem;">${s.game_name}</div>
                            <div style="margin-top:5px; font-size:0.8rem;">👥 ${s.viewer_count}</div>
                        </div>
                    </a>
                </div>`;
        });
    }

    async function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '<p style="text-align:center;">Завантаження...</p>';
        
        const allLogins = [...new Set(awardsData.flatMap(y => y.winners.map(w => w.login)))];
        try {
            const res = await fetch(`https://api.twitch.tv/helix/users?login=${allLogins.join('&login=')}`, {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const userData = await res.json();
            const avatars = {};
            userData.data.forEach(u => avatars[u.login] = u.profile_image_url);

            container.innerHTML = '';
            awardsData.forEach(y => {
                let html = `<h2 class="hall-title">🏆 ПЕРЕМОЖЦІ STREAM AWARDS ${y.year} 🏆</h2><div class="hall-grid">`;
                y.winners.forEach(w => {
                    const img = avatars[w.login] || '';
                    html += `
                        <a href="https://twitch.tv/${w.login}" target="_blank" class="award-card">
                            <img src="${img}" class="award-avatar">
                            <span class="nomination-text">${w.nom}</span>
                            <div class="winner-name">${w.customName || w.login}</div>
                        </a>`;
                });
                container.innerHTML += html + '</div>';
            });
        } catch (e) { container.innerHTML = "Помилка завантаження Залу Слави."; }
    }

    async function loadUserProfile() {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', {
                headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (data.data[0]) {
                document.getElementById('auth-container').innerHTML = `<img src="${data.data[0].profile_image_url}" width="30" style="border-radius:50%;">`;
            }
        } catch (e) {}
    }

    // Пошук
    document.getElementById('search-input').oninput = async (e) => {
        const q = e.target.value.toLowerCase();
        if (!q) return render(onlineStreams);
        const filtered = onlineStreams.filter(s => s.user_name.toLowerCase().includes(q) || s.user_login.toLowerCase().includes(q));
        render(filtered);
    };
};
