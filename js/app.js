import { Compass } from './compass.js';
import { generateReportText } from './report.js';
import { TargetSearch } from './targetSearch.js';

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
  // 1. Запускаем интерактивный поиск целей
  new TargetSearch();

  // 2. Инициализируем компас и привязываем его к интерфейсу
  new Compass({
    startBtnId: 'start-compass',
    displayId: 'azimuth-display',
    btnFixDetectId: 'btn-fix-detect',
    btnFixCourseId: 'btn-fix-course',
    inputDetectId: 'azimuth-detect',
    inputCourseId: 'azimuth-course'
  });

  // 3. Автозаполнение времени и даты
  const now = new Date();
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('report-time').value = `${hours}:${minutes}`;

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  document.getElementById('report-date').value = `${year}-${month}-${day}`;
});

// 4. Генерация отчета
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
  const azimuthDetect = document.getElementById('azimuth-detect').value;
  const azimuthCourse = document.getElementById('azimuth-course').value;

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

// 5. Офлайн-режим (Service Worker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('SW зарегистрирован!', reg))
      .catch(err => console.error('Ошибка SW', err));
  });
}

