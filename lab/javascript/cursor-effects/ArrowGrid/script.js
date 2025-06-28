// Constants to mess with
const innerWidth = window.innerWidth;
const innerDist = innerWidth * 0.06;
const outerDist = innerWidth * 0.4;
const moveDist = innerWidth * 0.04;
const scaleSize = 1.3;

// Elements and other useful things
const arrows = document.getElementsByClassName("arrow");
let positions = [];
const totalAngles = new Array(arrows.length).fill(0);
const curHighlight = document.getElementById("cur-highlight");

// Function for storing the bounding boxes
// of all arrows into `positions`
const pos = () => {
  positions.length = 0;
  for (const a of arrows) {
    a.style.transform = "none";
    positions.push(a.getBoundingClientRect());
  }
};

// Do it now and every time the window resizes
pos();
window.onresize = pos;

// Move and manipulate the arrows one by one
const move = (pos) => {
  for (let i = 0; i < arrows.length; i++) {
    // Calculate the rotation of the arrow
    const a = arrows[i];
    const rect = positions[i];
    const rotation = arrowRotation(i, pos, rect);

    // Calculate the distance of the
    // cursor to the center of the arrow
    const dist = Math.sqrt(
      Math.pow(rect.left + rect.width / 2 - pos.x, 2) +
        Math.pow(rect.top + rect.height / 2 - pos.y, 2)
    );

    // Get color, size and move
    // distance of the arrow
    const col = distColor(dist);
    const size = distSize(dist);
    const len = distLen(dist);

    // Apply all calculated properties
    a.animate(
      [
        {
          transform: `rotate(${rotation}deg) scale(${size}) translateX(${len}px)`,
          backgroundColor: col
        }
      ],
      { duration: 100, fill: "forwards" }
    );
  }

  const w = window.innerWidth * 0.4;
  curHighlight.animate(
    [{ left: `${pos.x - w / 2}px`, top: `${pos.y - w / 2}px` }],
    { duration: 100, fill: "forwards" }
  );
};

// Calculate the rotation of an arrow
// based on the angle to the cursor
const arrowRotation = (i, pos, rect) => {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Calculate the angle the arrow
  // should have now after changing
  const angleNow = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI);

  // Get the last recorded angle
  // and compare it to the last one
  let lastAngle = totalAngles[i] % 360;
  let delta = angleNow - lastAngle;

  // Add/remove one rotation to
  // make `animate` not freak out
  if (delta > 180) delta -= 360;
  else if (delta < -180) delta += 360;

  totalAngles[i] += delta;

  return totalAngles[i];
};

// Get the color of an arrow based
// on distance from the cursor
const distColor = (dist) => {
  if (dist < innerDist) return "#898E91";
  else if (dist > outerDist) return "#262829";
  else {
    const t = easeOutCubic((dist - innerDist) / (outerDist - innerDist));
    const lerp = (a, b) => Math.round(a + t * (b - a));

    const fr = [0x89, 0x8e, 0x91];
    const to = [0x26, 0x28, 0x29];
    const rgb = fr.map((c, i) => lerp(c, to[i]));

    return "#" + rgb.map((x) => x.toString(16).padStart(2, "0")).join("");
  }
};

// Get the size of an arrow based
// on the distance from the cursor
const distSize = (dist) => {
  if (dist < innerDist) {
    const t = 1 - easeOutCubic(dist / innerDist);
    return 1.3 - t / 3;
  } else if (dist > outerDist) return 1;
  else {
    const t = 1 - easeOutCubic((dist - innerDist) / (outerDist - innerDist));
    return 1 + t * (scaleSize - 1);
  }
};

// Get the distance of an arrow to
// the cursor based on the distance
// from the cursor
const distLen = (dist) => {
  if (dist < innerDist) {
    const t = 1 - easeOutCubic(dist / innerDist);
    return t * -moveDist;
  } else if (dist > outerDist) return 50;
  else {
    const t = easeOutCubic((dist - innerDist) / (outerDist - innerDist));
    return t * moveDist;
  }
};

// Easing function for making it smooth
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

// Move all arrows every time
// the mouse moves
document.addEventListener("mousemove", (e) =>
  move({ x: e.clientX, y: e.clientY })
);

document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  move({ x: touch.clientX, y: touch.clientY });
});