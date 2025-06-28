const canvas = document.getElementById('myCanvas');
const gl = canvas.getContext('webgl2');

const engine = document.getElementById("engine");
const knock = document.getElementById("knock");
const popup = document.getElementById("popup");
const drop = document.getElementById("drop");
const twoClick = document.getElementById("twoClick");

let phongOn = true;
let linesOn = true;
let ombraOn = true;
let knobsOn = true;
let setOn = false;

let turnLeft = false;
let turnRight = false;
let driveFwd = false;
let driveBck = false;

let cam = 1;
let camLabel = document.getElementById("camLabel");
let camPrev = document.getElementById("camPrev");
let camNext = document.getElementById("camNext");

let phongLbl = document.getElementById("phongLbl");
let linesLbl = document.getElementById("linesLbl");
let ombraLbl = document.getElementById("ombraLbl");
let knobsLbl = document.getElementById("knobsLbl");

let phongChk = document.getElementById("phongOn");
let linesChk = document.getElementById("linesOn");
let ombraChk = document.getElementById("ombraOn");
let knobsChk = document.getElementById("knobsOn");
let setChk = document.getElementById("setOn");

let itsBold;

let yNow = 0;       // Current Y position
let angleNow = 0;   // Current angle in radians
let xNow = 0;       // Current X position
const V = 0.3;      // Velocity
const rotV = 0.02;    // Rotation velocity
const studW = 1.5;

const arenaXY = { x: 20.0, y: 20.0 }; // Arena center (assuming origin for simplicity)
const arenaR = 75.0;      // Arena radius (assuming 1 for normalized coords)
const objAB = { x: 2.0*studW, y: 4.0*studW }; // Object dimensions (half-width and half-height)
const obstXY = arenaXY; // Obstacle center
const obstAB = { x: 4.5*studW, y: 5.5*studW };  // Obstacle dimensions

// Function to get the corners of a rotated rectangle
function getRect(center, angle, AB, corners) {
    const cosA = Math.cos(-angle);
    const sinA = Math.sin(-angle);
    const rotMat = [
        [cosA, sinA],
        [-sinA, cosA]
    ];

    const localCorners = [
        { x: -AB.x, y: -AB.y },
        { x: AB.x, y: -AB.y },
        { x: AB.x, y: AB.y },
        { x: -AB.x, y: AB.y }
    ];

    for (let i = 0; i < 4; i++) {
        const localX = localCorners[i].x;
        const localY = localCorners[i].y;
        corners[i] = {
            x: center.x + rotMat[0][0] * localX + rotMat[0][1] * localY,
            y: center.y + rotMat[1][0] * localX + rotMat[1][1] * localY
        };
    }
    return corners; // Added return
}

function project(point, axis) {
    const normalizedAxis = { // avoid modifying original axis
        x: axis.x / Math.sqrt(axis.x * axis.x + axis.y * axis.y),
        y: axis.y / Math.sqrt(axis.x * axis.x + axis.y * axis.y)
    };
    return point.x * normalizedAxis.x + point.y * normalizedAxis.y;
}

let previousCollision = false;

function updatePositionAndAngle(deltaTime) {
    let nextAngle = angleNow;
    let nextPos = { x: xNow, y: yNow };

    let dir = 1;
    let vFactor = 1;

    if (driveBck) {
        dir *= -1;
        vFactor = 2;
    }

    if (driveFwd || driveBck) {
        if (turnLeft) {
            nextAngle += rotV * dir / vFactor;
        }
        if (turnRight) {
            nextAngle -= rotV * dir / vFactor;
        }
    }

    // Calculate intended movement
    let nextMove = { x: 0, y: 0 };
    if (driveFwd) {
        nextMove.x -= Math.sin(nextAngle) * V / vFactor;
        nextMove.y += Math.cos(nextAngle) * V / vFactor;
    }
    if (driveBck) {
        nextMove.x += Math.sin(nextAngle) * V / vFactor;
        nextMove.y -= Math.cos(nextAngle) * V / vFactor;
    }

    nextPos.x += nextMove.x;
    nextPos.y += nextMove.y;

    // collision detection
    let cornersObjNext = [];
    cornersObjNext = getRect(nextPos, nextAngle, objAB, cornersObjNext); // Pass empty array

    let gonnaCrash = false;

    // check arena collision
    for (let i = 0; i < 4; i++) {
        const distanceToCenter = Math.sqrt(
            (cornersObjNext[i].x - arenaXY.x) * (cornersObjNext[i].x - arenaXY.x) +
            (cornersObjNext[i].y - arenaXY.y) * (cornersObjNext[i].y - arenaXY.y)
        );
        if (distanceToCenter > arenaR) {
            gonnaCrash = true;
            break;
        }
    }


    // check Duplo block collision (SAT)
    if (!gonnaCrash) {
        const rightObj = { x: Math.cos(nextAngle), y: Math.sin(nextAngle) };
        const upObj = { x: -Math.sin(nextAngle), y: Math.cos(nextAngle) };

        let cornersObst = [];
        cornersObst = getRect(obstXY, 0, obstAB, cornersObst);  // Pass empty array

        const axes = [
            rightObj,
            upObj,
            { x: 1, y: 0 },
            { x: 0, y: 1 }
        ];

        for (let i = 0; i < 4; i++) {
            const axis = axes[i];

            let minA = 1e10, maxA = -1e10;
            for (let j = 0; j < 4; j++) {
                const p = project(cornersObjNext[j], axis);
                minA = Math.min(minA, p);
                maxA = Math.max(maxA, p);
            }

            let minB = 1e10, maxB = -1e10;
            for (let j = 0; j < 4; j++) {
                const p = project(cornersObst[j], axis);
                minB = Math.min(minB, p);
                maxB = Math.max(maxB, p);
            }

            if (maxA < minB || maxB < minA) {
                gonnaCrash = false;
                break;
            }
            gonnaCrash = true;

        }
    }

    // handle collision
    if (!gonnaCrash) {
        xNow = nextPos.x;
        yNow = nextPos.y;
        angleNow = nextAngle;
    }

    return { x: xNow, y: yNow, angle: angleNow };
}

phongChk.addEventListener('change', (event) => {
    phongOn = !phongOn;
    itsBold = phongLbl.classList.contains("checked");
    if (itsBold) { phongLbl.classList.remove("checked"); }
    else { phongLbl.classList.add("checked"); }
});

linesChk.addEventListener('change', (event) => {
    linesOn = !linesOn;
    itsBold = linesLbl.classList.contains("checked");
    if (itsBold) { linesLbl.classList.remove("checked"); }
    else { linesLbl.classList.add("checked"); }
});

ombraChk.addEventListener('change', (event) => {
    ombraOn = !ombraOn;
    itsBold = ombraLbl.classList.contains("checked");
    if (itsBold) { ombraLbl.classList.remove("checked"); }
    else { ombraLbl.classList.add("checked"); }
});

knobsChk.addEventListener('change', (event) => {
    knobsOn = !knobsOn;
    itsBold = knobsLbl.classList.contains("checked");
    if (itsBold) { knobsLbl.classList.remove("checked"); }
    else { knobsLbl.classList.add("checked"); }
});

setChk.addEventListener('change', (event) => {
    setOn = !setOn;

    if (setChk.checked) { popup.play(); }
    else { drop.play(); }
});

camPrev.addEventListener('click', (event) => { twoClick.play(); })
camNext.addEventListener('click', (event) => { twoClick.play(); })

const camTypeElement = document.querySelector("#camType");

camPrev.addEventListener('click', (event) => {
    if (cam > 1) {
        cam -= 1;
    } else {
        cam = 5; // Updated max camera mode (removed 2.5D)
    }
    updateCamAndCaption();
});

camNext.addEventListener('click', (event) => {
    if (cam < 5) { // Updated max camera mode (removed 2.5D)
        cam += 1;
    } else {
        cam = 1;
    }
    updateCamAndCaption();
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') {
        phongOn = !phongOn;
        itsBold = phongLbl.classList.contains("checked");
        if (itsBold) { phongLbl.classList.remove("checked"); }
        else { phongLbl.classList.add("checked"); }
    }
    if (event.key === 'l' || event.key === 'L') {
        linesOn = !linesOn;
        itsBold = linesLbl.classList.contains("checked");
        if (itsBold) { linesLbl.classList.remove("checked"); }
        else { linesLbl.classList.add("checked"); }
    }
    if (event.key === 'o' || event.key === 'O') {
        ombraOn = !ombraOn;
        itsBold = ombraLbl.classList.contains("checked");
        if (itsBold) { ombraLbl.classList.remove("checked"); }
        else { ombraLbl.classList.add("checked"); }
    }
    if (event.key === 'k' || event.key === 'K') {
        knobsOn = !knobsOn;
        itsBold = knobsLbl.classList.contains("checked");
        if (itsBold) { knobsLbl.classList.remove("checked"); }
        else { knobsLbl.classList.add("checked"); }
    }

    if (event.key >= '1' && event.key <= '5') { // Updated key range for camera modes
        cam = parseInt(event.key, 10);
        updateCamAndCaption();
    }

    if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp' ) { driveFwd = true; engine.play(); }
    if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown' ) { driveBck = true; engine.play(); }
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft' ) { turnLeft = true; }
    if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight' ) { turnRight = true; }
});

function updateCamAndCaption() {
    updateCaption(camTypeElement, cam);
}

function updateCaption(element, cam) {
    if (cam === 1) {
        element.textContent = "3rd person perspective";
    } else if (cam === 2) {
        element.textContent = "Top-down perspective";
    } else if (cam === 3) {
        element.textContent = "Motion tracking"; // Formerly Camera Mode 4
    } else if (cam === 4) {
        element.textContent = "Front view"; // Formerly Camera Mode 5
    } else if (cam === 5) {
        element.textContent = "Side view"; // Formerly Camera Mode 6
    }
}

window.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp' ) { driveFwd = false; }
    if (event.key === 's' || event.key === 'S' || event.key === 'ArrowDown' ) { driveBck = false; }
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft' ) { turnLeft = false; }
    if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight' ) { turnRight = false; }
});

const vertexShaderSource = `#version 300 es

in vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec2 iResolution; // Declare as vec2 (canvas width and height)
uniform vec2 iMouse;
uniform float iTime;
uniform bool iPhong;
uniform bool iLines;
uniform bool iOmbra;
uniform bool iKnobs;
uniform int iCam;
uniform bool iLeft;
uniform bool iRight;
uniform bool iForward;
uniform bool iBack;
uniform vec3 iWASD;

out vec4 fragColor;

// Shadertoy code here

#define PI 3.14159265359
#define rot(a) mat2(cos(a-vec4(0,11,33,0)))

const float studW = 1.5;
const vec2 obstAB = vec2(studW*4.5, studW*5.5); // Half of obstacle's width and height
const vec2 objAB = vec2(studW*2., studW*4.);
const vec2 obstXY = vec2(20.0, 20.0);    // Position of the obstacle (relative to arena center)

const vec2 arenaXY = obstXY; // Center of the arena (0, 0)
const float arenaR = 75.0;       // Radius of the arena

float yPosition;
float angle;
float xPosition;

float sdSeg(in vec3 p, in vec3 a, in vec3 b) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float smin(float d1, float d2, float k) {
    if (iLines) {
        float h = max(k - abs(d1 - d2), 0.) / k;
        return min(d1, d2) - h * h * k * (1. / 4.);
    }
    else { return min(d1, d2); }
}

float smax(float d1, float d2, float k) {
    if (iLines) {
        float h = max(k - abs(d1 - d2), 0.) / k;
        return max(d1, d2) + h * h * k * (1. / 4.);
    }
    else { return max(d1, d2); }
}

int partID = 1;

float map(vec3 p) {

vec3 p0 = p;
   
vec3 obstXYZ = p0 + vec3(obstXY.x,0,obstXY.y);
vec3 arenaXYZ = obstXYZ;

// read the accumulated state from Buffer A (iChannel1)
yPosition = iWASD.y;
angle     = iWASD.z;
xPosition = iWASD.x;

p.xz += vec2(xPosition, yPosition); // apply the translation dictated by the keypresse: WASD or UP, DOWN, LEFT and RIGHT
p.xz *= rot(-angle); // apply the rotation

float result = 0.;
   

p.z -= studW*1.5;
p.y+=1.5;

vec3 p1 = p;

float sr = .05; // edge smoothing factor

p.yz*=rot(-PI/2.);

float legs = p.y + 1.75;
legs = smax(legs, p.z - .75, sr);
legs = min(legs, -p.z - .5);
legs = smax(legs, abs(p.z) - .75, sr);
legs = smax(legs, max(-p.y - 2.25, p.y), sr);
legs = smax(legs, -abs(p.x), sr);

float feet = abs(p.x) - .75;
feet = max(feet, -feet);
feet = max(feet, abs(p.z));
feet = max(feet, p.y);
feet-=.49;

legs = max(legs, -feet);

p = p1;

float waist = max(p.y - 1., -p.y + .5);
waist = max(abs(p.z) - .75, waist);

legs = min(waist + sr/2., legs);
legs = smax(abs(p.x) - 1.5, legs, sr); // trim leg sides

result = max(result, legs);
if (result == legs) { partID = 3; }

p.y -= 2.25;

float torso = smax(smax(abs(p.x) + p.y/7. - 1.3, abs(p.y) - 1.3, sr*3.), abs(p.z) - .75, sr*3.);
float neck = length(p.xz) - .5;
neck = smax(neck, max(-p.y, p.y - 3.5), sr*3.);

p.y -=2.33;

float head = length(p.xz) - 1.;

if (iLeft) {
    p.xz*=rot(-PI/18.);
}
if (iRight) {
    p.xz*=rot(PI/18.);
}

float face = max(head - .01, p.z);

head = smax(head, abs(p.y) - .83, .3);
head = min(head, neck);

result = min(result, head);

if (result == head) { partID = 1; }

p.x = -abs(p.x);
p.x += .3;

float er = .1; // eye pupil radius

p.y -= .125;

float eyes = length(p.xy) - er;

p.x-=.3;
p.y-=.15;

float smile = abs(length(p.xy) - .65);

smile -= er/2.;

smile = smax(smile, -mix(p.x, -p.y, .45), er);

eyes = min(eyes, smile);

face = max(face, eyes);

result = min(result, face);
if (result == face) { partID = 0; }

p = p1;

float aDir = p.x/-abs(p.x);

p.x = -abs(p.x); // mirroring everything in the p.x axis;

p.x += 1.65;
p.y -= 2.9;

p.xy*=rot(1./7.);
p.yz*=rot(PI/-6.);

float ar = .5;
float ah = .75;

vec3 p4 = p;

if (iLeft) {
    p.yz*=rot(PI/-18.*aDir);
}
if (iRight) {
    p.yz*=rot(PI/18.*aDir);
}

float arm = sdSeg(p, vec3(.4,0,0), vec3(0,-ah,0)) - ar;
//arm = smax(arm, p.x - .5, .3); // apparently this caused the weird glitch when turning left or right while in cam mode 2 (topdown)

p.y+=ah;

p.yz*=rot(PI/-4.);

float fh = .6;

float fArm = length(p.xz) - ar;
fArm = max(fArm, p.y);
fArm = smax(fArm, -p.y - fh, sr);

arm = min(arm, fArm);

torso = min(torso, arm);

result = min(torso, result);
if (result == torso) { partID = 4; }

p.y+=fh;

float wh = .75; // wrist length
float hand = max(length(p.xz) - ar/2., p.y);
hand = max(hand, -p.y - wh);

p.y+=wh;

hand = min(hand,
        smax(length(p.xy) - .5, abs(p.z) - ar, sr*2.)
);

p.y+=.15;

hand = smax(hand, -(length(p.xy) - .35), sr);

result = min(result, hand);

if (result == hand) { partID = 1; }

p = p1;

p.z += 1.5*studW;
p.y -= .65*studW;

vec3 p2 = p;

float chassis = smax(abs(p.x) - 2.*studW, abs(p.z) - 4.*studW, sr);

float studTop = chassis;

p.z -= .5*studW;
p.y += 1.15*studW;

float seat = max(abs(p.x) - studW, abs(p.z) - 1.5*studW);

studTop = max(studTop, -seat);

float floor = p.y;

seat = max(seat, -floor);

chassis = smax(chassis, -seat, sr*2.);

p = p1;

p.x -= 1.5*studW;

p.xz = mod(p.xz - studW/2., studW) - studW/2.;

float studs = length(p.xz) - .5;

studs = max(studs, studTop);

p = p2;

chassis = smax(chassis, p.y, sr);

float chasIndent = max(p.z - 3.*studW, -p.z - 2.*studW);
chasIndent = min(abs(p.x) - studW, chasIndent);
chasIndent = min(chasIndent, p.y + .5);

chassis = max(chassis, chasIndent);

p.x = -abs(p.x);

if ((p.z < -2.*studW || p.z > 3.*studW) && p.x < -studW) {
    p.y+=.5;
}   

studs = smax(studs, p.y - .35, sr*3.);

p = p2;

float tDir = 1.;
if (p.z > 0.) { tDir = -1.; }

p.xz = - abs(p.xz);

p.y += 1.;
p.z += 2.*studW;
p.x += studW + sr;

float tireSpace = max(p.y, abs(p.z) - studW);
tireSpace = max(tireSpace, p.x);

chassis = min(chassis, studs);
chassis = smax(chassis, -tireSpace, sr);

p.y += studW;
p.x += studW/2.;

float tR = studW - .2;
float tSpeed;

if (iForward) {
    tSpeed = iTime*PI*2.*tR*tDir;
    p.yz*=rot(tSpeed);
}

if (iBack) {
    tSpeed = -iTime*PI*2./3.*tR*tDir;
    p.yz*=rot(tSpeed);
}


float wheel = max(length(p.yz) - tR, abs(p.x) - studW/2.);
wheel = smax(wheel, -(length(p.yz) - studW/2.), 3.*sr);

p.x += studW/2. - .15;

float hubCap = -((length(p.yz) - studW/2. - .15 + mix(.4,0.,-p.x)));
hubCap = min(hubCap,
          min(abs(p.z), abs(p.y)) - .1

            );
hubCap = min(hubCap, length(p.yz) - .3);
hubCap = max(hubCap, abs(p.x) - .15);
hubCap = max(hubCap, length(p.yz) - studW/2.);

float step = PI / 10.; // rotate angle (24 flutes for 360deg = 15deg per flute)
float theta = atan(p.y, p.z); // Calculate the angle of the position vector
theta = mod(theta, step) - step/2.;

float treads = length(p.yz) - studW*.75;

vec2 conP = length(p.yz) * vec2(cos(theta), sin(theta));
p.y = conP.x;
p.z = conP.y;

treads = min(treads, abs(p.z) - .1);

wheel = max(wheel, treads);

p = p2;

chassis = max(chassis, -p.y - 2.*studW);

result = min(result, chassis);

p.x = -abs(p.x);

if (result == chassis) {
    if (p.y < -1. && p.y > -1. - studW/2. && p.z < -studW*3. - .05 && p.x < -studW) { partID = 7; }
    else if (p.y < -1. && p.y > -1. - studW/2. && p.z > studW*3. + .05 && p.x < -studW) { partID = 8; }
    else if (p.y < -studW*2. + .5) { partID = 6; }
    else { partID = 2; }

}

result = min(result, wheel);
if (result == wheel) { partID = 0; }

result = min(result, hubCap);
if (result == hubCap) { partID = 5; }

p = p2;

p.z += studW;

vec3 p3 = p;

float steer = max(abs(p.x) - studW/2., p.z - .5);
steer = max(steer, p.y - .5);
p.y -= .25;
p.yz*=rot(-PI/4.);


steer = min(steer, length(p.xz) - .175);
steer = max(steer, p.y - 1.);
steer = max(steer, -p.y - 1.5);
p.y -= .75;
steer = min(steer, max(length(p.xz) - .4, abs(p.y) - .075)); // the hub; the innermost part of the wheel that is placed onto the axle

if ( iLeft ) {
    p.xz*=rot(PI/-12.);
}
if ( iRight ) {
    p.xz*=rot(PI/12.);
}

float handle = length(p.xz) - .4 - mix(0., 1., p.y);
handle = abs(handle)/sqrt(2.);
handle = max(handle, min(abs(p.x), abs(p.z)));
handle = max(handle, -p.y);
handle = max(handle, p.y - .5);
handle = max(handle, length(p.xz) - .9);
p.y-=.5;
handle = min(handle, max(abs(length(p.xz) - .9 + .0375), abs(p.y)) - .05);
handle -= .075;

steer = min(steer, handle);
p = p3;
steer = max(steer, -p.z);

result = min(result, steer);
if (result == steer) { partID = 0; }

   
p = obstXYZ;
   
float obst = smax(abs(p.x) - obstAB.x, smax(abs(p.z) - obstAB.y, p.y - 5., 3.),6.*sr);
p.xz = -abs(p.xz);
p.xz += studW*2.;
p.y-=5.;
vec2 dS = vec2(abs(length(p.xz) - 1.5), p.y - .6);
float dStuds = length(max(dS, 0.0)) + min(max(dS.x, dS.y), 0.0) - .5;
obst = min(obst, dStuds);
   
result = min(result, obst);
if (result == obst) { partID = 3; }
   
p = arenaXYZ;
   
float arena = abs(length(p.xz) - arenaR) - .1;
arena = max(arena, p.y - 3.);
   
result = min(result, arena);
if (result == arena) { partID = 9; }
   
p = obstXYZ;

if (iKnobs) {
    p.y+=4.7;
}
else { p.y+=4.35; }

float ground = p.y;
   
if (iKnobs) {

    p.xz = mod(p.xz - studW/2., studW) - studW/2.;
    studs = length(p.xz) - .5;
    studs = smax(studs, p.y - .35,sr*3.);
    p = obstXYZ;

    ground = min(ground, studs);
}
ground = max(ground, length(p.xz) - 75.);
   
p = obstXYZ;
result = min(result, ground);
if (result == ground) { partID = 10; }


return result;
}

vec3 norm(vec3 p) {
    float h = 1e-2;
    vec2 k = vec2(-1, 1);
    return normalize(
        k.xyy * map(p + k.xyy * h) +
        k.yxy * map(p + k.yxy * h) +
        k.yyx * map(p + k.yyx * h) +
        k.xxx * map(p + k.xxx * h)
    );
}

float d0 = 150.;

float raymarch(inout vec3 p, vec3 rd) {
    float dd = 0.0;

    for (float i = 0.0; i < 100.0; i++) {
    float d = map(p);
    if (d < 1e-3 || dd > d0) break;
        p += rd * d;
        dd += d;
    }
    return dd;
}

float shadow(vec3 p, vec3 lp) {
    float shd=1., maxd=length(lp-p);
    vec3 l=normalize(lp-p);
    for (float i=1e-3; i<maxd;) {
        float d=map(p+l*i);
        if (d<1e-3) {
            shd=.0;
            break;
        }
        shd=min(shd,128.*d/i);
        i+=d;
    }
    return shd;
}

vec3 render(vec3 p, vec3 rd) {
    float d = raymarch(p, rd);
    vec3 col = vec3(0);

    if (d < d0) {
        float sAngle = 4.*-PI/5.;
        vec3 n = norm(p),
            lp = vec3(-20.*sin(sAngle), 20, -20.*cos(sAngle)),
            l = normalize(lp - p);
        float diffuse = clamp(dot(l, n), 0., 1.),
            reflective = clamp(dot(reflect(rd, n), l), .0, 1.0);
            col += .5*diffuse;
                 
        vec3 hue;

        if (partID == 0) { hue = vec3(-.5); } // very black
        else if (partID == 1) { hue = vec3(1,1,0); } // yellow
        else if (partID == 2) { hue = vec3(1,0,0); } // red
        else if (partID == 3) { hue = vec3(0,0,1); } // blue
        else if (partID == 4) { hue = vec3(0,.66,0); } // green;
        else if (partID == 5) { hue = vec3(1.); } // white
        else if (partID == 6) { hue = vec3(.5); } // gray
        else if (partID == 7) { hue = vec3(1,1,0) + vec3(1); } // bright yellow
        else if (partID == 8) { hue = vec3(1,.5,0) + vec3(.5); } // bright orange;
        else if (partID == 9) {
            float step = PI / 72.; // rotate angle (24 flutes for 360deg = 15deg per flute)
            float theta = atan(p.x, p.z)/step; // Calculate the angle of the position vector
            hue = vec3(1, ceil(cos(theta)), ceil(cos(theta)));
        }
        else if (partID == 10) {
            vec3 p0 = p;
            p.xz += 20.;
            p.xz/=studW;
            p.xz = round(p.xz);
            float mask = length(p.xz) - 28.5;
            mask = abs(mask);
            hue = 1. - vec3(1,.5,1)*(1. - step(mask,12.));
            hue*=(1. - step(mask,10.));
            p = p0;
            
        }
        else { hue = vec3(0,.5,0); }
        
        col = mix(col,hue,.5) - vec3(.3);
        col*=1.2;
             
        if (iOmbra) {
            diffuse*=shadow(p+n*5e-2, lp);
        }
        if (iPhong) {
            diffuse += pow(reflective, 8.);
        }
        col += .1 + .4*diffuse;

    } else {
        rd.y+=.1;
        col += vec3(0,1.-rd.y,1) * vec3(ceil(rd.y));
    }
        
    return col+vec3(.2,.0,.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord.xy - .5 * iResolution.xy) / iResolution.y;

    int cam = 1;

    vec3 ro = vec3(0.0);
    vec3 fwd = vec3(0.0);
    float camR = -18.;

    if (iCam == 1) {
        // Camera Mode 1: 3rd person perspective rear view
        ro = vec3(camR*sin(-iWASD.z+PI) - iWASD.x, 2, camR*cos(-iWASD.z+PI) - iWASD.y);
        fwd = vec3(sin(-iWASD.z+PI),0,cos(-iWASD.z+PI));
    } else if (iCam == 2) {
        // Camera Mode 2: Top-down
        ro = vec3(0. - iWASD.x, 25, 0. - iWASD.y);
        fwd = vec3(cos(-PI/2.),sin(-PI/2.),0);
    } else if (iCam == 3) {
        // Camera Mode 3: Motion tracking (formerly Camera Mode 4)
        ro = vec3(-15, 2, -camR + 5.);
        float turn = atan(ro.x + iWASD.x,-ro.z - iWASD.y);
        fwd = vec3(sin(-turn),0.,cos(-turn));
    } else if (iCam == 4) {
        // Camera Mode 4: Front view (formerly Camera Mode 5)
        ro = vec3(camR*sin(-iWASD.z) - iWASD.x, 2, camR*cos(-iWASD.z) - iWASD.y);
        fwd = vec3(sin(-iWASD.z),0,cos(-iWASD.z));
    } else if (iCam == 5) {
        // Camera Mode 5: Side view (formerly Camera Mode 6)
        ro = vec3(camR*sin(-iWASD.z+PI/2.) - iWASD.x, 2, camR*cos(-iWASD.z+PI/2.) - iWASD.y);
        fwd = vec3(sin(-iWASD.z+PI/2.),0,cos(-iWASD.z+PI/2.));
    } else {
        // Default Camera Mode (if no key is pressed) - falls back to 3rd person
        ro = vec3(camR*sin(-iWASD.z+PI) - iWASD.x, 2, camR*cos(-iWASD.z+PI) - iWASD.y);
        fwd = vec3(sin(-iWASD.z+PI),0,cos(-iWASD.z+PI));
    }
        
    vec3 right = normalize(cross(vec3(0., 1., 0.), fwd)),
        up = cross(fwd, right),
        rd = normalize(fwd + uv.x * right + uv.y * up);

    float t = 0.0;
    vec3 p = ro, col = render(ro, rd);
    fragColor = vec4(col, 1);
}

// Shadertoy code ends here

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}

`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);   


const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const   
    program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);   


const positions = [
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0,
];

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new   
    Float32Array(positions), gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionAttributeLocation);   

gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);   


const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
const iMouseLocation = gl.getUniformLocation(program, 'iMouse');
const iTimeLocation = gl.getUniformLocation(program, 'iTime');
const iPhongLocation = gl.getUniformLocation(program, 'iPhong');
const iLinesLocation = gl.getUniformLocation(program, 'iLines');
const iOmbraLocation = gl.getUniformLocation(program, 'iOmbra');
const iKnobsLocation = gl.getUniformLocation(program, 'iKnobs');
const iCamLocation = gl.getUniformLocation(program, 'iCam');
const iLeftLocation = gl.getUniformLocation(program, 'iLeft');
const iRightLocation = gl.getUniformLocation(program, 'iRight');
const iForwardLocation = gl.getUniformLocation(program, 'iForward');
const iBackLocation = gl.getUniformLocation(program, 'iBack');
const iWASDLocation = gl.getUniformLocation(program, 'iWASD');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);   

resizeCanvas(); // Initial resize

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y   
    = canvas.height - (event.clientY - rect.top);
    gl.uniform2f(iMouseLocation, x, y);
});

function render() {
    const deltaTime = 0.016; // Fixed timestep for simplicity (assuming ~60 FPS)
    const updatedValues = updatePositionAndAngle(deltaTime);
    xNow = updatedValues.x;
    yNow = updatedValues.y;
    angleNow = updatedValues.angle;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(iTimeLocation, performance.now() * 0.001);
    gl.uniform1i(iPhongLocation, phongOn);
    gl.uniform1i(iLinesLocation, linesOn);
    gl.uniform1i(iOmbraLocation, ombraOn);
    gl.uniform1i(iKnobsLocation, knobsOn);
    gl.uniform1i(iCamLocation, cam);
    gl.uniform1i(iLeftLocation, turnLeft);
    gl.uniform1i(iRightLocation, turnRight);
    gl.uniform1i(iForwardLocation, driveFwd);
    gl.uniform1i(iBackLocation, driveBck);
    gl.uniform3f(iWASDLocation, xNow, yNow, angleNow);


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
}

render();