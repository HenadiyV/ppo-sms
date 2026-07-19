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
        //alert('Init');
    }

    // Загальний контролер для обох кнопок (КОД ПОВНІСТЮ ВАШ, БЕЗ ЗМІН)
    async _handleButtonClick(type, buttonEl, inputEl, labelText) {
        // 1. Якщо датчики ще взагалі не запущені — запускаємо їх при першому кліку
        if (!this.isSensorActive) {
            const started = await this._startSensors();
            if (!started) return; // Якщо доступ відхилено — виходимо
        }

        // 2. Керуємо станом конкретної кнопки
        if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
            // Переводимо в режим сканування
            this.states[type] = 'scanning';
            this._updateButtonUI(buttonEl, 'scanning', labelText);
            inputEl.style.backgroundColor = '#e8f8f5'; // Підсвічуємо інпут, який зараз оновлюється
        }
        else if (this.states[type] === 'scanning') {
            // Друге натискання — фіксуємо поточний азимут
            this.states[type] = 'fixed';
            inputEl.value = this.currentAzimuth;
            inputEl.style.backgroundColor = ''; // Прибираємо підсвітку
            this._updateButtonUI(buttonEl, 'fixed', labelText);

            // Якщо жодне з полів більше не сканує — зупиняємо датчики повністю,
            // щоб не витрачати батарею і не отримувати зайві оновлення
            if (!this._hasActiveScanning()) {
                this._stopSensors();
            }
        }
    }

    // Чи сканує зараз хоч одне з полів (виявлення або курс)
    _hasActiveScanning() {
        return this.states.detect === 'scanning' || this.states.course === 'scanning';
    }

    // Зупинка датчиків орієнтації: знімаємо слухачі й скидаємо прапорець активності
    _stopSensors() {
        if (!this.isSensorActive) return;

        if (this.deviceOrientationHandler) {
            window.removeEventListener('deviceorientation', this.deviceOrientationHandler, true);
        }
        if (this.deviceOrientationAbsoluteHandler) {
            window.removeEventListener('deviceorientationabsolute', this.deviceOrientationAbsoluteHandler, true);
        }

        this.isSensorActive = false;
    }

    // Запуск системних датчиків орієнтації
    async _startSensors() {
        if (typeof window === 'undefined') return false;

        // Прапорець: як тільки прийшла хоч одна подія з "справжнім" абсолютним
        // азимутом (Android deviceorientationabsolute), ігноруємо паралельні
        // "відносні" події deviceorientation, щоб показання не смикались
        this._hasAbsoluteFix = false;

        const processEvent = (event, isAbsoluteChannel) => {
            if (this._hasAbsoluteFix && !isAbsoluteChannel) return;

            let azimuth = null;
            let isRelative = false;

            if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
                // iOS Safari: вже готовий магнітний азимут
                azimuth = Math.round(event.webkitCompassHeading);
            } else if (event.alpha !== null && event.alpha !== undefined) {
                azimuth = Math.round(360 - event.alpha);
                isRelative = !(isAbsoluteChannel || event.absolute === true);
            }

            if (azimuth === null) return; // подія без корисних даних — ігноруємо

            if (isAbsoluteChannel) this._hasAbsoluteFix = true;

            this.currentAzimuth = ((azimuth % 360) + 360) % 360;
            this._streamToActiveInputs(this.currentAzimuth, isRelative);
        };

        this.deviceOrientationHandler = (event) => processEvent(event, false);
        this.deviceOrientationAbsoluteHandler = (event) => processEvent(event, true);

        try {
            // iOS 13+ вимагає явного дозволу користувача перед доступом до датчиків
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    this._handleGlobalError('Доступ відхилено');
                    return false;
                }
            }

            // Слухаємо ОБИДВІ події одночасно:
            // - 'deviceorientation' — універсальна, працює всюди, включно з
            //    емуляцією через Chrome DevTools (Sensors) на ПК;
            // - 'deviceorientationabsolute' — точніший справжній компас на Android,
            //    коли пристрій його підтримує.
            window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', this.deviceOrientationAbsoluteHandler, true);
            }

            this.isSensorActive = true;
            return true;
        } catch (error) {
            this._handleGlobalError(error.message || 'Помилка датчиків');
            return false;
        }
    }

    // ДОПРАЦЮВАНО ТІЛЬКИ ТУТ: Стрімінг даних в реальному часі
    _streamToActiveInputs(azimuth, isRelative) {
        const suffix = isRelative ? '° (відн.)' : '°';

        // Якщо кнопка перейшла в режим сканування, але інпут ще пустий —
        // або якщо дані просто оновлюються в реальному часі:
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

    // Динамічна зміна кольору та тексту кнопок залежно від стану (КОД ПОВНІСТЮ ВАШ)
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