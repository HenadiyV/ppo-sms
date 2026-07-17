export class Compass {
  /**
   * @param {Object} config - Конфігурація елементів інтерфейсу
   * @param {string} config.startBtnId - ID кнопки увімкнення/вимкнення
   * @param {string} config.displayId - ID текстового поля відображення градусів
   * @param {string} config.btnFixDetectId - ID кнопки фіксації азимуту виявлення
   * @param {string} config.btnFixCourseId - ID кнопки фіксації азимуту руху
   * @param {string} config.inputDetectId - ID інпуту результату азимуту виявлення
   * @param {string} config.inputCourseId - ID інпуту результату азимуту руху
   */
  constructor(config) {
    // Зберігаємо елементи DOM
    this.startBtn = document.getElementById(config.startBtnId);
    this.display = document.getElementById(config.displayId);
    this.btnFixDetect = document.getElementById(config.btnFixDetectId);
    this.btnFixCourse = document.getElementById(config.btnFixCourseId);
    this.inputDetect = document.getElementById(config.inputDetectId);
    this.inputCourse = document.getElementById(config.inputCourseId);

    // Внутрішній стан компаса
    this.currentAzimuth = 0;
    this.isActive = false;
    this.deviceOrientationHandler = null;

    this._initEvents();
  }

  // Приватний метод для ініціалізації кліків по кнопкам компаса
  _initEvents() {
    // Перемикач компаса (Вкл/Выкл)
    if (this.startBtn) {
      this.startBtn.addEventListener('click', async () => {
        if (!this.isActive) {
          await this.start();
        } else {
          this.stop();
        }
      });
    }

    // Фіксація азимуту виявлення
    if (this.btnFixDetect && this.inputDetect) {
      this.btnFixDetect.addEventListener('click', () => {
        this.inputDetect.value = this.currentAzimuth;
      });
    }

    // Фіксація азимуту руху
    if (this.btnFixCourse && this.inputCourse) {
      this.btnFixCourse.addEventListener('click', () => {
        this.inputCourse.value = this.currentAzimuth;
      });
    }
  }

  async start() {
    if (typeof window === 'undefined') return;

    this.display.textContent = 'Очікування датчиків...';
    this.display.style.color = '#f39c12';

    // Обробник події орієнтації пристрою
    this.deviceOrientationHandler = (event) => {
      let azimuth = 0;
      let isRelative = false;

      // Спроба отримати абсолютний азимут (Android/Chrome)
      if (event.webkitCompassHeading !== undefined) {
        azimuth = Math.round(event.webkitCompassHeading);
      } else if (event.alpha !== null) {
        // Якщо абсолютного немає, використовуємо альфа (відносний)
        azimuth = Math.round(360 - event.alpha);
        isRelative = true;
      }

      this.currentAzimuth = azimuth;
      this._updateUI(azimuth, isRelative);
    };

    try {
      // Запит дозволу для iOS 13+
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
          this._setUIActive(true);
        } else {
          this._handleError('Доступ до датчиків відхилено');
        }
      } else {
        // Для Android та старіших версій
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
        } else {
          window.addEventListener('deviceorientation', this.deviceOrientationHandler, true);
        }
        this._setUIActive(true);
      }
    } catch (error) {
      this._handleError(error.message || 'Помилка ініціалізації датчиків');
    }
  }

  stop() {
    if (this.deviceOrientationHandler) {
      window.removeEventListener('deviceorientationabsolute', this.deviceOrientationHandler, true);
      window.removeEventListener('deviceorientation', this.deviceOrientationHandler, true);
    }
    this._setUIActive(false);
    this.currentAzimuth = 0;
  }

  _updateUI(azimuth, isRelative) {
    if (!this.display) return;
    
    if (isRelative) {
      this.display.textContent = `${azimuth}° (відносний)`;
      this.display.style.color = '#f39c12';
    } else {
      this.display.textContent = `${azimuth}°`;
      this.display.style.color = '#27ae60';
    }
  }

  _setUIActive(active) {
    this.isActive = active;
    if (!this.startBtn || !this.display) return;

    if (active) {
      this.startBtn.textContent = 'Вимкнути компас';
      this.startBtn.style.backgroundColor = '#c0392b';
    } else {
      this.startBtn.textContent = 'Увімкнути компас';
      this.startBtn.style.backgroundColor = '#34495e';
      this.display.textContent = '0°';
      this.display.style.color = '#333';
    }
  }

  _handleError(errorMessage) {
    if (this.display) {
      this.display.textContent = `Помилка: ${errorMessage}`;
      this.display.style.color = '#e74c3c';
    }
    this._setUIActive(false);
  }
}
