const CLIENT_ID = 'm3l01pm0lc1hyw65z60xb0dmr5kq6w';
const REDIRECT_URI = 'https://radiumpubg-hue.github.io/twitch-ua/';

let onlineStreams = []; 
let accessToken = localStorage.getItem('twitch_access_token');
let favorites = JSON.parse(localStorage.getItem('twitch_favorites') || '[]');

// Дані для Залу Слави
const awardsData = [
    {
        year: 2026,
        winners: [
            { nom: "Стрімер року", name: "Leb1ga" },
            { nom: "Найкращий ігровий стрімер", name: "Ghostik" },
            { nom: "Прорив року", name: "User123" }
        ]
    },
    {
        year: 2025,
        winners: [
            { nom: "Стрімер року", name: "Leb1ga" },
            { nom: "Найкращий CS2 стрімер", name: "s1mple" },
            { nom: "Найкращий Just Chatting", name: "Mika_Ua" }
        ]
    }
];

window.onload = function() {
    const mainContent = document.getElementById('main-content');
    const hallOfFame = document.getElementById('hall-of-fame');
    const showMain = document.getElementById('show-main');
    const showHall = document.getElementById('show-hall');
    
    // Перемикання сторінок
    showMain.onclick = () => {
        mainContent.style.display = 'block';
        hallOfFame.style.display = 'none';
        showMain.style.color = 'white';
        showHall.style.color = '#adadb8';
    };

    showHall.onclick = () => {
        mainContent.style.display = 'none';
        hallOfFame.style.display = 'block';
        showHall.style.color = 'white';
        showMain.style.color = '#adadb8';
        renderHall();
    };

    // --- Логіка авторизації та стрімів (копіюємо з попереднього коду) ---
    // (Я скорочую для відповіді, але залиш всі функції: loadUserProfile, loadInitialStreams, searchTwitch)
    
    // Оновлена функція рендеру стрімів з підтримкою "Улюблених"
    function render(streams) {
        const grid = document.getElementById('streamers-grid');
        grid.innerHTML = '';
        
        // Сортування: Улюблені завжди зверху
        const sorted = streams.sort((a, b) => {
            const aFav = favorites.includes(a.user_login);
            const bFav = favorites.includes(b.user_login);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return b.viewer_count - a.viewer_count;
        });

        sorted.forEach(s => {
            const isFav = favorites.includes(s.user_login);
            const thumb = s.thumbnail_url.replace('{width}', '400').replace('{height}', '225');
            
            const card = document.createElement('div');
            card.className = 'card';
            card.style.position = 'relative';
            
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" data-login="${s.user_login}">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <a href="https://twitch.tv/${s.user_login}" target="_blank" style="text-decoration:none; color:inherit;">
                    <img src="${thumb}">
                    <div class="info">
                        <div class="title" style="font-weight:bold; height:35px; overflow:hidden;">${s.title}</div>
                        <div style="color:#adadb8;">${s.user_name}</div>
                        <div style="color:#eb0400; font-weight:bold; margin-top:5px;">🔴 ${s.viewer_count.toLocaleString()}</div>
                    </div>
                </a>
            `;
            
            // Клік по сердечку
            card.querySelector('.fav-btn').onclick = (e) => {
                e.preventDefault();
                toggleFavorite(s.user_login);
            };
            
            grid.appendChild(card);
        });
    }

    function toggleFavorite(login) {
        if (favorites.includes(login)) {
            favorites = favorites.filter(l => l !== login);
        } else {
            favorites.push(login);
        }
        localStorage.setItem('twitch_favorites', JSON.stringify(favorites));
        applyFilters(); // Перемалювати список
    }

    function renderHall() {
        const container = document.getElementById('hall-content');
        container.innerHTML = '';
        awardsData.forEach(yearBlock => {
            let html = `<div class="year-block"><h3>Рік ${yearBlock.year}</h3>`;
            yearBlock.winners.forEach(w => {
                html += `<div class="nomination"><span>${w.nom}</span><span class="winner">${w.name}</span></div>`;
            });
            html += `</div>`;
            container.innerHTML += html;
        });
    }

    // Не забудь додати всі інші функції (loadInitialStreams, applyFilters тощо), які ми писали раніше!
};
