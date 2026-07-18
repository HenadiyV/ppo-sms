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
        // Якщо датчик ще не запущено — запускаємо безпосередньо в момент кліку
        if (!this.isSensorActive) {
            inputEl.value = "Запит датчика...";
            this._startSensors(inputEl);
        }

        if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
            this.states[type] = 'scanning';
            this._updateButtonUI(buttonEl, 'scanning', labelText);
            inputEl.style.backgroundColor = '#e8f8f5';

            // Якщо на датчику вже є якісь дані, відразу виводимо їх
            if (this.currentAzimuth !== 0) {
                inputEl.value = this.currentAzimuth + '°';
            }
        }
        else if (this.states[type] === 'scanning') {
            this.states[type] = 'fixed';
            inputEl.style.backgroundColor = '';
            this._updateButtonUI(buttonEl, 'fixed', labelText);

            const numericVal = parseInt(inputEl.value, 10);
            inputEl.value = (isNaN(numericVal) ? this.currentAzimuth : numericVal) + '°';
        }
    }

    _startSensors(inputEl) {
        if (typeof window === 'undefined') return;

        // ПЕРЕВІРКА iOS (Safari та браузери на iOS 13+)
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permission => {
                    inputEl.value = "iOS: Статус " + permission;
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                        this.isSensorActive = true;
                    }
                })
                .catch(err => {
                    inputEl.value = "Помилка запиту iOS";
                    alert("iOS Error: " + err.message);
                });
        }
        // ПЕРЕВІРКА ANDROID / СТАНДАРТНИХ БРАУЗЕРІВ
        else {
            // Пробуємо підключити абсолютну орієнтацію (компас)
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
                this.isSensorActive = true;
                inputEl.value = "Пошук супутників...";
            }
            // Якщо абсолютної немає, беремо звичайну
            else if ('ondeviceorientation' in window) {
                window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
                this.isSensorActive = true;
                inputEl.value = "Пошук датчика...";
            } else {
                inputEl.value = "Датчик не підтримується";
            }
        }
    }

    deviceOrientationHandler(event) {
        let azimuth = 0;
        let isRelative = false;

        // Перевіряємо наявність апаратних даних від компаса
        if (event.webkitCompassHeading !== undefined) {
            azimuth = Math.round(event.webkitCompassHeading);
        } else if (event.alpha !== null) {
            azimuth = Math.round(360 - event.alpha);
            isRelative = true;
        } else {
            // Якщо подія тригериться, але пристрій лежить нерухомо або не віддає координати
            return;
        }

        this.currentAzimuth = azimuth;

        const suffix = isRelative ? '° (відн.)' : '°';

        // Стрімимо дані ТІЛЬКИ в активні інпути
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