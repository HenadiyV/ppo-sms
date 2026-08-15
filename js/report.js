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
 * @param {Array<{weapon: string, ammo: string, countAmmo: string}>} data.weaponsUsed - Список застосованого озброєння (опціонально, може містити декілька видів)
 */
export function generateReportText(data) {

    let report = `${data.time} ${data.date} ${data.position || "Не вказано"}\n`;
    if (data.otherActive) {
        report += `${data.otherActive}\n`;
        report += course(data) ? course(data) + '\n' : '';
    } else {
        report += `Тип цілі: ${data.target || "Не визначено"}\n`;
        report += `Номер цілі: № ${data.targetNumber || "Не вказано"}\n`;
        report += `Кількість: ${data.targetCount || "Не вказано"}\n`;
        report += `${data.detection || "Виявлення цілі не вказано"}\n`;
        report += course(data) ? course(data) + '\n' : '';
        report += targetedTraining(data) ? `${data.isDestroyed}` + '\n' : '';
        // Додаємо блок зброї — може містити декілька видів озброєння в одному звіті
        if (Array.isArray(data.weaponsUsed) && data.weaponsUsed.length > 0) {
            data.weaponsUsed.forEach(entry => {
                if (!entry.weapon) return;
                report += `Витрати БК: ${entry.weapon}\n`;
                const ammoLabel = (entry.ammo && entry.ammo !== "Не вказано") ? entry.ammo : "Не вказано";
                const countLabel = entry.countAmmo || "Не вказано";
                report += `${ammoLabel} Кількість: ${countLabel} шт.\n`;
            });
        }
    }

    return report;
}

function course(data) {
    const parts = [];
    if (data.azimuthDetect) parts.push(`A-${data.azimuthDetect}°`);
    if (data.azimuthCourse) parts.push(`K-${data.azimuthCourse}°`);
    if (data.targetHight) parts.push(`H-${data.targetHight}м`);
    if (data.targetDistance) parts.push(`D-${data.targetDistance}км`);

    if (parts.length === 0) return null;
    return `(${parts.join(' ')})`;
}

function targetedTraining(data) {
    if (data.detection === "Ціль акустично та візуально не виявленно") {
        return null;
    }
    return data.isDestroyed;
}