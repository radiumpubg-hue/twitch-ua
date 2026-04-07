const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
// ВАЖЛИВО: Перевір, щоб це посилання БУКВА В БУКВУ збігалося з тим, що ти ввів у Twitch Developer Console
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/'; 

let accessToken = localStorage.getItem('twitch_access_token');

window.onload = function() {
    // 1. ПЕРЕВІРКА ТОКЕНА ПІСЛЯ ВХОДУ
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tokenFromUrl = params.get('access_token');

    if (tokenFromUrl) {
        accessToken = tokenFromUrl;
        localStorage.setItem('twitch_access_token', tokenFromUrl);
        // Очищуємо URL від токена для краси
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. ЛОГІКА КНОПОК МЕНЮ
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

    // 3. КНОПКА ВХОДУ
    const loginBtn = document.getElementById('login-btn');
    loginBtn.onclick = () => {
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=user:read:email`;
        window.location.href = authUrl;
    };

    // ПЕРЕВІРКА СТАНУ
    if (!accessToken) {
        document.getElementById('status').innerHTML = "Будь ласка, натисніть <b>'Увійти через Twitch'</b>";
    } else {
        loginBtn.innerText = "Авторизовано ✅";
        loadStreams();
    }
};

// ЗАВАНТАЖЕННЯ СТРІМІВ
async function loadStreams() {
    const statusEl = document.getElementById('status');
    statusEl.innerText = "Шукаємо українських стрімерів...";
    
    try {
        const res = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=40', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (res.status === 401) {
            statusEl.innerText = "Помилка авторизації. Спробуйте увійти знову.";
            localStorage.removeItem('twitch_access_token');
            return;
        }

        const data = await res.json();
        renderGrid(data.data);
    } catch (err) {
        statusEl.innerText = "Помилка зв'язку з Twitch.";
    }
}

function renderGrid(streams) {
    const grid = document.getElementById('streamers-grid');
    grid.innerHTML = '';
    
    if (!streams || streams.length === 0) {
        document.getElementById('status').innerText = "Зараз ніхто не стрімить мовою UA.";
        return;
    }

    document.getElementById('status').innerText = `Зараз в ефірі: ${streams.length}`;

    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        grid.innerHTML += `
            <div class="card">
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}" alt="${s.user_name}">
                    <div class="info">
                        <b>${s.user_name}</b><br>
                        <small>${s.game_name}</small><br>
                        <small>👥 ${s.viewer_count}</small>
                    </div>
                </a>
            </div>`;
    });
}

// ЗАЛ СЛАВИ (ТВОЇ КАРТИНКИ)
function renderHall() {
    const hallGrid = document.getElementById('hall-content');
    
    // Список твоїх переможців (перевір назви файлів!)
    const legends = [
        { name: "Лебіга", nomination: "Подія року", img: "leb1ga_tour.png" },
        { name: "Мафія", nomination: "Колаборація року", img: "mafiia-zi-strimerami-leb1ga.webp" },
        { name: "Стрімер 3", nomination: "Відкриття року", img: "logo.png" }
    ];

    hallGrid.innerHTML = '';
    legends.forEach(l => {
        hallGrid.innerHTML += `
            <div class="card" style="border: 1px solid #FFE600;">
                <img src="${l.img}" onerror="this.src='https://via.placeholder.com/400x225?text=No+Image'">
                <div class="info" style="text-align:center;">
                    <span style="color:#FFE600; font-size: 0.8rem; font-weight:bold;">${l.nomination}</span><br>
                    <b style="font-size: 1.2rem;">${l.name}</b>
                </div>
            </div>`;
    });
}
