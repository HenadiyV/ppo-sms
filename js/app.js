import { Compass } from './compass.js';
import { generateReportText } from './report.js';
import { TargetSearch } from './targetSearch.js';
import { WeaponManager } from './weaponManager.js';
import { DbEditor } from './dbEditor.js';
import { CONFIG } from './config.js';

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

    // Ініціалізація вибору зброї та боєприпасів
    new WeaponManager({
        weaponSelectId: 'weapon-select',
        ammoSelectId: 'ammo-select'
    });

    // Запускаем редактор базы данных
    new DbEditor();

    initCompass();
    fillDefaultDateTime();
});

// Генерація звіту
document.getElementById('generate-btn').addEventListener('click', () => {
    const target = document.getElementById('target-select').value;
    const detection = document.getElementById('detection-select').value;
    const time = document.getElementById('report-time').value;

    const rawDate = document.getElementById('report-date').value;
    let formattedDate = '--.--.----';
    if (rawDate) {
        const [y, m, d] = rawDate.split('-');
        formattedDate = `${d}.${m}.${y}`;
    }

    const position = document.getElementById('position').value;
    const targetNumber = document.getElementById('target-number').value;
    const targetCount = document.getElementById('target-count').value;
    const isDestroyed = document.getElementById('is-destroyed').value;
    const weapon = document.getElementById('weapon-select').value;
    const ammo = document.getElementById('ammo-select').value;
    const countAmmo = document.getElementById('count-ammo').value;
    const rawAzimuthDetect = document.getElementById('azimuth-detect').value;
    const rawAzimuthCourse = document.getElementById('azimuth-course').value;

    // Очищаем строки: оставляем только цифры с помощью регулярного выражения
    const azimuthDetect = rawAzimuthDetect.replace(/\D/g, '');
    const azimuthCourse = rawAzimuthCourse.replace(/\D/g, '');

    const report = generateReportText({
        position,
        target,
        targetNumber,
        targetCount,
        detection,
        time,
        date: formattedDate,
        isDestroyed,
        azimuthDetect,
        azimuthCourse,
        weapon,
        ammo,
        countAmmo
    });

    document.getElementById('report-output').value = report;
});

// 5. Офлайн-режим (Service Worker)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW зарегистрирован!', reg))
            .catch(err => console.error('Ошибка SW', err));
    });
}

