const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/'; 
let accessToken = localStorage.getItem('twitch_access_token');
let allStreams = [];

window.onload = function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Пошук працює по натисканню клавіш
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allStreams.filter(s => 
            s.user_name.toLowerCase().includes(query) || 
            s.game_name.toLowerCase().includes(query)
        );
        renderGrid(filtered);
    });

    document.getElementById('btn-home').onclick = () => {
        document.getElementById('main-section').style.display = 'block';
        document.getElementById('hall-section').style.display = 'none';
    };

    document.getElementById('btn-hall').onclick = () => {
        document.getElementById('main-section').style.display = 'none';
        document.getElementById('hall-section').style.display = 'block';
        renderHall();
    };

    if (!accessToken) {
        document.getElementById('login-btn').onclick = () => {
            window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        };
    } else {
        loadStreams();
        loadUserProfile();
    }
};

async function loadUserProfile() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/users', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (data.data[0]) {
            const user = data.data[0];
            document.getElementById('auth-container').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <img src="${user.profile_image_url}" width="35" style="border-radius: 50%; border: 2px solid #9146ff;">
                    <span style="font-size: 11px; font-weight: bold;">${user.display_name}</span>
                </div>`;
        }
    } catch (e) { console.error(e); }
}

async function loadStreams() {
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: { 'Client-ID': CLIENT_ID, 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        allStreams = data.data || [];
        renderGrid(allStreams);
    } catch (e) { document.getElementById('status').innerText = "Помилка завантаження стрімів"; }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    document.getElementById('status').innerText = streams.length > 0 ? `Онлайн: ${streams.length}` : "Нікого не знайдено";
    
    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}" style="width:100%; border-radius: 8px;">
                    <div class="info" style="padding:10px;">
                        <b>${s.user_name}</b><br>
                        <small style="color:#adadb8">${s.game_name}</small>
                    </div>
                </a>
            </div>`;
    });
}

function renderHall() {
    // Враховано назви файлів з твоїх скріншотів
    const awards2024 = [
        { n: "СТРИМЕР РОКУ", u: "Leb1ga", i: "leb1ga_tour.png" },
        { n: "СТРИМЕРКА РОКУ", u: "Dobra_Divka", i: "logo.png.png" },
        { n: "ГРА РОКУ", u: "S.T.A.L.K.E.R. 2", i: "stalker-2-heart-of-chornobyl.webp" },
        { n: "ДЕБЮТ РОКУ", u: "OTOYSOUNDS", i: "logo.png.png" }
    ];

    const awards2025 = [
        { n: "КРАЩЕ ШОУ", u: "Мафія", i: "mafiia-zi-strimerami-leb1ga.webp" },
        { n: "КОЛАБОРАЦІЯ РОКУ", u: "Виживання 24 години", i: "vizivannia-24-godini-v-lisi-leb1ga-luzan.webp" },
        { n: "МАРАФОН РОКУ", u: "Марафон схуднення", i: "marafon-sxudnennia-leb1ga.webp" },
        { n: "ВИБІР СПІЛЬНОТИ", u: "thetremba", i: "logo.png.png" }
    ];

    const fill = (id, list) => {
        const el = document.getElementById(id);
        el.innerHTML = '';
        list.forEach(a => {
            el.innerHTML += `
                <div class="card" style="border: 1px solid #333; text-align:center; background:#18181b;">
                    <img src="${a.i}" style="width:100%; height:150px; object-fit:cover;" 
                         onerror="this.src='https://placehold.jp/24/333333/ffffff/400x225.png?text=UA+Twitch'">
                    <div class="info" style="padding:15px;">
                        <p style="color:#ffd700; font-size:10px; font-weight:bold; margin:0;">${a.n}</p>
                        <p style="font-size:16px; font-weight:bold; margin:5px 0 0;">${a.u}</p>
                    </div>
                </div>`;
        });
    };
    fill('hall-2024', awards2024);
    fill('hall-2025', awards2025);
}
