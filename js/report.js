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