window.initWidgetPlatform = function(config) {
  const button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.position = 'fixed';
  button.style.bottom = '1rem';
  button.style.right = '1rem';
  button.style.zIndex = 9999;
  button.style.padding = '1rem';
  button.style.borderRadius = '50%';
  button.style.background = '#2563eb';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.fontSize = '1.5rem';
  button.onclick = function () {
    alert('Widget activated! ID: ' + config.id);
  };
  document.body.appendChild(button);
};
