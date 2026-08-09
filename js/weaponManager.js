import { getWeaponsData } from './directory.js';

export class WeaponManager {
    constructor(config) {
        this.weaponSelect = document.getElementById(config.weaponSelectId);
        this.ammoSelect = document.getElementById(config.ammoSelectId);
        this.countAmmoInput = document.getElementById(config.countAmmoId);
        this.addBtn = document.getElementById(config.addBtnId);
        this.listContainer = document.getElementById(config.listContainerId);

        // Список усіх видів зброї/БК, доданих до поточного звіту
        this.weaponsUsed = [];

        if (this.weaponSelect && this.ammoSelect) {
            this.init();
        }

        if (this.addBtn && this.listContainer) {
            this.addBtn.addEventListener('click', () => this.addCurrentEntry());
            this._renderList();
        }

        // Подписываемся на обновление справочников
        document.addEventListener('directoryUpdated', () => {
            this.populateWeapons({ preserveSelection: true });
        });
    }

    init() {
        this.populateWeapons();

        // Слухач на зміну вибору зброї
        this.weaponSelect.addEventListener('change', () => {
            this.handleWeaponChange();
        });
    }

    // Наповнюємо список зброї
    populateWeapons({ preserveSelection = false } = {}) {
        const data = getWeaponsData();
        const sortedWeapons = Object.keys(data).sort((a, b) => a.localeCompare(b, 'uk'));

        const previousWeapon = preserveSelection ? this.weaponSelect.value : '';
        const previousAmmo = preserveSelection ? this.ammoSelect.value : '';

        // Очищуємо і ставимо дефолтний варіант
        this.weaponSelect.innerHTML = '<option value="">-- Оберіть зброю --</option>';

        sortedWeapons.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon;
            option.textContent = weapon;
            this.weaponSelect.appendChild(option);
        });

        // Якщо раніше обрана зброя все ще існує в довіднику — відновлюємо вибір
        if (previousWeapon && data[previousWeapon]) {
            this.weaponSelect.value = previousWeapon;
            this.handleWeaponChange();
            if (previousAmmo && [...this.ammoSelect.options].some(o => o.value === previousAmmo)) {
                this.ammoSelect.value = previousAmmo;
            }
            return;
        }

        this.ammoSelect.innerHTML = '<option value="">-- Спочатку оберіть зброю --</option>';
        this.ammoSelect.disabled = true;
    }

    // Обробка зміни зброї
    handleWeaponChange() {
        const selectedWeapon = this.weaponSelect.value;

        if (!selectedWeapon) {
            this.ammoSelect.innerHTML = '<option value="">-- Спочатку оберіть зброю --</option>';
            this.ammoSelect.disabled = true;
            return;
        }

        const data = getWeaponsData();
        const ammoList = data[selectedWeapon] || [];

        // Наповнюємо список боєприпасів
        this.ammoSelect.innerHTML = '<option value="">-- Оберіть боєприпас --</option>';

        if (ammoList.length > 0) {
            ammoList.forEach(ammo => {
                const option = document.createElement('option');
                option.value = ammo;
                option.textContent = ammo;
                this.ammoSelect.appendChild(option);
            });
            this.ammoSelect.disabled = false;
        } else {
            const option = document.createElement('option');
            option.value = "Не вказано";
            option.textContent = "Немає доступних боєприпасів";
            this.ammoSelect.appendChild(option);
            this.ammoSelect.disabled = false;
        }
    }

    // Додає поточний вибір (зброя + БК + кількість) до списку застосованого озброєння
    addCurrentEntry() {
        const weapon = this.weaponSelect.value;
        if (!weapon) {
            this.weaponSelect.focus();
            return;
        }

        const ammo = this.ammoSelect.value;
        const countAmmo = this.countAmmoInput ? this.countAmmoInput.value : '';

        this.weaponsUsed.push({ weapon, ammo, countAmmo });
        this._renderList();

        // Скидаємо поля для зручного додавання наступного виду зброї,
        // залишаючи ту саму зброю обраною — зручно, якщо треба додати ще один БК до неї
        this.ammoSelect.value = '';
        if (this.countAmmoInput) this.countAmmoInput.value = '';
    }

    // Видаляє запис зі списку за індексом
    removeEntry(index) {
        this.weaponsUsed.splice(index, 1);
        this._renderList();
    }

    // Повертає копію списку застосованого озброєння для формування звіту
    getWeaponsUsed() {
        return [...this.weaponsUsed];
    }

    // Очищує список (наприклад, після формування звіту, якщо потрібно почати заново)
    clearWeaponsUsed() {
        this.weaponsUsed = [];
        this._renderList();
    }

    // Перемальовує список доданої зброї під формою вибору
    _renderList() {
        if (!this.listContainer) return;

        this.listContainer.innerHTML = '';

        if (this.weaponsUsed.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Зброю ще не додано до звіту';
            empty.style.cssText = 'font-size: 13px; color: #999; padding: 6px 2px;';
            this.listContainer.appendChild(empty);
            return;
        }

        this.weaponsUsed.forEach((entry, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 6px; background: #fff;';

            const label = document.createElement('span');
            const ammoPart = entry.ammo && entry.ammo !== 'Не вказано' ? ` — ${entry.ammo}` : '';
            const countPart = entry.countAmmo ? ` (${entry.countAmmo} шт.)` : '';
            label.textContent = `⚔️ ${entry.weapon}${ammoPart}${countPart}`;
            label.style.fontSize = '14px';

            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.textContent = '✕';
            btnRemove.style.cssText = 'width: auto; padding: 4px 10px; background: #e74c3c; min-height: auto;';
            btnRemove.addEventListener('click', () => this.removeEntry(index));

            row.appendChild(label);
            row.appendChild(btnRemove);
            this.listContainer.appendChild(row);
        });
    }
}