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

// Базовий довідник зброї та відповідних боєприпасів
const BASE_WEAPONS = {
    "ПЗРК Stinger": ["FIM-92A", "FIM-92C", "FIM-92E"],
    "ПЗРК Голка (Игла)": ["9М39", "9М313"],
    "ПЗРК Перун (Piorun)": ["Перун"],
    "ПЗРК Стрела-3": ["9М36"],
    "ЗУ-23-2": ["23-мм снаряд ОФЗ", "23-мм снаряд БЗТ"],
    "Кулемет Браунінг (M2)": ["12.7x99 mm NATO"],
    "Кулемет ДШК": ["12.7x108 мм"],
    "Стрелецька зброя (АК-74)": ["5.45x39 мм"],
    "Стрелецька зброя (ПКМ)": ["7.62x54 ммR"]
};

const STORAGE_KEY = 'ppo_targets_directory';
const WEAPONS_KEY = 'ppo_weapons_directory';

/* --- РОБОТА З ЦІЛЯМИ --- */

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
    // Повертаємо копію базового списку, щоб подальші push/sort
    // не мутували сам масив BASE_TARGETS у пам'яті
    const initial = [...BASE_TARGETS];
    saveTargets(initial);
    return initial;
}
/**
 * Сохраняет массив целей в localStorage
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

/* --- РЕДАКТУВАННЯ ТА ВИДАЛЕННЯ ЦІЛЕЙ --- */

export function updateTarget(oldValue, newValue) {
  const trimmed = newValue.trim();
  if (!trimmed) return false;
  let current = getTargets();
  const index = current.indexOf(oldValue);
  if (index !== -1) {
    current[index] = trimmed;
    current.sort((a, b) => a.localeCompare(b, 'uk'));
    saveTargets(current);
    return true;
  }
  return false;
}

export function deleteTarget(targetValue) {
  let current = getTargets();
  const filtered = current.filter(t => t !== targetValue);
  saveTargets(filtered);
  return true;
}



/* --- РОБОТА ЗІ ЗБРОЄЮ ТА БОЄПРИПАСАМИ --- */
export function getWeaponsData() {
    const stored = localStorage.getItem(WEAPONS_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {
            console.error("Помилка парсингу localStorage для зброї", e);
        }
    }
    // Повертаємо глибоку копію базового довідника, щоб подальші
    // мутації (додавання/видалення БК) не псували саму константу BASE_WEAPONS
    const initial = Object.fromEntries(
        Object.entries(BASE_WEAPONS).map(([weapon, ammoList]) => [weapon, [...ammoList]])
    );
    saveWeaponsData(initial);
    return initial;
}

export function saveWeaponsData(weaponsObj) {
    localStorage.setItem(WEAPONS_KEY, JSON.stringify(weaponsObj));
}

// Додати нову одиницю зброї
export function addWeapon(weaponName) {
    const trimmed = weaponName.trim();
    if (!trimmed) return false;
    const data = getWeaponsData();

    // Перевірка без урахування регістру
    const exists = Object.keys(data).some(k => k.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    data[trimmed] = []; // Створюємо зброю з порожнім списком боєприпасів
    saveWeaponsData(data);
    return true;
}

// Додати боєприпас до існуючої зброї
export function addAmmoToWeapon(weaponName, ammoName) {
    const trimmedAmmo = ammoName.trim();
    if (!trimmedAmmo) return false;
    const data = getWeaponsData();

    if (!data[weaponName]) {
        data[weaponName] = [];
    }

    const exists = data[weaponName].some(a => a.toLowerCase() === trimmedAmmo.toLowerCase());
    if (exists) return false;

    data[weaponName].push(trimmedAmmo);
    data[weaponName].sort((a, b) => a.localeCompare(b, 'uk'));
    saveWeaponsData(data);
    return true;
}

/* --- РЕДАКТУВАННЯ ТА ВИДАЛЕННЯ ЗБРОЇ ТА БОЄПРИПАСІВ --- */

export function updateWeapon(oldName, newName) {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const data = getWeaponsData();
  if (data[oldName]) {
    data[trimmed] = data[oldName];
    delete data[oldName];
    saveWeaponsData(data);
    return true;
  }
  return false;
}

export function deleteWeapon(weaponName) {
  const data = getWeaponsData();
  if (data[weaponName]) {
    delete data[weaponName];
    saveWeaponsData(data);
    return true;
  }
  return false;
}

export function updateAmmo(weaponName, oldAmmo, newAmmo) {
  const trimmed = newAmmo.trim();
  if (!trimmed) return false;
  const data = getWeaponsData();
  if (data[weaponName]) {
    const index = data[weaponName].indexOf(oldAmmo);
    if (index !== -1) {
      data[weaponName][index] = trimmed;
      data[weaponName].sort((a, b) => a.localeCompare(b, 'uk'));
      saveWeaponsData(data);
      return true;
    }
  }
  return false;
}

export function deleteAmmo(weaponName, ammoName) {
  const data = getWeaponsData();
  if (data[weaponName]) {
    data[weaponName] = data[weaponName].filter(a => a !== ammoName);
    saveWeaponsData(data);
    return true;
  }
  return false;
}