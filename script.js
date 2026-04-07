const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/'; 
let accessToken = localStorage.getItem('twitch_access_token');

window.onload = function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Навігація
    document.getElementById('btn-home').onclick = () => {
        document.getElementById('main-section').style.display = 'block';
        document.getElementById('hall-section').style.display = 'none';
        if (accessToken) loadStreams();
    };

    document.getElementById('btn-hall').onclick = () => {
        document.getElementById('main-section').style.display = 'none';
        document.getElementById('hall-section').style.display = 'block';
        renderHall();
    };

    if (!accessToken) {
        document.getElementById('status').innerHTML = "Авторизуйтесь, щоб побачити стріми.";
        document.getElementById('login-btn').onclick = () => {
            window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        };
    } else {
        loadStreams();
        loadUserProfile(); // Завантажуємо аватарку та нік
    }
};

// --- ФУНКЦІЯ ПРОФІЛЮ ---
async function loadUserProfile() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await res.json();
        if (data.data && data.data[0]) {
            const user = data.data[0];
            // Замінюємо кнопку входу на аватарку + нік
            document.getElementById('auth-container').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <img src="${user.profile_image_url}" width="40" style="border-radius: 50%; border: 2px solid #9146ff;">
                    <span style="font-size: 12px; font-weight: bold; color: white;">${user.display_name}</span>
                </div>
            `;
        }
    } catch (err) {
        console.error("Не вдалося завантажити профіль", err);
    }
}

async function loadStreams() {
    const statusEl = document.getElementById('status');
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=40', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.status === 401) {
            localStorage.removeItem('twitch_access_token');
            location.reload();
            return;
        }
        const data = await res.json();
        renderGrid(data.data);
    } catch (err) { statusEl.innerText = "Помилка завантаження."; }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    if (!streams || streams.length === 0) {
        document.getElementById('status').innerText = "Зараз онлайн стрімів немає.";
        return;
    }
    document.getElementById('status').innerText = `Зараз в ефірі: ${streams.length}`;
    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}">
                    <div class="info">
                        <b>${s.user_name}</b><br>
                        <small>${s.game_name}</small><br>
                        <small>👥 ${s.viewer_count}</small>
                    </div>
                </a>
            </div>`;
    });
}

// --- ЗАЛ СЛАВИ (ПОВНИЙ СПИСОК) ---
function renderHall() {
    const hallGrid = document.getElementById('hall-content');
    const legends = [
        { name: "Михайло Лебіга", nomination: "Подія року (Збір)", img: "leb1ga_tour.png" },
        { name: "Мафія зі Стрімерами", nomination: "Найкраще шоу", img: "mafiia-zi-strimerami-leb1ga.webp" },
        { name: "Твій Логотип", nomination: "Дизайн проекту", img: "logo.png" },
        { name: "UA Community", nomination: "Спільнота року", img: "logo.png" }
    ];

    hallGrid.innerHTML = '';
    legends.forEach(l => {
        hallGrid.innerHTML += `
            <div class="card" style="border: 1px solid #FFE600; background: #18181b;">
                <img src="${l.img}" onerror="this.src='https://via.placeholder.com/400x225?text=UA+Twitch'">
                <div class="info" style="text-align:center; padding: 15px;">
                    <span style="color:#FFE600; font-size: 11px; font-weight:bold; text-transform: uppercase;">${l.nomination}</span><br>
                    <b style="font-size: 1.1rem; color: white;">${l.name}</b>
                </div>
            </div>`;
    });
}
