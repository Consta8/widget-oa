(function () {
  window.initWidgetPlatform = function (config) {
    config = config || {};
    // Найти URL текущего скрипта, чтобы определить путь до локального index.html
    let scriptElem = document.currentScript;
    if (!scriptElem) {
      const scripts = document.getElementsByTagName('script');
      scriptElem = scripts[scripts.length - 1];
    }
    const scriptSrc = scriptElem.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/')) + '/';
    // Создаем iframe для чата
    const iframe = document.createElement('iframe');
    // Устанавливаем источник для iframe - локальная страница index.html
    iframe.src = baseUrl + 'index.html' + (config.id ? '?id=' + encodeURIComponent(config.id) : '');
    // Стили для iframe
    iframe.style.position = 'fixed';
    iframe.style.bottom = config.buttonMargin || '1rem';
    iframe.style.right = config.buttonMargin || '1rem';
    iframe.style.width = config.iframeWidth || '400px';
    iframe.style.height = config.iframeHeight || '600px';
    iframe.style.border = 'none';
    iframe.style.zIndex = 999999;
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    iframe.style.display = 'none';
    // Функция добавления iframe и кнопки после загрузки DOM
    function addWidgetElements() {
      document.body.appendChild(iframe);
      // Создаем кнопку для открытия/скрытия виджета
      const button = document.createElement('button');
      button.innerHTML = '💬';
      button.style.position = 'fixed';
      button.style.bottom = config.buttonMargin || '1rem';
      button.style.right = config.buttonMargin || '1rem';
      button.style.width = config.buttonSize || '3.5rem';
      button.style.height = config.buttonSize || '3.5rem';
      button.style.backgroundColor = config.buttonBackgroundColor || '#2563eb';
      button.style.color = config.buttonColor || 'white';
      button.style.borderRadius = '50%';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.fontSize = '1.5rem';
      button.style.zIndex = 999998;
      // Обработчик клика: показать/скрыть iframe
      button.onclick = () => {
        iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
      };
      document.body.appendChild(button);
    }
    // Если DOM уже загружен, сразу добавляем элементы, иначе ждём события
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      addWidgetElements();
    } else {
      document.addEventListener('DOMContentLoaded', addWidgetElements);
    }
  };
})();
