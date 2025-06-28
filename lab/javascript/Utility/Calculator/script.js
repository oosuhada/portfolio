// Funktion zum Hinzufügen von Zeichen zum Display
function appendToDisplay(value) {
    document.getElementById('display').value += value;
}

// Funktion zum Löschen des gesamten Displays (AC)
function clearAll() {
    document.getElementById('display').value = '';
}

// Funktion zum Löschen des letzten Zeichens (C)
function clearLast() {
    const display = document.getElementById('display');
    display.value = display.value.slice(0, -1);
}

// Funktion zur Berechnung der Eingabe
function calculate() {
    const display = document.getElementById('display');
    try {
        // eval() can be a security risk if the input is not controlled.
        // For this calculator, it's acceptable, but not for production code with user-provided scripts.
        display.value = eval(display.value);
    } catch (e) {
        display.value = 'Error';
    }
}

// Event Listener für Tastatur-Eingaben
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        appendToDisplay(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        appendToDisplay(key);
    } else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // Enter 키의 기본 동작(예: 폼 제출) 방지
        calculate();
    } else if (key === 'Backspace') {
        clearLast();
    } else if (key === 'Escape') {
        clearAll();
    }
});