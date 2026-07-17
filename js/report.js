/**
 * Генерує фінальний текстовий звіт для копіювання
 * @param {Object} data - Дані форми
 * @param {string} data.target - Вибрана ціль
 * @param {string} data.detection - Спосіб виявлення (візуально/акустично)
 * @param {string} data.time - Час події
 * @param {string} data.date - Дата події (дд.мм.рррр)
 * @param {boolean} data.isDestroyed - Чи збита ціль
 * @param {string} data.azimuthDetect - Азимут виявлення
 * @param {string} data.azimuthCourse - Азимут курсу (руху)
 * @param {string} data.weapon - Використана зброя (опціонально)
 * @param {string} data.ammo - Використаний боєприпас (опціонально)
 */
export function generateReportText(data) {
   
    let report = `${data.time} ${data.date} ${data.position || "Не вказано"}\n`;
    report += `Тип цілі: ${data.target || "Не визначено"}\n`;
    report += `№ ${data.targetNumber || "Не вказано"}\n`;
    report += `Кількість:${data.targetCount || "Не вказано"}\n`;
    report += `${data.detection || "Не вказано"}\n`;
    report += `(А-${data.azimuthDetect ? data.azimuthDetect + '°' : 'не вказано'} К-${data.azimuthCourse ? data.azimuthCourse + '°' : 'не вказано'})\n`;
    report += ` ${data.isDestroyed}\n`;
    // Додаємо блок зброї, якщо вона була обрана
    if (data.weapon) {
        report += `Витрати БК: ${data.weapon}\n`;
        if (data.ammo && data.ammo !== "Не вказано") {
            report += `${data.ammo} Кількість: ${data.countAmmo} шт. \n`;
        } else {
            report += `Кількість: ${data.countAmmo} шт.`;
        }
    }




    return report;
}
