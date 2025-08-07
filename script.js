// Константы
const BIRTH_DATE = new Date('2025-08-05T15:05:00+03:00'); // МСК время
const EDITOR_CODE = 'Онли'; // Код для входа в режим редактора
const STORAGE_KEY = 'only_puppy_data';

// Состояние приложения
let isEditorMode = false;
let entries = [];

// DOM элементы
const editorBtn = document.getElementById('editorBtn');
const exitEditorBtn = document.getElementById('exitEditorBtn');
const editorModal = document.getElementById('editorModal');
const editorCodeInput = document.getElementById('editorCode');
const submitCodeBtn = document.getElementById('submitCode');
const cancelCodeBtn = document.getElementById('cancelCode');
const entryForm = document.getElementById('entryForm');
const entriesList = document.getElementById('entriesList');
const ageElement = document.getElementById('age');
const currentWeightElement = document.getElementById('currentWeight');
const trackingDaysElement = document.getElementById('trackingDays');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateStats();
    renderEntries();
    setupEventListeners();
    setDefaultDate();
    // Скрываем форму добавления при загрузке (если не в режиме редактора)
    if (!isEditorMode) {
        document.querySelector('.add-entry-section').style.display = 'none';
    }
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки редактора
    editorBtn.addEventListener('click', showEditorModal);
    exitEditorBtn.addEventListener('click', exitEditorMode);
    submitCodeBtn.addEventListener('click', checkEditorCode);
    cancelCodeBtn.addEventListener('click', hideEditorModal);
    
    // Кнопка сохранения
    document.getElementById('saveBtn').addEventListener('click', manualSave);
    
    // Кнопка очистки данных
    document.getElementById('clearBtn').addEventListener('click', clearStorage);
    
    // Форма добавления записи
    entryForm.addEventListener('submit', handleEntrySubmit);
    
    // Закрытие модального окна по клику вне его
    editorModal.addEventListener('click', function(e) {
        if (e.target === editorModal) {
            hideEditorModal();
        }
    });
    
    // Ввод кода по Enter
    editorCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkEditorCode();
        }
    });
    
    // Защита от копирования
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardCopy);
}

// Функции редактора
function showEditorModal() {
    editorModal.classList.remove('hidden');
    editorCodeInput.focus();
}

function hideEditorModal() {
    editorModal.classList.add('hidden');
    editorCodeInput.value = '';
}

function checkEditorCode() {
    const enteredCode = editorCodeInput.value.trim();
    
    if (enteredCode === EDITOR_CODE) {
        isEditorMode = true;
        updateEditorUI();
        hideEditorModal();
        showNotification('Режим редактора активирован!', 'success');
    } else {
        showNotification('Неверный код!', 'error');
        editorCodeInput.value = '';
        editorCodeInput.focus();
    }
}

function exitEditorMode() {
    isEditorMode = false;
    updateEditorUI();
    showNotification('Режим редактора деактивирован', 'info');
}

function updateEditorUI() {
    if (isEditorMode) {
        editorBtn.classList.add('hidden');
        exitEditorBtn.classList.remove('hidden');
        document.getElementById('saveBtn').classList.remove('hidden');
        document.getElementById('clearBtn').classList.remove('hidden');
        document.body.classList.add('editor-mode');
        // Показываем форму добавления
        document.querySelector('.add-entry-section').style.display = 'block';
    } else {
        editorBtn.classList.remove('hidden');
        exitEditorBtn.classList.add('hidden');
        document.getElementById('saveBtn').classList.add('hidden');
        document.getElementById('clearBtn').classList.add('hidden');
        document.body.classList.remove('editor-mode');
        // Скрываем форму добавления
        document.querySelector('.add-entry-section').style.display = 'none';
    }
    renderEntries(); // Перерисовываем записи для показа/скрытия кнопок удаления
}

// Обработка формы
function handleEntrySubmit(e) {
    e.preventDefault();
    
    // Проверка режима редактора
    if (!isEditorMode) {
        showNotification('Требуется режим редактора для добавления записей!', 'error');
        return;
    }
    
    const formData = new FormData(entryForm);
    const date = formData.get('entryDate');
    const weight = parseInt(formData.get('weight'));
    const photo = formData.get('photo');
    const notes = formData.get('notes');
    
    // Отладочная информация
    console.log('Полученная дата из формы:', date);
    console.log('Полученный вес из формы:', weight);
    console.log('Полученные заметки из формы:', notes);
    console.log('Полученное фото из формы:', photo);
    console.log('Тип даты:', typeof date);
    
    // Проверка обязательных полей
    if (!date || !weight || weight <= 0) {
        showNotification('Пожалуйста, заполните дату и вес!', 'error');
        return;
    }
    
    // Проверка даты - можно добавлять записи на любую дату
    const entryDate = new Date(date);
    console.log('Созданная дата:', entryDate);
    
    // Проверка на дублирование даты
    const existingEntry = entries.find(entry => entry.date === date);
    if (existingEntry) {
        showNotification('Запись на эту дату уже существует!', 'error');
        return;
    }
    
    // Создание новой записи
    const newEntry = {
        id: Date.now(),
        date: date,
        weight: weight,
        notes: notes ? notes.trim() : '',
        timestamp: new Date().toISOString()
    };
    
    console.log('Созданная запись:', newEntry);
    
    // Обработка фото
    if (photo && photo.size > 0) {
        // Проверка размера фото (максимум 10MB до сжатия)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (photo.size > maxSize) {
            showNotification('Размер фото слишком большой! Максимум 10MB.', 'error');
            return;
        }
        
        // Проверка типа файла
        if (!photo.type.startsWith('image/')) {
            showNotification('Пожалуйста, выберите изображение!', 'error');
            return;
        }
        
        // Показываем уведомление о обработке
        showNotification('Обрабатываю фото...', 'info');
        
        // Сжимаем и обрабатываем фото
        compressImage(photo, 800, 0.8)
            .then(compressedPhoto => {
                newEntry.photo = compressedPhoto;
                console.log('Фото успешно сжато и обработано, размер:', newEntry.photo.length, 'символов');
                addEntry(newEntry);
            })
            .catch(error => {
                console.error('Ошибка обработки фото:', error);
                showNotification('Ошибка обработки фото! Попробуйте другое изображение.', 'error');
            });
    } else {
        addEntry(newEntry);
    }
}

function addEntry(entry) {
    // Дополнительная проверка данных перед добавлением
    if (!entry || !entry.date || !entry.weight || entry.weight <= 0) {
        console.error('Попытка добавить некорректную запись:', entry);
        showNotification('Ошибка: некорректные данные записи!', 'error');
        return;
    }
    
    entries.push(entry);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Сохраняем данные и проверяем результат
    const saveSuccess = saveData();
    
    if (saveSuccess) {
        updateStats();
        renderEntries();
        entryForm.reset();
        setDefaultDate();
        showNotification('Запись добавлена и сохранена!', 'success');
    } else {
        // Если сохранение не удалось, удаляем запись из массива
        entries = entries.filter(e => e.id !== entry.id);
        showNotification('Ошибка сохранения! Запись не добавлена.', 'error');
    }
}

function deleteEntry(entryId) {
    if (!isEditorMode) {
        showNotification('Требуется режим редактора для удаления!', 'error');
        return;
    }
    
    // Находим запись для проверки даты
    const entryToDelete = entries.find(entry => entry.id === entryId);
    if (!entryToDelete) {
        showNotification('Запись не найдена!', 'error');
        return;
    }
    
    // Можно удалить любую запись
    
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        entries = entries.filter(entry => entry.id !== entryId);
        saveData();
        updateStats();
        renderEntries();
        showNotification('Запись удалена и сохранена!', 'success');
    }
}

// Рендеринг записей
function renderEntries() {
    if (entries.length === 0) {
        if (isEditorMode) {
            entriesList.innerHTML = '<p style="text-align: center; color: #718096; font-style: italic;">Записей пока нет. Добавьте первую запись!</p>';
        } else {
            entriesList.innerHTML = '<p style="text-align: center; color: #718096; font-style: italic;">Записей пока нет. Войдите в режим редактора для добавления записей.</p>';
        }
        return;
    }
    
    entriesList.innerHTML = entries.map(entry => {
        // Все записи можно редактировать
        const canEdit = true;
        
        console.log('Рендеринг записи:', entry);
        console.log('Фото есть:', !!entry.photo);
        console.log('Заметки есть:', !!entry.notes);
        
        return `
            <div class="entry-card ${!canEdit && isEditorMode ? 'protected-entry' : ''}">
                <div class="entry-header">
                    <span class="entry-date">${formatDate(entry.date)}</span>
                    <span class="entry-weight">${entry.weight} г</span>
                    ${isEditorMode && canEdit ? `<button class="delete-btn" onclick="deleteEntry(${entry.id})">Удалить</button>` : ''}
                    ${isEditorMode && !canEdit ? `<span class="protected-badge">Защищено</span>` : ''}
                </div>
                ${entry.photo ? `<img src="${entry.photo}" alt="Фото щенка" class="entry-photo">` : ''}
                ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Обновление статистики
function updateStats() {
    // Возраст
    const age = calculateAge();
    ageElement.textContent = age;
    
    // Текущий вес
    const latestEntry = entries[entries.length - 1];
    currentWeightElement.textContent = latestEntry ? `${latestEntry.weight} г` : '0 г';
    
    // Количество дней отслеживания
    trackingDaysElement.textContent = entries.length;
}

function calculateAge() {
    // Получаем текущее время в МСК
    const now = new Date();
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    
    // Создаем дату рождения в МСК
    const birthDateMoscow = new Date(BIRTH_DATE.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    
    // Вычисляем разницу в днях
    const diffTime = moscowTime.getTime() - birthDateMoscow.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'Еще не родилась';
    } else if (diffDays === 0) {
        return 'Сегодня родилась!';
    } else if (diffDays === 1) {
        return '1 день';
    } else if (diffDays < 7) {
        return `${diffDays} дня`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        const days = diffDays % 7;
        if (days === 0) {
            return `${weeks} ${weeks === 1 ? 'неделя' : weeks < 5 ? 'недели' : 'недель'}`;
        } else {
            return `${weeks} ${weeks === 1 ? 'неделя' : weeks < 5 ? 'недели' : 'недель'} ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
        }
    } else {
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        if (days === 0) {
            return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
        } else {
            return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
        }
    }
}

// Утилиты
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('ru-RU', options);
}

function setDefaultDate() {
    // Получаем текущую дату в МСК
    const now = new Date();
    const moscowDate = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    const today = moscowDate.toISOString().split('T')[0];
    document.getElementById('entryDate').value = today;
}

// Сохранение и загрузка данных
function saveData() {
    try {
        // Проверяем размер данных перед сохранением
        const dataString = JSON.stringify(entries);
        const dataSize = new Blob([dataString]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB лимит
        
        console.log('Размер данных для сохранения:', dataSize, 'байт');
        
        if (dataSize > maxSize) {
            showNotification('Данные слишком большие для сохранения! Удалите некоторые фото.', 'error');
            return false;
        }
        
        // Проверяем доступное место в localStorage
        let availableSpace = 0;
        try {
            const testKey = 'test_storage_space';
            const testData = 'x'.repeat(1024); // 1KB тестовые данные
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            availableSpace = 5 * 1024 * 1024; // Предполагаем 5MB доступно
        } catch (e) {
            console.warn('Не удалось проверить доступное место:', e);
        }
        
        if (dataSize > availableSpace * 0.8) {
            showNotification('Мало места для сохранения! Очистите кэш браузера.', 'warning');
        }
        
        // Основное сохранение
        localStorage.setItem(STORAGE_KEY, dataString);
        
        // Резервная копия (только если размер данных не слишком большой)
        if (dataSize < 2 * 1024 * 1024) { // 2MB для резервной копии
            localStorage.setItem(STORAGE_KEY + '_backup', dataString);
        }
        
        // Сохранение времени последнего обновления
        localStorage.setItem(STORAGE_KEY + '_timestamp', new Date().toISOString());
        
        console.log('Данные успешно сохранены:', entries.length, 'записей, размер:', dataSize, 'байт');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        
        // Проверяем, не превышен ли лимит localStorage
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            showNotification('Превышен лимит хранилища! Удалите некоторые фото или очистите кэш.', 'error');
            
            // Попытка сохранить без фото
            try {
                const entriesWithoutPhotos = entries.map(entry => {
                    const { photo, ...entryWithoutPhoto } = entry;
                    return entryWithoutPhoto;
                });
                localStorage.setItem(STORAGE_KEY + '_no_photos', JSON.stringify(entriesWithoutPhotos));
                showNotification('Сохранены данные без фото. Фото будут потеряны.', 'warning');
            } catch (backupError) {
                console.error('Ошибка сохранения без фото:', backupError);
            }
        } else {
            showNotification('Ошибка сохранения данных!', 'error');
        }
        
        return false;
    }
}

function loadData() {
    try {
        // Попытка загрузить основные данные
        let savedData = localStorage.getItem(STORAGE_KEY);
        
        // Если основные данные повреждены, пробуем резервную копию
        if (!savedData) {
            savedData = localStorage.getItem(STORAGE_KEY + '_backup');
            if (savedData) {
                showNotification('Загружены данные из резервной копии', 'warning');
            }
        }
        
        // Если и резервная копия повреждена, пробуем данные без фото
        if (!savedData) {
            savedData = localStorage.getItem(STORAGE_KEY + '_no_photos');
            if (savedData) {
                showNotification('Загружены данные без фото из экстренной копии', 'warning');
            }
        }
        
        // Если и экстренная копия повреждена, пробуем старую экстренную копию
        if (!savedData) {
            savedData = localStorage.getItem(STORAGE_KEY + '_emergency');
            if (savedData) {
                showNotification('Загружены данные из старой экстренной копии', 'warning');
            }
        }
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Проверяем, что это массив
            if (!Array.isArray(parsedData)) {
                throw new Error('Данные не являются массивом');
            }
            
            entries = parsedData;
            console.log('Данные успешно загружены:', entries.length, 'записей');
            
            // Проверяем целостность данных
            const validEntries = entries.filter(entry => 
                entry && 
                entry.id && 
                entry.date && 
                entry.weight && 
                typeof entry.weight === 'number' &&
                entry.weight > 0
            );
            
            if (validEntries.length !== entries.length) {
                console.warn('Найдены поврежденные записи:', entries.length - validEntries.length);
                entries = validEntries;
                showNotification(`Загружено ${entries.length} записей (${entries.length - validEntries.length} поврежденных удалено)`, 'warning');
            } else if (entries.length > 0) {
                showNotification(`Загружено ${entries.length} записей`, 'success');
            }
            
            // Сортируем записи по дате
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            
        } else {
            console.log('Нет сохраненных данных, начинаем с пустого списка');
            entries = [];
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных! Попробуйте очистить кэш браузера', 'error');
        entries = []; // Сбрасываем данные при ошибке
    }
}

// Защита от копирования
function preventCopy(e) {
    e.preventDefault();
    return false;
}

function preventContextMenu(e) {
    e.preventDefault();
    return false;
}

function preventKeyboardCopy(e) {
    // Блокировка Ctrl+C, Ctrl+X, Ctrl+A
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
        return false;
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Цвета для разных типов уведомлений
    const colors = {
        success: '#48bb78',
        error: '#e53e3e',
        info: '#667eea',
        warning: '#ed8936'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Функция ручного сохранения данных
function manualSave() {
    try {
        const saveSuccess = saveData();
        
        if (saveSuccess) {
            showNotification('Данные успешно сохранены вручную!', 'success');
            
            // Получаем статус хранилища
            const status = checkStorageStatus();
            
            // Показываем информацию о сохранении
            const saveInfo = document.createElement('div');
            saveInfo.className = 'save-info';
            saveInfo.innerHTML = `
                <div class="save-info-content">
                    <h4>✅ Данные сохранены</h4>
                    <p>Записей: ${entries.length}</p>
                    <p>Фото: ${status ? status.photosCount : 0}</p>
                    <p>Размер: ${status ? status.dataSizeMB + ' MB' : 'N/A'}</p>
                    <p>Использовано: ${status ? status.usagePercent + '%' : 'N/A'}</p>
                    <p>Время: ${new Date().toLocaleString('ru-RU')}</p>
                </div>
            `;
            
            // Стили для информации о сохранении
            saveInfo.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, #48bb78, #38a169);
                color: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(72, 187, 120, 0.4);
                z-index: 10001;
                text-align: center;
                animation: savePulse 0.5s ease-out;
                min-width: 250px;
            `;
            
            document.body.appendChild(saveInfo);
            
            // Удаляем информацию через 3 секунды
            setTimeout(() => {
                if (saveInfo.parentNode) {
                    saveInfo.style.animation = 'saveFadeOut 0.3s ease-in';
                    setTimeout(() => {
                        if (saveInfo.parentNode) {
                            saveInfo.parentNode.removeChild(saveInfo);
                        }
                    }, 300);
                }
            }, 3000);
        } else {
            showNotification('Ошибка сохранения данных!', 'error');
        }
        
    } catch (error) {
        console.error('Ошибка ручного сохранения:', error);
        showNotification('Ошибка при ручном сохранении данных!', 'error');
    }
}

// Функция экспорта данных
function exportData() {
    try {
        const exportData = {
            puppyName: 'Онли',
            birthDate: BIRTH_DATE.toISOString(),
            exportDate: new Date().toISOString(),
            entries: entries,
            totalEntries: entries.length,
            currentWeight: entries.length > 0 ? entries[entries.length - 1].weight : 0
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `only_puppy_data_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Данные экспортированы!', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showNotification('Ошибка экспорта данных!', 'error');
    }
}

// Функция сжатия изображения
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Вычисляем новые размеры
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            // Устанавливаем размеры canvas
            canvas.width = width;
            canvas.height = height;
            
            // Рисуем изображение с новыми размерами
            ctx.drawImage(img, 0, 0, width, height);
            
            // Конвертируем в base64 с заданным качеством
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            console.log('Изображение сжато:', {
                originalSize: file.size,
                compressedSize: compressedDataUrl.length,
                compressionRatio: (file.size / compressedDataUrl.length).toFixed(2)
            });
            
            resolve(compressedDataUrl);
        };
        
        img.onerror = function() {
            reject(new Error('Ошибка загрузки изображения'));
        };
        
        // Загружаем изображение
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Ошибка чтения файла'));
        };
        reader.readAsDataURL(file);
    });
}

// Добавляем CSS анимации для уведомлений и кнопки сохранения
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes savePulse {
        0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes saveFadeOut {
        from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
    }
    
    .editor-mode .entry-card {
        border-left-color: #e53e3e;
    }
    
    .btn-secondary {
        background: linear-gradient(45deg, #718096, #4a5568) !important;
        box-shadow: 0 4px 15px rgba(113, 128, 150, 0.4) !important;
    }
    
    .btn-secondary:hover {
        box-shadow: 0 6px 20px rgba(113, 128, 150, 0.6) !important;
    }
    
    .btn-success {
        background: linear-gradient(45deg, #48bb78, #38a169) !important;
        box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4) !important;
        color: white !important;
    }
    
    .btn-success:hover {
        box-shadow: 0 6px 20px rgba(72, 187, 120, 0.6) !important;
        transform: translateY(-2px);
    }
    
    .btn-success:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style); 

// Функция очистки localStorage
function clearStorage() {
    if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить!')) {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_KEY + '_backup');
            localStorage.removeItem(STORAGE_KEY + '_emergency');
            localStorage.removeItem(STORAGE_KEY + '_no_photos');
            localStorage.removeItem(STORAGE_KEY + '_timestamp');
            
            entries = [];
            updateStats();
            renderEntries();
            showNotification('Все данные очищены!', 'success');
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            showNotification('Ошибка очистки данных!', 'error');
        }
    }
}

// Функция проверки состояния хранилища
function checkStorageStatus() {
    try {
        const dataString = JSON.stringify(entries);
        const dataSize = new Blob([dataString]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        const status = {
            entriesCount: entries.length,
            dataSize: dataSize,
            dataSizeMB: (dataSize / (1024 * 1024)).toFixed(2),
            maxSizeMB: (maxSize / (1024 * 1024)).toFixed(2),
            usagePercent: ((dataSize / maxSize) * 100).toFixed(1),
            hasPhotos: entries.some(entry => entry.photo),
            photosCount: entries.filter(entry => entry.photo).length
        };
        
        console.log('Статус хранилища:', status);
        return status;
    } catch (error) {
        console.error('Ошибка проверки статуса хранилища:', error);
        return null;
    }
} 