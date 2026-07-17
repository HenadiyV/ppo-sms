// Базовый (заводской) список целей
const BASE_TARGETS = [
    "БпЛА типу Гербера",
    "Гелікоптер",
    "БпЛА типу Зала",
    "Зонд",
    "БпЛА типу Молнія",
    "Квадрокоптер",
    "БпЛА типу Невизначений",
    "Крилата Ракета",
    "БпЛА типу Орлан",
    "Літак Великий",
    "БпЛА типу реактивний Шахед",
    "Літак Малий",
    "БпЛА типу Суперкам",
    "Постріли",
    "БпЛА типу ШАХЕД",
    "Робота суміжних підрозділів",
    "Вибух",
    "Спалах в небі",
    "Вибух на землі",
    "FPV-дрон",
    "Виходи"
];

const STORAGE_KEY = 'ppo_targets_directory';

/**
 * Получает список целей из localStorage. 
 * Если его там нет, сохраняет базовый список и возвращает его.
 */
export function getTargets() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error("Помилка парсингу localStorage", e);
        }
    }
    saveTargets(BASE_TARGETS);
    return BASE_TARGETS;
}
/**
 * Сохраняет массив целей в localStorage
 */
// export function saveTargets(targetsArray) {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(targetsArray));
// }

/**
 * Добавляет новую цель в список, если её там еще нет
 */
export function saveTargets(targetsArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targetsArray));
}

export function addTarget(newTarget) {
    const trimmed = newTarget.trim();
    if (!trimmed) return false;

    const currentTargets = getTargets();

    // Проверка дубликатов без учета регистра
    const exists = currentTargets.some(t => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
        return false; // Уже существует
    }

    currentTargets.push(trimmed);
    currentTargets.sort((a, b) => a.localeCompare(b, 'uk'));

    saveTargets(currentTargets);
    return true;
}