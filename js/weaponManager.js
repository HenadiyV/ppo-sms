import { getWeaponsData } from './directory.js';

export class WeaponManager {
    constructor(config) {
        this.weaponSelect = document.getElementById(config.weaponSelectId);
        this.ammoSelect = document.getElementById(config.ammoSelectId);

        if (this.weaponSelect && this.ammoSelect) {
            this.init();
        }
        // Подписываемся на обновление справочников
        document.addEventListener('directoryUpdated', () => {
            this.populateWeapons();
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
    populateWeapons() {
        const data = getWeaponsData();
        const sortedWeapons = Object.keys(data).sort((a, b) => a.localeCompare(b, 'uk'));

        // Очищуємо і ставимо дефолтний варіант
        this.weaponSelect.innerHTML = '<option value="">-- Оберіть зброю --</option>';

        sortedWeapons.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon;
            option.textContent = weapon;
            this.weaponSelect.appendChild(option);
        });

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
}