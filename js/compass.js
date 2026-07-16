export class Compass {
    constructor(onUpdateCallback, onErrorCallback) {
        this.onUpdate = onUpdateCallback;       // Функция для вывода азимута
        this.onError = onErrorCallback;         // Функция для вывода ошибок на экран
        this.azimuth = 0;
        this.hasActiveListener = false;
    }

    async start() {
        // Проверяем наличие API в браузере
        if (!window.DeviceOrientationEvent) {
            this._sendError("Браузер не поддерживает датчики ориентации.");
            return;
        }

        // Запрос разрешения для iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    this._initListener();
                } else {
                    this._sendError("Доступ до датчиків відхилено користувачем.");
                }
            } catch (error) {
                this._sendError("Помилка запиту дозволу на iOS: " + error.message);
            }
        } else {
            // Для Android (включая Vivo) запуск происходит напрямую
            this._initListener();
        }
    }

    _initListener() {
        if (this.hasActiveListener) return;

        // Для Android критически важно сначала пробовать absolute-версию события
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', (e) => this._handleOrientation(e), true);
            this.hasActiveListener = true;
        } else if ('ondeviceorientation' in window) {
            // Резервный вариант, если absolute не поддерживается
            window.addEventListener('deviceorientation', (e) => this._handleOrientation(e), true);
            this.hasActiveListener = true;
        } else {
            this._sendError("Не вдалося підписатися на події датчиків.");
        }
    }

    _handleOrientation(event) {
        let heading = null;

        // 1. Попытка для iOS
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            heading = event.webkitCompassHeading;
        }
        // 2. Попытка для Android (абсолютный азимут)
        else if (event.absolute === true && event.alpha !== null) {
            heading = 360 - event.alpha;
        }
        // 3. Резервная попытка для Android (может быть неточным без калибровки, но покажет хоть что-то)
        else if (event.alpha !== null) {
            heading = 360 - event.alpha;
        }

        if (heading !== null) {
            this.azimuth = Math.round(heading);
            if (this.onUpdate) {
                this.onUpdate(this.azimuth);
            }
        } else {
            this._sendError("Датчик повернув порожні дані (можливо, немає компаса в телефоні).");
        }
    }

    getAzimuth() {
        return this.azimuth;
    }

    _sendError(message) {
        console.warn(message);
        if (this.onError) {
            this.onError(message);
        }
    }
}