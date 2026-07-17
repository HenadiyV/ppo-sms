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

export function generateReportText({ target, detection, time, date, isDestroyed, azimuthDetect, azimuthCourse }) {
  const status = isDestroyed ? 'ЗНИЩЕНО' : 'НЕ ЗНИЩЕНО';
  
  const parts = [
    `Ціль: ${target || 'Не вказано'}`,
    `Вияв: ${detection || 'Не вказано'}`,
    `Час: ${time || '--:--'}, Дата: ${date || '--.--.----'}`,
    `Азимут виявлення: ${azimuthDetect ? azimuthDetect + '°' : 'не зафіксовано'}`,
    `Курс руху: ${azimuthCourse ? azimuthCourse + '°' : 'не зафіксовано'}`,
    `Статус: ${status}`
  ];

  return parts.join('\n');
}