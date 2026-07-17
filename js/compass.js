export class Compass {
    constructor(onUpdateCallback, onErrorCallback) {
        this.onUpdate = onUpdateCallback;
        this.onError = onErrorCallback;
        this.azimuth = 0;
        this.hasActiveListener = false;
        this.isRelative = false;

        // Сохраняем ссылку на функцию обработчика, чтобы потом её можно было удалить
        this._boundHandleOrientation = (e) => this._handleOrientation(e);
    }

    async start() {
        if (!window.DeviceOrientationEvent) {
            this._sendError("Браузер не поддерживает датчики.");
            return;
        }

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === 'granted') {
                    this._initListener();
                } else {
                    this._sendError("Доступ відхилено.");
                }
            } catch (error) {
                this._sendError("Помилка запиту дозволу: " + error.message);
            }
        } else {
            this._initListener();
        }
    }

    // Новый метод для остановки компаса
    stop() {
        if (!this.hasActiveListener) return;

        window.removeEventListener('deviceorientationabsolute', this._boundHandleOrientation, true);
        window.removeEventListener('deviceorientation', this._boundHandleOrientation, true);

        this.hasActiveListener = false;
        this.azimuth = 0;
    }

    _initListener() {
        if (this.hasActiveListener) return;

        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', this._boundHandleOrientation, true);
            this.hasActiveListener = true;
        } else if ('ondeviceorientation' in window) {
            window.addEventListener('deviceorientation', this._boundHandleOrientation, true);
            this.hasActiveListener = true;
        } else {
            this._sendError("Датчики не підтримуються.");
        }
    }

    _handleOrientation(event) {
        let heading = null;

        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            heading = event.webkitCompassHeading;
            this.isRelative = false;
        } else if (event.absolute === true && event.alpha !== null) {
            heading = 360 - event.alpha;
            this.isRelative = false;
        } else if (event.alpha !== null) {
            heading = 360 - event.alpha;
            this.isRelative = true;
        }

        if (heading !== null) {
            this.azimuth = Math.round(heading);
            if (this.onUpdate) {
                this.onUpdate(this.azimuth, this.isRelative);
            }
        } else {
            this._sendError("Датчик повернув порожні дані.");
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