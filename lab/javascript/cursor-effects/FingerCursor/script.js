document.addEventListener('DOMContentLoaded', () => {
    const hand = document.getElementById('hand');
    const clickedIcon = document.getElementById('clicked-icon');

    // Function to update hand position based on mouse movement
    function updateHandPosition(e) {
        const x = e.clientX;
        const y = e.clientY;

        // Update hand position
        hand.style.left = x + 'px';
        hand.style.top = y + 'px';

        clickedIcon.style.left = x + 'px';
        clickedIcon.style.top = y + 'px';
    }

    // Listen for mouse movement
    document.addEventListener('mousemove', updateHandPosition);

    // Function to position elements randomly
    function positionElementsRandomly() {
        const elements = document.querySelectorAll('.element-box');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        elements.forEach(el => {
            // Get element dimensions
            const rect = el.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Calculate random position (with padding from edges)
            const padding = 20;
            const maxX = windowWidth - width - padding;
            const maxY = windowHeight - height - padding;

            // Ensure elements don't overlap too much with the title at the top
            const x = Math.max(padding, Math.floor(Math.random() * maxX));
            const y = Math.max(70, Math.floor(Math.random() * maxY));

            el.style.left = x + 'px';
            el.style.top = y + 'px';

            // Add some random rotation for fun
            const rotation = Math.floor(Math.random() * 7) - 3; // -3 to +3 degrees
            el.style.transform = `rotate(${rotation}deg)`;
        });
    }

    // Position elements randomly on load
    window.addEventListener('load', positionElementsRandomly);

    // Reposition on window resize
    window.addEventListener('resize', positionElementsRandomly);

    // Slider functionality
    const slider = document.getElementById("myRange");
    const sliderValue = document.getElementById("sliderValue");

    slider.oninput = function () {
        sliderValue.textContent = this.value;
    }

    document.addEventListener("mousedown", function () {
        clickedIcon.style.display = "block";
        setTimeout(() => {
            clickedIcon.style.display = "none";
        }, 100);
    });

    // Button functionality
    document.getElementById("btnPrimary").addEventListener("click", function () {
        document.getElementById("buttonResult").textContent = "Primary button clicked!";
    });

    document.getElementById("btnSecondary").addEventListener("click", function () {
        document.getElementById("buttonResult").textContent = "Secondary button clicked!";
    });

    document.getElementById("btnDanger").addEventListener("click", function () {
        document.getElementById("buttonResult").textContent = "Danger button clicked!";
    });

    // Knob functionality
    function setupKnob(knobId) {
        const knob = document.getElementById(knobId);
        const knobValue = document.getElementById(knobId + "Value");
        let isDragging = false;
        let startY;
        let startValue;

        // Initialize knob rotation based on its data-value
        const initialValue = parseInt(knob.dataset.value);
        knob.style.transform = `rotate(${initialValue * 2.7}deg)`; // Max rotation 270 degrees
        knobValue.textContent = initialValue;

        knob.addEventListener("mousedown", function (e) {
            isDragging = true;
            startY = e.clientY;
            startValue = parseInt(knob.dataset.value);
            e.preventDefault();
        });

        document.addEventListener("mousemove", function (e) {
            if (isDragging) {
                const deltaY = startY - e.clientY;
                let newValue = startValue + Math.floor(deltaY / 2); // Adjust sensitivity

                // Constrain to min/max
                const min = parseInt(knob.dataset.min);
                const max = parseInt(knob.dataset.max);
                newValue = Math.max(min, Math.min(max, newValue));

                // Update knob rotation and value
                knob.style.transform = `rotate(${newValue * 2.7}deg)`;
                knob.dataset.value = newValue;
                knobValue.textContent = newValue;
            }
        });

        document.addEventListener("mouseup", function () {
            isDragging = false;
        });
    }

    setupKnob("knob1");
    setupKnob("knob2");

    // Dropdown functionality
    const dropdown = document.getElementById("dropdown");
    const selectedOption = document.getElementById("selectedOption");

    dropdown.addEventListener("change", function () {
        selectedOption.textContent = this.options[this.selectedIndex].text;
    });

    // Color picker functionality
    const colorPicker = document.getElementById("colorPicker");
    const colorDisplay = document.getElementById("colorDisplay");

    colorPicker.addEventListener("input", function () {
        colorDisplay.style.backgroundColor = this.value;
    });

    // Toggle switch functionality
    const toggleSwitch = document.getElementById("toggleSwitch");
    const toggleStatus = document.getElementById("toggleStatus");

    toggleSwitch.addEventListener("change", function () {
        toggleStatus.textContent = this.checked ? "ON" : "OFF";
    });

    // Make elements draggable
    const draggables = document.querySelectorAll('.element-box');

    draggables.forEach(draggable => {
        let isDragging = false;
        let offsetX, offsetY;

        // Listen for mousedown on the label or the box itself
        const dragHandle = draggable.querySelector('label') || draggable;

        dragHandle.addEventListener('mousedown', (e) => {
             // Only drag if the mousedown is not on an interactive element inside the box
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT' && !e.target.classList.contains('knob')) {
                isDragging = true;
                draggable.style.zIndex = 10; // Bring to front
                offsetX = e.clientX - draggable.getBoundingClientRect().left;
                offsetY = e.clientY - draggable.getBoundingClientRect().top;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                draggable.style.left = `${e.clientX - offsetX}px`;
                draggable.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            draggable.style.zIndex = 'auto'; // Reset z-index
        });
    });
});