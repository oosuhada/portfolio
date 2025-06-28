const cursor_obj = document.querySelector(".cursor");

function cursor_change(value) {
    cursor_obj.innerHTML = value;
}

function move_cursor(event) {
    let x, y;
    if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    cursor_obj.style.left = x + "px";
    cursor_obj.style.top = y + "px";
}

function handle_mousedown(event) {
    cursor_obj.classList.add("mousedown");
    move_cursor(event);
}

function handle_mouseup() {
    cursor_obj.classList.remove("mousedown");
}

// Assign mouse events
window.onmousedown = handle_mousedown;
window.onmousemove = move_cursor;
window.onmouseup = handle_mouseup;

// Assign touch events
window.ontouchstart = handle_mousedown;
window.ontouchmove = move_cursor;
window.ontouchend = handle_mouseup;