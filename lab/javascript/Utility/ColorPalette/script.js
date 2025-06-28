// HELPER
const rgb2Hex = (rgb) => {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    const hex =
        "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0").toUpperCase();
    return hex;
};

// GET ELEMENTS
const $ = (el) => document.getElementById(el); // just lazy
const container = document.querySelector(".inputs-container");
// slider-elements
const hsl = {
    baseHue: $("baseHue"),
    saturation: $("saturation"),
    lightness: $("lightness"),
    rotation: $("rotation")
};

// PROXY TO LISTEN TO AND ALIGN CHANGES ON THE INPUTS
const data = new Proxy(
    {},
    {
        set(target, property, value, receiver) {
            const fields = document.querySelectorAll(`[data-prop="${property}"]`);
            for (const field of fields) {
                field.value = value;
            }
            updateColors(); // yeah, it does what it says
            return true;
        }
    }
);

// Get the value of elements with corresponding data-attribute
container.addEventListener("input", (event) => {
    data[event.target.dataset.prop] = event.target.value;
});

// Create an array to store the color and color code information
const colorData = [];

const updateColors = () => {
    const setCSSVariable = (prop, value) =>
        document.documentElement.style.setProperty(prop, value);

    // change the values of the css-variables to input-values
    setCSSVariable("--base-hue", hsl.baseHue.value);
    setCSSVariable("--saturation", hsl.saturation.value + "%");
    setCSSVariable("--lightness", hsl.lightness.value + "%");
    setCSSVariable("--rotation", hsl.rotation.value);

    const colorBlocks = document.querySelectorAll(".base-color");
    colorBlocks.forEach((block, index) => {
        const computedStyle = window.getComputedStyle(block);
        const computedColor = computedStyle.getPropertyValue("background-color");
        const colorCode = rgb2Hex(computedColor);

        // color-codes in rgb and hex
        block.innerHTML = `${computedColor} <br> ${colorCode}`;

        // Update color data with new values
        colorData[index] = {
            color: computedColor,
            code: colorCode
        };
    });
};

// SAVE THE PALETTE TO HTML FILE
const downloadPalette = () => {
    // Create HTML content for the file
    let fileContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Color Palette</title>
            <style>
                body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
                .color-block-container { display: flex; flex-direction: column; align-items: center; }
                .color-block {
                    width: 150px;
                    height: 150px;
                    border: 1px solid #ccc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 0.9em;
                    color: #333;
                    margin-bottom: 5px;
                    border-radius: 5px;
                    box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
                }
                .color-code {
                    font-size: 0.8em;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h1>Your Custom Color Palette</h1>
    `;

    // Iterate over the color data and create color blocks with color codes
    colorData.forEach(({ color, code }) => {
        fileContent += `
            <div class="color-block-container">
                <div class="color-block" style="background-color: ${color};"></div>
                <div class="color-code">
                    ${color}<br>
                    ${code}
                </div>
            </div>
        `;
    });

    fileContent += `
        </body>
        </html>
    `;

    // Create a new Blob object with the HTML content as data
    const blob = new Blob([fileContent], { type: "text/html" });

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "my_color_palette.html";
    link.click();
};

$("saveButton").addEventListener("click", downloadPalette);

// Initial color update
// Set initial values for the proxy to ensure UI and CSS variables are synced
data.baseHue = hsl.baseHue.value;
data.saturation = hsl.saturation.value;
data.lightness = hsl.lightness.value;
data.rotation = hsl.rotation.value;

updateColors();