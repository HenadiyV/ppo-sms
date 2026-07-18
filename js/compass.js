export class Compass {
  /**
   * @param {Object} config - Конфігурація елементів інтерфейсу
   * @param {string} config.displayId - ID текстового поля відображення градусів
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

    // Стан для кожного напрямку: "idle", "scanning", "fixed"
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
    // Якщо кнопка була в режимі очікування або вже зафіксована
    if (this.states[type] === 'idle' || this.states[type] === 'fixed') {
      
      // МИТТЄВИЙ ВІДГУК: відразу показуємо користувачу, що процес пішов
      inputEl.value = "Запуск датчиків...";
      inputEl.style.backgroundColor = '#fef9e7'; // Тимчасовий колір запуску
      buttonEl.textContent = `⏳ Запуск...`;
      buttonEl.style.backgroundColor = '#f39c12';

      // Якщо датчики ще не активні — запускаємо їх
      if (!this.isSensorActive) {
        const started = await this._startSensors();
        if (!started) {
          inputEl.value = "Помилка доступу";
          inputEl.style.backgroundColor = '';
          this._updateButtonUI(buttonEl, 'idle', labelText);
          return; 
        }
      }

      // Переводимо в режим активного сканування
      this.states[type] = 'scanning';
      this._updateButtonUI(buttonEl, 'scanning', labelText);
      inputEl.style.backgroundColor = '#e8f8f5'; // Стабільний колір сканування
      
      // Відразу ж записуємо поточне значення, яке вже є на датчику, 
      // щоб інпут не був порожнім ні секунди
      inputEl.value = `${this.currentAzimuth}°`;
    } 
    // Якщо друге натискання — фіксуємо
    else if (this.states[type] === 'scanning') {
      this.states[type] = 'fixed';
      
      // Отримуємо чисте число без букв, якщо раптом зафіксували в момент стрімінгу
      const cleanValue = parseInt(inputEl.value, 10) || this.currentAzimuth;
      
      inputEl.value = `${cleanValue}°`;
      inputEl.style.backgroundColor = ''; // Скидаємо підсвітку
      this._updateButtonUI(buttonEl, 'fixed', labelText);
    }
  }

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
      console.error('Помилка ініціалізації датчиків:', error);
      return false;
    }
  }

  _streamToActiveInputs(azimuth, isRelative) {
    const suffix = isRelative ? '° (відн.)' : '°';

    // Оновлюємо текстове поле в реальному часі ТІЛЬКИ якщо статус "scanning"
    if (this.states.detect === 'scanning' && this.inputDetect) {
      this.inputDetect.value = `${azimuth}${suffix}`;
    }
    if (this.states.course === 'scanning' && this.inputCourse) {
      this.inputCourse.value = `${azimuth}${suffix}`;
    }

    if (this.display) {
      this.display.textContent = `${azimuth}°`;
      this.display.style.color = isRelative ? '#f39c12' : '#27ae60';
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
