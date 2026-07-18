export class Compass {
    /**
     * @param {Object} config - Конфігурація елементів інтерфейсу
     * @param {string} config.displayId - ID текстового поля відображення градусів (загальний або опціональний)
     * @param {string} config.btnFixDetectId - ID кнопки фіксації азимуту виявлення
     * @param {string} config.btnFixCourseId - ID кнопки фіксації азимуту руху
     * @param {string} config.inputDetectId - ID інпуту результату азимуту виявлення
     * @param {string} config.inputCourseId - ID інпуту результату азимуту руху
     */
    constructor(config) {
        this.display = document.getElementById(config.displayId);
        this.btnFixDetect = document.getElementById(config.btnFixDetectId);
        this.btnFixCourse = document.getElementById(config.btnFixCourseId);
        this.inputDetect = document.getElementById(config.inputDetectId);
        this.inputCourse = document.getElementById(config.inputCourseId);

        // Стан для кожного напрямку: "idle" (очікування), "scanning" (активний пошук), "fixed" (зафіксовано)
        this.states = {
            detect: 'idle',
            course: 'idle'
        };

        this.currentAzimuth = 0;
        this.isSensorActive = false;
        this.deviceOrientationHandler = null;

        this._initEvents();
    }

    _initEvents() {
        // Обробка кнопки Азимуту Виявлення
        if (this.btnFixDetect && this.inputDetect) {
            this.btnFixDetect.addEventListener('click', async () => {
                await this._handleButtonClick('detect', this.btnFixDetect, this.inputDetect, 'Виявлення');
            });
        }

        // Обробка кнопки Азимуту Курсу (Руху)
        if (this.btnFixCourse && this.inputCourse) {
            this.btnFixCourse.addEventListener('click', async () => {
                await this._handleButtonClick('course', this.btnFixCourse, this.inputCourse, 'Курс');
            });
        }
    }

    // Загальний контролер для обох кнопок
    // async _handleButtonClick(type, buttonEl, inputEl, labelText) {
    //     // 1. Якщо датчики ще взагалі не запущені — запускаємо їх при першому кліку
    //     if (!this.isSensorActive) {
    //         // МИТТЄВИЙ ВІДГУК: Показуємо статус запуску, щоб користувач бачив роботу програми
    //         inputEl.value = "Запуск датчиків...";

    //         const started = await this._startSensors();
    //         if (!started) return; // Якщо доступ відхилено — виходимо
    //     }

    //     // 2. Керуємо станом конкретної кнопки
    //     if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
    //         // Переводимо в режим сканування
    //         this.states[type] = 'scanning';
    //         this._updateButtonUI(buttonEl, 'scanning', labelText);
    //         inputEl.style.backgroundColor = '#e8f8f5'; // Підсвічуємо інпут, який зараз оновлюється

    //         // ДОПРАЦЮВАННЯ: Миттєво записуємо поточне значення з датчика (або 0°, якщо пристрій ще не поворухнувся),
    //         // щоб інпут відразу заповнився актуальними даними і не залишався порожнім.
    //         inputEl.value = `${this.currentAzimuth}°`;
    //     }
    //     else if (this.states[type] === 'scanning') {
    //         // Друге натискання — фіксуємо поточний азимут
    //         this.states[type] = 'fixed';
    //         inputEl.value = `${this.currentAzimuth}°`; // ДОПРАЦЮВАННЯ: Фіксуємо чисте значення з градусом
    //         inputEl.style.backgroundColor = ''; // Прибираємо підсвітку
    //         this._updateButtonUI(buttonEl, 'fixed', labelText);
    //     }
    // }

    // Загальний контролер для обох кнопок
    async _handleButtonClick(type, buttonEl, inputEl, labelText) {
        // 1. АКТИВАЦІЯ ДАТЧИКА (Строго першою дією без жодних затримок DOM)
        if (!this.isSensorActive) {
            const started = await this._startSensors();
            if (!started) return; // Якщо доступ відхилено — виходимо
        }

        // 2. Керуємо станом конкретної кнопки
        if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
            // Переводимо в режим сканування
            this.states[type] = 'scanning';
            this._updateButtonUI(buttonEl, 'scanning', labelText);
            inputEl.style.backgroundColor = '#e8f8f5'; // Підсвічуємо інпут
            
            // ВІДОБРАЖЕННЯ ДАНИХ ОДРАЗУ: Записуємо значення відразу після активації стану сканування.
            // Якщо датчик вже надіслав першу подію, тут буде реальний азимут. 
            // Якщо подія ще не прийшла — показуємо 0° або статус пошуку, але інпут НЕ пустий.
            inputEl.value = this.currentAzimuth ? `${this.currentAzimuth}°` : "0°";
        }
        else if (this.states[type] === 'scanning') {
            // Друге натискання — фіксуємо поточний азимут
            this.states[type] = 'fixed';
            inputEl.value = `${this.currentAzimuth}°`;
            inputEl.style.backgroundColor = ''; // Прибираємо підсвітку
            this._updateButtonUI(buttonEl, 'fixed', labelText);
        }
    }

    // Запуск системних датчиків орієнтації
    async _startSensors() {
        if (typeof window === 'undefined') return false;

        this.deviceOrientationHandler = (event) => {
            let azimuth = 0;
            let isRelative = false;

            if (event.webkitCompassHeading !== undefined) {
                azimuth = Math.round(event.webkitCompassHeading);
            } else if (event.alpha !== null) {
                azimuth = Math.round(360 - event.alpha);
                isRelative = true;
            }

            this.currentAzimuth = azimuth;

            // Миттєво оновлюємо інпути, які зараз перебувають у режимі сканування
            this._streamToActiveInputs(azimuth, isRelative);
        };

        try {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                    this.isSensorActive = true;
                    return true;
                } else {
                    this._handleGlobalError('Доступ відхилено');
                    return false;
                }
            } else {
                if ('ondeviceorientationabsolute' in window) {
                    window.addEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
                } else {
                    window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                }
                this.isSensorActive = true;
                return true;
            }
        } catch (error) {
            this._handleGlobalError(error.message || 'Помилка датчиків');
            return false;
        }
    }

    // Стрімінг даних в реальному часі тільки в ті інпути, які зараз "сканують"
    _streamToActiveInputs(azimuth, isRelative) {
        const suffix = isRelative ? '° (відн.)' : '°';

        if (this.states.detect === 'scanning' && this.inputDetect) {
            this.inputDetect.value = `${azimuth}${suffix}`;
        }
        if (this.states.course === 'scanning' && this.inputCourse) {
            this.inputCourse.value = `${azimuth}${suffix}`;
        }

        // Якщо старий загальний дисплей все ще потрібен в HTML — оновлюємо і його
        if (this.display) {
            this.display.textContent = `${azimuth}°`;
            this.display.style.color = isRelative ? '#f39c12' : '#27ae60';
        }
    }

    // Динамічна зміна кольору та тексту кнопок залежно від стану
    _updateButtonUI(buttonEl, state, labelText) {
        if (!buttonEl) return;

        if (state === 'scanning') {
            buttonEl.textContent = `🛑 Фіксувати ${labelText}`;
            buttonEl.style.backgroundColor = '#e74c3c'; // Червона (йде запис)
            buttonEl.style.color = '#fff';
        } else if (state === 'fixed') {
            buttonEl.textContent = `🔄 Перезаписати ${labelText}`;
            buttonEl.style.backgroundColor = '#27ae60'; // Зелена (успішно зафіксовано)
            buttonEl.style.color = '#fff';
        }
    }

    _handleGlobalError(errorMessage) {
        alert(`Помилка компаса: ${errorMessage}`);
        if (this.display) {
            this.display.textContent = `Помилка: ${errorMessage}`;
            this.display.style.color = '#e74c3c';
        }
    }
}