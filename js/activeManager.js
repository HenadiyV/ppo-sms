import { getActiveData } from './directory.js';

export class ActiveManager {
    constructor(config) {
        this.activeSelect = document.getElementById(config.activeSelectId);


        if (this.activeSelect) {
            this.init();
        }
        // Подписываемся на обновление справочников
        document.addEventListener('directoryUpdated', () => {
            this.populateActive({ preserveSelection: true });
        });
    }

    init() {
        this.populateActive();

        // Слухач на зміну вибору активності
        this.activeSelect.addEventListener('change', () => {
            this.handleActiveChange();
        });
    }

    // Наповнюємо список активності  
    populateActive({ preserveSelection = false } = {}) {
        const data = getActiveData();
        const sortedActive = Object.values(data).sort((a, b) => a.localeCompare(b, 'uk'));
        //console.log(sortedActive);
        // const previousActive = preserveSelection ? this.activeSelect.value : '';


        // Очищуємо і ставимо дефолтний варіант
        this.activeSelect.innerHTML = '<option value="">-- Активність не відноситься до цілей --</option>';

        sortedActive.forEach(active => {
            const option = document.createElement('option');
            option.value = active;
            option.textContent = active;
            this.activeSelect.appendChild(option);
        });
    }

    handleActiveChange() {
        const selectedActive = this.activeSelect.value;
        if (selectedActive) {
            // Викликаємо подію, щоб повідомити інші модулі про зміну
            document.dispatchEvent(new CustomEvent('activeChanged', {
                detail: {
                    active: selectedActive
                }
            }));
        }
    }
}