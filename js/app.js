import { Compass } from './compass.js';
import { generateReportText } from './report.js';

// 1. Инициализация компаса
const azimuthDisplay = document.getElementById('azimuth-display');
const compass = new Compass((azimuth) => {
  azimuthDisplay.textContent = `${azimuth}°`;
});

// Кнопка запуска компаса (нужно нажать один раз на экране телефона)
document.getElementById('start-compass').addEventListener('click', () => {
  compass.start();
});

// 2. Установка текущих даты и времени по умолчанию при загрузке
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  
  // Форматируем время в HH:MM
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('report-time').value = `${hours}:${minutes}`;

  // Форматируем дату в YYYY-MM-DD для input
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  document.getElementById('report-date').value = `${year}-${month}-${day}`;
});

// 3. Сборка отчета по нажатию кнопки
document.getElementById('generate-btn').addEventListener('click', () => {
  const target = document.getElementById('target-select').value;
  const detection = document.getElementById('detection-select').value;
  const time = document.getElementById('report-time').value;
  
  // Преобразуем дату из формата YYYY-MM-DD в украинский DD.MM.YYYY для красоты в отчете
  const rawDate = document.getElementById('report-date').value;
  let formattedDate = '--.--.----';
  if (rawDate) {
    const [y, m, d] = rawDate.split('-');
    formattedDate = `${d}.${m}.${y}`;
  }

  const isDestroyed = document.getElementById('is-destroyed').checked;
  const azimuth = compass.getAzimuth();

  // Генерируем текст используя импортированную функцию
  const report = generateReportText({
    target,
    detection,
    time,
    date: formattedDate,
    isDestroyed,
    azimuth
  });

  // Выводим в поле результата
  document.getElementById('report-output').value = report;
});

// 4. Регистрация Service Worker для работы офлайн
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker зарегистрирован!', reg))
      .catch(err => console.error('Ошибка Service Worker', err));
  });
}