import { Compass } from './compass.js';
import { generateReportText } from './report.js';

// Переменная для хранения текущего живого азимута с датчика
let currentLiveAzimuth = 0;

// 1. Инициализация компаса
const azimuthDisplay = document.getElementById('azimuth-display');

const compass = new Compass(
    // Успешное обновление азимута (живые данные):
    (azimuth, isRelative) => {
        currentLiveAzimuth = azimuth; // Запоминаем текущий угол в переменную
        if (isRelative) {
            azimuthDisplay.textContent = `${azimuth}° (відносний)`;
            azimuthDisplay.style.color = '#f39c12';
        } else {
            azimuthDisplay.textContent = `${azimuth}°`;
            azimuthDisplay.style.color = '#27ae60';
        }
    },
    // Вывод ошибки:
    (errorMessage) => {
        azimuthDisplay.textContent = `Помилка: ${errorMessage}`;
        azimuthDisplay.style.color = '#e74c3c';
    }
);

// Включение компаса по кнопке
document.getElementById('start-compass').addEventListener('click', () => {
    compass.start();
});

// 2. Логика фиксации азимутов по кнопкам
const inputDetect = document.getElementById('azimuth-detect');
const inputCourse = document.getElementById('azimuth-course');

document.getElementById('btn-fix-detect').addEventListener('click', () => {
    inputDetect.value = currentLiveAzimuth;
});

document.getElementById('btn-fix-course').addEventListener('click', () => {
    inputCourse.value = currentLiveAzimuth;
});

// 3. Автозаполнение текущих даты и времени при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('report-time').value = `${hours}:${minutes}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('report-date').value = `${year}-${month}-${day}`;
});

// 4. Сборка итогового отчета
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

    const isDestroyed = document.getElementById('is-destroyed').checked;

    // Берем зафиксированные значения из полей ввода
    const azimuthDetect = inputDetect.value;
    const azimuthCourse = inputCourse.value;

    // Формируем текст отчета
    const report = generateReportText({
        target,
        detection,
        time,
        date: formattedDate,
        isDestroyed,
        azimuthDetect,
        azimuthCourse
    });

    document.getElementById('report-output').value = report;
});

// 5. Регистрация Service Worker для работы офлайн
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker зарегистрирован!', reg))
            .catch(err => console.error('Ошибка Service Worker', err));
    });
}