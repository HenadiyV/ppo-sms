export class Compass {
    constructor(config) {
        this.display = document.getElementById(config.displayId);
        this.btnFixDetect = document.getElementById(config.btnFixDetectId);
        this.btnFixCourse = document.getElementById(config.btnFixCourseId);
        this.inputDetect = document.getElementById(config.inputDetectId);
        this.inputCourse = document.getElementById(config.inputCourseId);

        this.states = {
            detect: 'idle', // 'idle', 'scanning', 'fixed'
            course: 'idle'
        };

        this.currentAzimuth = 0;
        this.isSensorActive = false;

        // Жестко привязываем контекст
        this.deviceOrientationHandler = this.deviceOrientationHandler.bind(this);

        this._initEvents();
    }

    _initEvents() {
        if (this.btnFixDetect && this.inputDetect) {
            this.btnFixDetect.addEventListener('click', () => {
                this._processClick('detect', this.btnFixDetect, this.inputDetect, 'Виявлення');
            });
        }

        if (this.btnFixCourse && this.inputCourse) {
            this.btnFixCourse.addEventListener('click', () => {
                this._processClick('course', this.btnFixCourse, this.inputCourse, 'Курс');
            });
        }
    }

    _processClick(type, buttonEl, inputEl, labelText) {
        // Если датчик еще не активен — пробуем запустить
        if (!this.isSensorActive) {
            inputEl.value = "Активація...";
            this._startSensors(inputEl);
        }

        if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
            this.states[type] = 'scanning';
            this._updateButtonUI(buttonEl, 'scanning', labelText);
            inputEl.style.backgroundColor = '#e8f8f5';
            inputEl.value = this.currentAzimuth + '°';
        }
        else if (this.states[type] === 'scanning') {
            this.states[type] = 'fixed';
            inputEl.style.backgroundColor = '';
            this._updateButtonUI(buttonEl, 'fixed', labelText);

            // Фиксируем чистую цифру
            const numericVal = parseInt(inputEl.value, 10);
            inputEl.value = (isNaN(numericVal) ? this.currentAzimuth : numericVal) + '°';
        }
    }

    _startSensors(inputEl) {
        if (typeof window === 'undefined') return;

        // Проверка на iOS с промисами
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permission => {
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                        this.isSensorActive = true;
                    } else {
                        inputEl.value = "iOS: Відхилено";
                    }
                })
                .catch(err => {
                    inputEl.value = "Помилка iOS";
                    console.error(err);
                });
        }
        // Android и стандартные браузеры
        else {
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
                this.isSensorActive = true;
            } else if ('ondeviceorientation' in window) {
                window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                this.isSensorActive = true;
            } else {
                inputEl.value = "Не підтримується";
            }
        }
    }

    deviceOrientationHandler(event) {
        let azimuth = 0;
        let isRelative = false;

        if (event.webkitCompassHeading !== undefined) {
            azimuth = Math.round(event.webkitCompassHeading);
        } else if (event.alpha !== null) {
            azimuth = Math.round(360 - event.alpha);
            isRelative = true;
        } else {
            return;
        }

        this.currentAzimuth = azimuth;

        // Стримим только в те поля, которые сейчас сканируются
        const suffix = isRelative ? '° (відн.)' : '°';

        if (this.states.detect === 'scanning' && this.inputDetect) {
            this.inputDetect.value = azimuth + suffix;
        }
        if (this.states.course === 'scanning' && this.inputCourse) {
            this.inputCourse.value = azimuth + suffix;
        }
        if (this.display) {
            this.display.textContent = azimuth + '°';
        }
    }

    _updateButtonUI(buttonEl, state, labelText) {
        if (!buttonEl) return;
        if (state === 'scanning') {
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