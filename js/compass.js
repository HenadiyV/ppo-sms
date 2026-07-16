export class Compass {
  constructor(onUpdateCallback) {
    this.onUpdate = onUpdateCallback; // Функция, которая будет обновлять экран
    this.azimuth = 0;
  }

  // Метод для запроса доступа к датчикам ориентации
  async start() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // Специальный запрос для iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === 'granted') {
            this._initListener();
          } else {
            alert('Доступ до компасу відхилено!');
          }
        } catch (error) {
          console.error(error);
          alert('Помилка запиту доступу до датчиків.');
        }
      } else {
        // Для Android и старых iOS
        this._initListener();
      }
    } else {
      alert('Ваш пристрій не підтримує вимірювання азимуту.');
    }
  }

  _initListener() {
    window.addEventListener('deviceorientationabsolute', (e) => this._handleOrientation(e), true);
    // Резервный слушатель, если абсолютная ориентация недоступна
    window.addEventListener('deviceorientation', (e) => this._handleOrientation(e), true);
  }

  _handleOrientation(event) {
    let heading = null;

    // Для iOS (webkitCompassHeading показывает градусы от севера напрямую)
    if (event.webkitCompassHeading) {
      heading = event.webkitCompassHeading;
    } 
    // Для Android (используем alpha, если датчик откалиброван как абсолютный)
    else if (event.alpha !== null) {
      // Корректируем направление (360 - alpha)
      heading = 360 - event.alpha;
    }

    if (heading !== null) {
      this.azimuth = Math.round(heading);
      if (this.onUpdate) {
        this.onUpdate(this.azimuth);
      }
    }
  }

  getAzimuth() {
    return this.azimuth;
  }
}