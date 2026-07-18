export class Compass {
    constructor(config) {
        this.display = document.getElementById(config.displayId);
        this.btnFixDetect = document.getElementById(config.btnFixDetectId);
        this.btnFixCourse = document.getElementById(config.btnFixCourseId);
        this.inputDetect = document.getElementById(config.inputDetectId);
        this.inputCourse = document.getElementById(config.inputCourseId);

        this.states = {
            detect: 'idle',
            course: 'idle'
        };

        this.currentAzimuth = 0;
        this.isSensorActive = false;

        // ЖОРСТКА ПРИВ'ЯЗКА КОНТЕКСТУ, щоб не губився `this` в асинхронних подіях
        this.deviceOrientationHandler = this.deviceOrientationHandler.bind(this);

        this._initEvents();
    }

    _initEvents() {
        if (this.btnFixDetect && this.inputDetect) {
            this.btnFixDetect.addEventListener('click', async () => {
                await this._handleButtonClick('detect', this.btnFixDetect, this.inputDetect, 'Виявлення');
            });
        }

        if (this.btnFixCourse && this.inputCourse) {
            this.btnFixCourse.addEventListener('click', async () => {
                await this._handleButtonClick('course', this.btnFixCourse, this.inputCourse, 'Курс');
            });
        }
    }

    async _handleButtonClick(type, buttonEl, inputEl, labelText) {
        if (this.states[type] === 'idle' || this.states[type] === 'fixed') {

            inputEl.value = "Запуск датчиків...";
            inputEl.style.backgroundColor = '#fef9e7';
            buttonEl.textContent = `⏳ Запуск...`;
            buttonEl.style.backgroundColor = '#f39c12';

            if (!this.isSensorActive) {
                const started = await this._startSensors(inputEl);
                if (!started) {
                    // Якщо функція повернула false, повідомлення про помилку вже записано в інпут всередині _startSensors
                    this._updateButtonUI(buttonEl, 'idle', labelText);
                    return;
                }
            }

            this.states[type] = 'scanning';
            this._updateButtonUI(buttonEl, 'scanning', labelText);
            inputEl.style.backgroundColor = '#e8f8f5';
            inputEl.value = `${this.currentAzimuth}°`;
        }
        else if (this.states[type] === 'scanning') {
            this.states[type] = 'fixed';
            const cleanValue = parseInt(inputEl.value, 10) || this.currentAzimuth;
            inputEl.value = `${cleanValue}°`;
            inputEl.style.backgroundColor = '';
            this._updateButtonUI(buttonEl, 'fixed', labelText);
        }
    }

    async _startSensors(debugInput) {
        if (typeof window === 'undefined') return false;

        try {
            // Перевірка для iOS (інструменти отримання дозволу)
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                    this.isSensorActive = true;
                    return true;
                } else {
                    debugInput.value = "Дозвіл відхилено в iOS";
                    return false;
                }
            }
            // Для Android та інших браузерів
            else {
                if ('ondeviceorientationabsolute' in window) {
                    window.addEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
                    this.isSensorActive = true;
                    return true;
                } else if ('ondeviceorientation' in window) {
                    window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                    this.isSensorActive = true;
                    return true;
                } else {
                    debugInput.value = "Датчик не підтримується пристроєм";
                    return false;
                }
            }
        } catch (error) {
            debugInput.value = "Помилка: " + error.message;
            console.error('Помилка датчиків:', error);
            return false;
        }
    }

    // Обробник події датчика орієнтації
    deviceOrientationHandler(event) {
        let azimuth = 0;
        let isRelative = false;

        if (event.webkitCompassHeading !== undefined) {
            azimuth = Math.round(event.webkitCompassHeading);
        } else if (event.alpha !== null) {
            azimuth = Math.round(360 - event.alpha);
            isRelative = true;
        } else {
            // Якщо подія прийшла, але дані пусті
            return;
        }

        this.currentAzimuth = azimuth;
        this._streamToActiveInputs(azimuth, isRelative);
    }

    _streamToActiveInputs(azimuth, isRelative) {
        const suffix = isRelative ? '° (відн.)' : '°';

        if (this.states.detect === 'scanning' && this.inputDetect) {
            this.inputDetect.value = `${azimuth}${suffix}`;
        }
        if (this.states.course === 'scanning' && this.inputCourse) {
            this.inputCourse.value = `${azimuth}${suffix}`;
        }

        if (this.display) {
            this.display.textContent = `${azimuth}°`;
        }
    }

    _updateButtonUI(buttonEl, state, labelText) {
        if (!buttonEl) return;

        if (state === 'idle') {
            buttonEl.textContent = `🧭 Заміряти азимут ${labelText.toLowerCase()}`;
            buttonEl.style.backgroundColor = '';
            buttonEl.style.color = '';
        } else if (state === 'scanning') {
            buttonEl.textContent = `🛑 Фіксувати ${labelText}`;
            buttonEl.style.backgroundColor = '#e74c3c';
            buttonEl.style.color = '#fff';
        } else if (state === 'fixed') {
            buttonEl.textContent = `🔄 Перезаписати ${labelText}`;
            buttonEl.style.backgroundColor = '#27ae60';
            buttonEl.style.color = '#fff';
        }
    }
}