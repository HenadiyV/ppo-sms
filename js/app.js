import { Compass } from './compass.js';
import { generateReportText } from './report.js';
import { TargetSearch } from './targetSearch.js';
import { WeaponManager } from './weaponManager.js';
import { ActiveManager } from './activeManager.js';
import { DbEditor } from './dbEditor.js';
import { CONFIG } from './config.js';
import { latLonToMgrs } from './mgrs.js';
const NAME_POSITION = 'name_position';
let weaponManager = null;
// Перехоплювач помилок JS для зручного тестування на телефоні
window.addEventListener('error', function (e) {
    alert('Критична помилка JS:\n' + e.message + '\nУ файлі: ' + e.filename + '\nРядок: ' + e.lineno);
});

if (CONFIG.DEBUG_MODE) {
    console.log(`ППО СМС v${CONFIG.VERSION} — debug mode`);
}

// Ініціалізація компаса: датчики орієнтації запускаються автоматично
// при першому натисканні кнопки заміру азимуту (виявлення або курсу)
function initCompass() {
    const compassConfig = {
        displayId: 'azimuth-display',
        btnFixDetectId: 'btn-fix-detect',
        btnFixCourseId: 'btn-fix-course',
        inputDetectId: 'azimuth-detect',
        inputCourseId: 'azimuth-course'
    };

    const btnDetect = document.getElementById(compassConfig.btnFixDetectId);
    const btnCourse = document.getElementById(compassConfig.btnFixCourseId);

    if (btnDetect && btnCourse) {
        new Compass(compassConfig);
        if (CONFIG.DEBUG_MODE) console.log('Компас успішно ініціалізовано');
    } else {
        alert('Критична помилка: Кнопки компаса не знайдені в HTML за вказаними ID!');
        console.error('Критична помилка: Кнопки компаса не знайдені в HTML. Перевірте ID елементів!');
    }
}

// Автозаповнення поточної дати та часу у формі
function fillDefaultDateTime() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('report-time').value = `${hours}:${minutes}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('report-date').value = `${year}-${month}-${day}`;
}

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    // Запускаем интерактивный поиск целей
    new TargetSearch();

    // Ініціалізація вибору зброї та боєприпасів (з підтримкою декількох видів на один звіт)
    weaponManager = new WeaponManager({
        weaponSelectId: 'weapon-select',
        ammoSelectId: 'ammo-select',
        countAmmoId: 'count-ammo',
        addBtnId: 'btn-add-weapon-entry',
        listContainerId: 'weapons-used-list'
    });
    // Ініціалізація вибору активності
    new ActiveManager({
        activeSelectId: 'active-select'
    });
    // Запускаем редактор базы данных
    new DbEditor();
    document.getElementById('position').value = localStorage.getItem(NAME_POSITION) || '';
    initCompass();
    fillDefaultDateTime();

    // Панель "Керування довідниками" прихована за замовчуванням і розгортається за потреби
    const toggleBtn = document.getElementById('toggle-directory-panel');
    const panelBody = document.getElementById('directory-panel-body');
    const toggleIcon = document.getElementById('directory-toggle-icon');
    if (toggleBtn && panelBody) {
        toggleBtn.addEventListener('click', () => {
            const isOpen = panelBody.style.display !== 'none';
            panelBody.style.display = isOpen ? 'none' : 'block';
            toggleBtn.setAttribute('aria-expanded', String(!isOpen));
            if (toggleIcon) toggleIcon.textContent = isOpen ? '▸' : '▾';
        });
    }
});

document.getElementById('detection-select').addEventListener('change', () => {
    const detection = document.getElementById('detection-select').value;
    if (detection === "Ціль акустично та візуально не виявленно") {
        document.getElementById('active-target').style.display = 'none';
    } else { document.getElementById('active-target').style.display = 'block'; }
});

document.getElementById('active-select').addEventListener('change', () => {
    const active = document.getElementById('active-select').value;
    document.getElementById('report-place').style.display = active ? 'none' : 'block';
});

document.getElementById('btn-clear-weapons-list').addEventListener('click', () => {
    if (weaponManager) weaponManager.clearWeaponsUsed();
});

// Визначення поточної геолокації та додавання координат до поля "Позиція"
document.getElementById('btn-get-location').addEventListener('click', () => {
    const btn = document.getElementById('btn-get-location');

    if (!navigator.geolocation) {
        showToast('Геолокація не підтримується цим браузером');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Визначення...';

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            btn.disabled = false;
            btn.textContent = originalText;

            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            const accuracy = Math.round(pos.coords.accuracy);
            const isLowAccuracy = accuracy > 50;
            const warningMark = isLowAccuracy ? ' ⚠️ низька точність' : '';

            const mgrs = latLonToMgrs(pos.coords.latitude, pos.coords.longitude, 5);
            const mgrsLine = mgrs ? `${mgrs}` : ''; // `MGRS ${mgrs}` : '';

            const coordsLine = [
                `${lat}, ${lng} (точність ±${accuracy}м${warningMark})`,
                mgrsLine
            ].filter(Boolean).join('\n');

            // const positionField = document.getElementById('position');
            // positionField.value = positionField.value.trim()
            //     ? `${positionField.value.trim()}\n${coordsLine}`
            //     : coordsLine;
            const positionField = document.getElementById('coordinates');
            positionField.value = mgrsLine;

            //localStorage.setItem(NAME_POSITION, positionField.value);

            const warningEl = document.getElementById('position-accuracy-warning');
            if (isLowAccuracy) {
                showToast(`⚠️ Низька точність (±${accuracy}м). Перевірте GPS і дозвіл "Точне місцезнаходження"`, 4000);
                if (warningEl) {
                    warningEl.textContent = `⚠️ Останнє визначення неточне: ±${accuracy}м. Спробуйте на відкритому просторі з увімкненим GPS.`;
                    warningEl.style.display = 'block';
                }
            } else {
                showToast('Координати додано');
                if (warningEl) warningEl.style.display = 'none';
            }
        },
        (error) => {
            btn.disabled = false;
            btn.textContent = originalText;

            let message = 'Не вдалося визначити місцезнаходження';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Доступ до геолокації відхилено. Дозвольте в налаштуваннях браузера';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Місцезнаходження недоступне (немає сигналу GPS)';
                    break;
                case error.TIMEOUT:
                    message = 'Час очікування вичерпано, спробуйте ще раз';
                    break;
            }
            showToast(message);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
});

// Генерація звіту
document.getElementById('generate-btn').addEventListener('click', (e) => {
    const position = document.getElementById('position').value;
    if (!savePosition(position)) {
        showToast('Не вказано позицію');
        e.preventDefault();
        return;
    }
    const target = document.getElementById('target-select').value;
    const detection = document.getElementById('detection-select').value;


    const time = document.getElementById('report-time').value;

    const rawDate = document.getElementById('report-date').value;
    let formattedDate = '--.--.----';
    if (rawDate) {
        const [y, m, d] = rawDate.split('-');
        formattedDate = `${d}.${m}.${y}`;
    }


    const targetNumber = document.getElementById('target-number').value;
    const targetCount = document.getElementById('target-count').value;
    const targetHight = document.getElementById('target-height').value;
    const targetDistance = document.getElementById('target-distance').value;
    const isDestroyed = document.getElementById('is-destroyed').value;
    const weaponsUsed = weaponManager ? weaponManager.getWeaponsUsed() : [];
    const rawAzimuthDetect = document.getElementById('azimuth-detect').value;
    const rawAzimuthCourse = document.getElementById('azimuth-course').value;
    const otherActive = document.getElementById('active-select').value;

    // Очищаем строки: оставляем только цифры с помощью регулярного выражения
    const azimuthDetect = rawAzimuthDetect.replace(/\D/g, '');
    const azimuthCourse = rawAzimuthCourse.replace(/\D/g, '');

    const report = generateReportText({
        position,
        target,
        targetNumber,
        targetCount,
        targetHight,
        targetDistance,
        detection,
        time,
        date: formattedDate,
        isDestroyed,
        azimuthDetect,
        azimuthCourse,
        weaponsUsed,
        otherActive
    });

    document.getElementById('report-output').value = report;
});

function savePosition(position) {
    if (position) {
        localStorage.setItem(NAME_POSITION, position);
        return true;
    } else {
        return false;
    }
}

// Невеличке спливаюче повідомлення (наприклад "Скопійовано!")
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Копіювання готового тексту звіту в буфер обміну
async function copyReportToClipboard() {
    const reportOutput = document.getElementById('report-output');
    const text = reportOutput.value;

    if (!text.trim()) {
        showToast('Спочатку сформуйте звіт');
        return false;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Фолбек для старих браузерів / небезпечного контексту (без HTTPS)
            reportOutput.removeAttribute('readonly');
            reportOutput.focus();
            reportOutput.select();
            document.execCommand('copy');
            reportOutput.setAttribute('readonly', true);
        }
        showToast('Скопійовано!');
        return true;
    } catch (error) {
        console.error('Помилка копіювання', error);
        showToast('Не вдалося скопіювати');
        return false;
    }
}

document.getElementById('btn-copy-report').addEventListener('click', copyReportToClipboard);

// Поділитись звітом через системне меню (SMS, Telegram, Viber тощо),
// з фолбеком на копіювання, якщо Web Share API недоступний (десктоп)
document.getElementById('btn-share-report').addEventListener('click', async () => {
    const text = document.getElementById('report-output').value;

    if (!text.trim()) {
        showToast('Спочатку сформуйте звіт');
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({ text });
        } catch (error) {
            // AbortError виникає, якщо користувач сам закрив меню поширення — це не помилка
            if (error.name !== 'AbortError') {
                console.error('Помилка поширення', error);
                showToast('Не вдалося поділитись, спробуйте копіювати');
            }
        }
    } else {
        // Web Share API не підтримується (наприклад, десктопний браузер) — копіюємо замість цього
        const copied = await copyReportToClipboard();
        if (copied) showToast('Поширення недоступне — текст скопійовано');
    }
});

// 5. Офлайн-режим (Service Worker)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW зарегистрирован!', reg))
            .catch(err => console.error('Ошибка SW', err));
    });
}

