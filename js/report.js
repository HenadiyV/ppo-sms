export function generateReportText({ target, detection, time, date, isDestroyed, azimuth }) {
  const status = isDestroyed ? 'ЗНИЩЕНО' : 'НЕ ЗНИЩЕНО';
  
  // Собираем строки отчета (сначала время, затем дата)
  const parts = [
    `Ціль: ${target || 'Не вказано'}`,
    `Вияв: ${detection || 'Не вказано'}`,
    `Час: ${time || '--:--'}, Дата: ${date || '--.--.----'}`,
    `Азимут: ${azimuth}°`,
    `Статус: ${status}`
  ];

  return parts.join('\n');
}