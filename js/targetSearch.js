import { getTargets, addTarget } from './directory.js';

export class TargetSearch {
  constructor() {
    // Находим все элементы на странице
    this.searchInput = document.getElementById('target-search');
    this.hiddenInput = document.getElementById('target-select');
    this.dropdown = document.getElementById('target-dropdown-results');
    this.listContainer = document.getElementById('targets-list-container');
    this.quickAddBox = document.getElementById('add-new-suggest-box');
    this.quickAddSpan = document.getElementById('new-target-name-span');
    this.btnQuickAdd = document.getElementById('btn-quick-add');
    this.clearBtn = document.getElementById('clear-target-search');

    this._initEvents();
    // Подписываемся на обновление справочников
document.addEventListener('directoryUpdated', () => {
  this.filterAndRender(this.searchInput.value);
});
  }

  // Запуск всех слушателей событий
  _initEvents() {
    // Открытие списка при фокусе
    this.searchInput.addEventListener('focus', () => {
      this.filterAndRender(this.searchInput.value);
      this.dropdown.style.display = 'block';
    });

    // Фильтрация при вводе текста
    this.searchInput.addEventListener('input', () => {
      const value = this.searchInput.value;
      this.clearBtn.style.display = value ? 'block' : 'none';
      this.filterAndRender(value);
    });

    // Кнопка быстрой очистки (крестик)
    this.clearBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.hiddenInput.value = '';
      this.clearBtn.style.display = 'none';
      this.filterAndRender('');
      this.searchInput.focus();
    });

    // Создание новой цели прямо из поиска
    this.btnQuickAdd.addEventListener('click', () => {
      const newValue = this.searchInput.value.trim();
      if (newValue) {
        addTarget(newValue); 
        this.selectValue(newValue);
      }
    });

    // Закрытие списка при клике в любом другом месте экрана
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#target-search') && !e.target.closest('#target-dropdown-results')) {
        this.dropdown.style.display = 'none';
      }
    });
  }

  // Логика фильтрации и отрисовки вариантов
  filterAndRender(query = '') {
    const allTargets = getTargets();
    const normalizedQuery = query.toLowerCase().trim();
    
    const filtered = allTargets.filter(target => 
      target.toLowerCase().includes(normalizedQuery)
    );

    this.listContainer.innerHTML = '';

    if (filtered.length > 0) {
      filtered.forEach(target => {
        const item = document.createElement('div');
        item.textContent = target;
        item.style.padding = '10px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #f0f0f0';
        
        item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f1f1f1');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
        
        item.addEventListener('click', () => {
          this.selectValue(target);
        });
        this.listContainer.appendChild(item);
      });
    } else {
      const noResult = document.createElement('div');
      noResult.textContent = 'Нічого не знайдено';
      noResult.style.padding = '10px';
      noResult.style.color = '#777';
      this.listContainer.appendChild(noResult);
    }

    // Проверяем, нужно ли показать кнопку создания
    const exactMatchExists = allTargets.some(t => t.toLowerCase() === normalizedQuery);
    if (normalizedQuery.length > 0 && !exactMatchExists) {
      this.quickAddSpan.textContent = query.trim();
      this.quickAddBox.style.display = 'block';
    } else {
      this.quickAddBox.style.display = 'none';
    }
  }

  // Фиксация выбранного значения
  selectValue(value) {
    this.searchInput.value = value;
    this.hiddenInput.value = value;
    this.dropdown.style.display = 'none';
    this.clearBtn.style.display = 'block';
  }

  
}