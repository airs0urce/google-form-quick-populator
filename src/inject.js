// alert('injected 1');

var input = document.querySelector('input[type=text]');

setTimeout(() => {
    input.value = 'test';
    input.dispatchEvent(new Event('input', { 'bubbles': true }));
}, 50);







