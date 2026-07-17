import { 
  getTargets, addTarget, updateTarget, deleteTarget,
  getWeaponsData, addWeapon, updateWeapon, deleteWeapon,
  addAmmoToWeapon, updateAmmo, deleteAmmo 
} from './directory.js';

export class DbEditor {
  constructor() {
    // Вкладки
    this.tabTargets = document.getElementById('tab-edit-targets');
    this.tabWeapons = document.getElementById('tab-edit-weapons');
    this.panelTargets = document.getElementById('panel-targets');
    this.panelWeapons = document.getElementById('panel-weapons');

    // Элементы целей
    this.newTargetInput = document.getElementById('new-target-db-input');
    this.btnAddTarget = document.getElementById('btn-add-target-db');
    this.targetsListContainer = document.getElementById('db-targets-list');

    // Элементы оружия
    this.newWeaponInput = document.getElementById('new-weapon-db-input');
    this.btnAddWeapon = document.getElementById('btn-add-weapon-db');
    this.weaponsListContainer = document.getElementById('db-weapons-list');

    this.init();
  }

  init() {
    this._initTabs();
    this._initTargetEvents();
    this._initWeaponEvents();

    // Первичный рендер
    this.renderTargets();
    this.renderWeapons();
  }

  // Переключение вкладок "Цили" и "Зброя"
  _initTabs() {
    this.tabTargets.addEventListener('click', () => {
      this.panelTargets.style.display = 'block';
      this.panelWeapons.style.display = 'none';
      this.tabTargets.style.background = '#3498db';
      this.tabTargets.style.color = 'white';
      this.tabWeapons.style.background = '#bdc3c7';
      this.tabWeapons.style.color = '#333';
    });

    this.tabWeapons.addEventListener('click', () => {
      this.panelTargets.style.display = 'none';
      this.panelWeapons.style.display = 'block';
      this.tabWeapons.style.background = '#3498db';
      this.tabWeapons.style.color = 'white';
      this.tabTargets.style.background = '#bdc3c7';
      this.tabTargets.style.color = '#333';
    });
  }

  /* --- СЕКЦИЯ: ЦЕЛИ --- */
  _initTargetEvents() {
    this.btnAddTarget.addEventListener('click', () => {
      const val = this.newTargetInput.value.trim();
      if (val) {
        addTarget(val);
        this.newTargetInput.value = '';
        this.renderTargets();
        this._triggerGlobalUpdate();
      }
    });
  }

  renderTargets() {
    const targets = getTargets();
    this.targetsListContainer.innerHTML = '';

    targets.forEach(target => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;';

      const label = document.createElement('span');
      label.textContent = target;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '5px';

      // Кнопка редактирования
      const btnEdit = document.createElement('button');
      btnEdit.textContent = '✏️';
      btnEdit.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 3px;';
      btnEdit.addEventListener('click', () => {
        const newValue = prompt(`Редагувати ціль "${target}":`, target);
        if (newValue && newValue.trim() !== target) {
          updateTarget(target, newValue);
          this.renderTargets();
          this._triggerGlobalUpdate();
        }
      });

      // Кнопка удаления
      const btnDel = document.createElement('button');
      btnDel.textContent = '❌';
      btnDel.style.cssText = 'border: none; background: transparent; cursor: pointer; padding: 3px;';
      btnDel.addEventListener('click', () => {
        if (confirm(`Ви дійсно хочете видалити ціль "${target}"?`)) {
          deleteTarget(target);
          this.renderTargets();
          this._triggerGlobalUpdate();
        }
      });

      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      row.appendChild(label);
      row.appendChild(actions);
      this.targetsListContainer.appendChild(row);
    });
  }


  /* --- СЕКЦИЯ: ОРУЖИЕ И БК --- */
  _initWeaponEvents() {
    this.btnAddWeapon.addEventListener('click', () => {
      const val = this.newWeaponInput.value.trim();
      if (val) {
        addWeapon(val);
        this.newWeaponInput.value = '';
        this.renderWeapons();
        this._triggerGlobalUpdate();
      }
    });
  }

  renderWeapons() {
    const data = getWeaponsData();
    this.weaponsListContainer.innerHTML = '';

    Object.keys(data).forEach(weapon => {
      const weaponBlock = document.createElement('div');
      weaponBlock.style.cssText = 'border-bottom: 1px solid #ddd; padding: 10px; background: #fff;';

      // Строка оружия
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-weight: bold; color: #2c3e50;';
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = `⚔️ ${weapon}`;

      const weaponActions = document.createElement('div');
      
      const btnEditW = document.createElement('button');
      btnEditW.textContent = '✏️';
      btnEditW.style.cssText = 'border: none; background: transparent; cursor: pointer; margin-right: 5px;';
      btnEditW.addEventListener('click', () => {
        const newWName = prompt(`Нова назва для зброї "${weapon}":`, weapon);
        if (newWName && newWName.trim() !== weapon) {
          updateWeapon(weapon, newWName);
          this.renderWeapons();
          this._triggerGlobalUpdate();
        }
      });

      const btnDelW = document.createElement('button');
      btnDelW.textContent = '❌';
      btnDelW.style.cssText = 'border: none; background: transparent; cursor: pointer;';
      btnDelW.addEventListener('click', () => {
        if (confirm(`Видалити зброю "${weapon}" та всі її боєприпаси?`)) {
          deleteWeapon(weapon);
          this.renderWeapons();
          this._triggerGlobalUpdate();
        }
      });

      weaponActions.appendChild(btnEditW);
      weaponActions.appendChild(btnDelW);
      header.appendChild(titleSpan);
      header.appendChild(weaponActions);
      weaponBlock.appendChild(header);

      // Список боеприпасов для этого оружия
      const ammoList = data[weapon] || [];
      const ammoUl = document.createElement('ul');
      ammoUl.style.cssText = 'margin: 5px 0; padding-left: 20px; font-size: 13px; color: #555;';

      ammoList.forEach(ammo => {
        const li = document.createElement('li');
        li.style.cssText = 'margin-bottom: 3px; display: flex; justify-content: space-between; max-width: 90%;';
        
        const ammoSpan = document.createElement('span');
        ammoSpan.textContent = ammo;

        const ammoActions = document.createElement('span');
        
        // Редактировать БК
        const btnEditA = document.createElement('span');
        btnEditA.textContent = ' ✏️';
        btnEditA.style.cursor = 'pointer';
        btnEditA.addEventListener('click', () => {
          const newAName = prompt(`Редагувати боєприпас "${ammo}":`, ammo);
          if (newAName && newAName.trim() !== ammo) {
            updateAmmo(weapon, ammo, newAName);
            this.renderWeapons();
            this._triggerGlobalUpdate();
          }
        });

        // Удалить БК
        const btnDelA = document.createElement('span');
        btnDelA.textContent = ' ❌';
        btnDelA.style.cursor = 'pointer';
        btnDelA.addEventListener('click', () => {
          if (confirm(`Вилучити боєприпас "${ammo}" зі зброї "${weapon}"?`)) {
            deleteAmmo(weapon, ammo);
            this.renderWeapons();
            this._triggerGlobalUpdate();
          }
        });

        ammoActions.appendChild(btnEditA);
        ammoActions.appendChild(btnDelA);
        li.appendChild(ammoSpan);
        li.appendChild(ammoActions);
        ammoUl.appendChild(li);
      });

      weaponBlock.appendChild(ammoUl);

      // Кнопка быстрого добавления БК к этому оружию
      const addAmmoRow = document.createElement('div');
      addAmmoRow.style.cssText = 'display: flex; gap: 5px; margin-top: 5px;';
      
      const ammoInput = document.createElement('input');
      ammoInput.placeholder = 'Додати боєприпас...';
      ammoInput.style.cssText = 'flex: 1; font-size: 11px; padding: 3px; border: 1px solid #ccc; border-radius: 3px;';

      const btnAddAmmo = document.createElement('button');
      btnAddAmmo.textContent = '+ БК';
      btnAddAmmo.style.cssText = 'width:50px; font-size: 11px; background: #3498db; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;';
      btnAddAmmo.addEventListener('click', () => {
        const val = ammoInput.value.trim();
        if (val) {
          addAmmoToWeapon(weapon, val);
          this.renderWeapons();
          this._triggerGlobalUpdate();
        }
      });

      addAmmoRow.appendChild(ammoInput);
      addAmmoRow.appendChild(btnAddAmmo);
      weaponBlock.appendChild(addAmmoRow);

      this.weaponsListContainer.appendChild(weaponBlock);
    });
  }

  // Кастомное событие, чтобы другие модули (поисковик целей и менеджер оружия) мгновенно обновили свои списки
  _triggerGlobalUpdate() {
    const event = new CustomEvent('directoryUpdated');
    document.dispatchEvent(event);
  }
}