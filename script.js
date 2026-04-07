const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = window.location.origin + window.location.pathname;

const loginBtn = document.getElementById('login-btn');
const grid = document.getElementById('streamers-grid');
const statusText = document.getElementById('status');

// Проверяем, есть ли токен в адресе после входа
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let accessToken = params.get('access_token');

if (accessToken) {
    loginBtn.textContent = "Ви ввійшли ✅";
    loadStreams();
} else {
    statusText.textContent = "Будь ласка, авторизуйтесь для перегляду списку";
}

loginBtn.addEventListener('click', () => {
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email`;
    window.location.href = authUrl;
});

async function loadStreams() {
    statusText.textContent = "Шукаємо українських стрімерів...";
    try {
        const response = await fetch('https://api.twitch.tv/helix/streams?language=uk&first=100', {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        renderStreams(data.data);
    } catch (error) {
        statusText.textContent = "Помилка завантаження даних.";
        console.error(error);
    }
}

function renderStreams(streams) {
    grid.innerHTML = '';
    if (streams.length === 0) {
        statusText.textContent = "Зараз ніхто не стрімить українською 😢";
        return;
    }
    statusText.textContent = `Зараз в ефірі: ${streams.length}`;

    streams.forEach(s => {
        const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <a href="https://www.twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                <img src="${thumb}">
                <div class="card-content">
                    <div class="card-title">${s.title}</div>
                    <div class="card-name">${s.user_name}</div>
                    <div class="viewers">🔴 ${s.viewer_count.toLocaleString()} глядачів</div>
                </div>
            </a>
        `;
        grid.appendChild(card);
    });
}
