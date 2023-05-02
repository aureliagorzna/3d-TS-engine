const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const FPS_MAX = Infinity;
// number of movement checks per second (the higher the smoother, max 1000, might generate lags when there are a lot of elements in game)
const GAME_TICKS = 200;
const CUBE_SIZE = 2;
const SCALE = 150;
const viewDistance = 12;
const color = "limegreen";
const bgColor = "rgb(15,15,15)";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = bgColor;
const cameraPos = {
    x: -0.5,
    y: -1,
    z: 0
};
// const initCameraPos: position3d = Object.create(cameraPos)
const KEYS = {
    moveLeft: "a",
    moveRight: "d",
    moveUp: " ",
    moveDown: "Shift",
    rotateLeft: "e",
    rotateRight: "r",
    moveIn: "w",
    moveOut: "s",
    lookLeft: "c",
    lookRight: "v"
};
const movementProps = Object.create(KEYS);
for (let key in movementProps) {
    movementProps[key] = false;
}
window.addEventListener("keydown", (e) => {
    for (let key in KEYS) {
        if (e.key.toLowerCase() === KEYS[key].toLowerCase())
            movementProps[key] = true;
    }
});
window.addEventListener("keyup", (e) => {
    for (let key in KEYS) {
        if (e.key.toLowerCase() === KEYS[key].toLowerCase())
            movementProps[key] = false;
    }
});
const controls = () => {
    if (movementProps.moveLeft) {
        cameraPos.x += 0.2;
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
    }
    if (movementProps.moveRight) {
        cameraPos.x -= 0.2;
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
    }
    if (movementProps.moveUp)
        cameraPos.y += 0.2;
    if (movementProps.moveDown)
        cameraPos.y -= 0.2;
    if (movementProps.moveIn) {
        cameraPos.z += 0.01;
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
        // console.log("Camera: " + cameraPos.z)
        // console.log("Cube: " + cubes[0].center.z)
        // console.log(cubes[0].pos.z)
        // console.log(cameraPos.z)
    }
    if (movementProps.moveOut) {
        cameraPos.z -= 0.01;
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
        // console.log(cubes[0].pos.z)
        // console.log(cameraPos.z)
    }
    if (movementProps.rotateRight)
        cubes.forEach((cube) => cube.rotateFromCenter(1));
    if (movementProps.rotateLeft)
        cubes.forEach((cube) => cube.rotateFromCenter(-1));
    if (movementProps.lookRight)
        cubes.forEach((cube) => cube.rotateFromPlayer(-1));
    if (movementProps.lookLeft)
        cubes.forEach((cube) => cube.rotateFromPlayer(1));
};
const cubes = [];
const getDifference = (z) => -2.4 + (z - 1) * -2;
class Cube {
    constructor(pos, color, rotation) {
        this.color = color || "limegreen";
        this.displayPos = pos;
        this.pos = { x: this.displayPos.x * 2, y: this.displayPos.y * 2, z: this.displayPos.z * 2 };
        this.setCorners();
        this.setCenter();
        this.radiusCube = getDistance({ x: this.center.x, y: this.center.y }, { x: this.corners[0].x, y: this.corners[0].y });
        this.setAngles();
        const radiusCenter = convert3dTo2d({ x: this.center.x, y: this.center.y, z: 1 });
        const corner1Real = convert3dTo2d({ x: this.corners[0].x, y: this.corners[0].y, z: 1 });
        this.radiusReal = getDistance({ x: this.center.x, y: this.center.y }, { x: this.corners[0].x, y: this.corners[0].y });
        this.updateDistanceFromPlayer();
        this.updateAngle();
        this.rotateFromCenter(rotation || 0);
        // this.rotateFromPlayer(0)
        this.updateCenter();
        if (this.color === "cornflowerblue")
            this.center = cameraPos;
    }
    updateCenter() {
        const pos = getCirclePoint(this.angle, this.distanceFromPlayer * 1);
        // console.log(this.distanceFromPlayer)
        this.center = { x: pos.x, y: this.center.y, z: pos.y };
        this.rotateFromCenter(0);
        // if (this.center.z < cameraPos.z) console.log("behind")
    }
    updateAngle() {
        // this.updateDistanceFromPlayer()
        const a = { x: cameraPos.x, y: cameraPos.z };
        const b = { x: this.center.x, y: this.center.z };
        this.angle = getAngle(a, this.distanceFromPlayer, b);
    }
    updateDistanceFromPlayer() {
        const a = { x: cameraPos.x, y: cameraPos.z };
        const b = { x: this.center.x, y: this.center.z };
        this.distanceFromPlayer = getDistance(a, b);
    }
    setAngles() {
        const a1Angle = getAngle(this.corners[0], this.radiusCube, this.center);
        const a2Angle = getAngle(this.corners[1], this.radiusCube, this.center);
        const b1Angle = getAngle(this.corners[2], this.radiusCube, this.center);
        const b2Angle = getAngle(this.corners[3], this.radiusCube, this.center);
        const a3Angle = a1Angle;
        const a4Angle = a2Angle;
        const b3Angle = b2Angle;
        const b4Angle = b1Angle;
        this.angles = [a1Angle, a2Angle, a3Angle, a4Angle, b1Angle, b2Angle, b3Angle, b4Angle];
    }
    setCorners() {
        const corner1 = this.pos;
        const corner2 = { x: this.pos.x + CUBE_SIZE, y: this.pos.y, z: this.pos.z };
        const corner3 = { x: this.pos.x, y: this.pos.y + CUBE_SIZE, z: this.pos.z };
        const corner4 = { x: this.pos.x + CUBE_SIZE, y: this.pos.y + CUBE_SIZE, z: this.pos.z };
        const corner5 = { x: this.pos.x, y: this.pos.y, z: this.pos.z + CUBE_SIZE / 5 };
        const corner6 = { x: this.pos.x + CUBE_SIZE, y: this.pos.y, z: this.pos.z + CUBE_SIZE / 5 };
        const corner7 = { x: this.pos.x, y: this.pos.y + CUBE_SIZE, z: this.pos.z + CUBE_SIZE / 5 };
        const corner8 = { x: this.pos.x + CUBE_SIZE, y: this.pos.y + CUBE_SIZE, z: this.pos.z + CUBE_SIZE / 5 };
        this.corners = [corner1, corner2, corner3, corner4, corner5, corner6, corner7, corner8];
    }
    renderLine(x, y) {
        const corner1 = convert3dTo2d(this.corners[x - 1]);
        const corner2 = convert3dTo2d(this.corners[y - 1]);
        const differenceZ = getDifference(this.pos.z);
        // if (cameraPos.z < this.corners[x - 1].z + differenceZ && cameraPos.z < this.corners[y - 1].z + differenceZ)
        drawLine(corner1, corner2, this.color);
    }
    draw() {
        if (this.color === "cornflowerblue")
            this.center = cameraPos;
        if (cameraPos.z > -this.center.z)
            return;
        this.renderLine(1, 2);
        this.renderLine(1, 3);
        this.renderLine(2, 4);
        this.renderLine(3, 4);
        this.renderLine(5, 6);
        this.renderLine(5, 8);
        this.renderLine(6, 7);
        this.renderLine(8, 7);
        this.renderLine(1, 5);
        this.renderLine(2, 6);
        this.renderLine(3, 8);
        this.renderLine(4, 7);
        // this.drawCenter()
        // this.fillColor()
        // this.drawCorners()
    }
    fillColor() {
        const corner1 = this.corners[0];
        const corner2 = this.corners[3];
        const cornerA = { x: corner1.x, y: corner1.y + CUBE_SIZE / 2, z: corner1.z };
        const cornerB = { x: corner2.x, y: corner2.y - CUBE_SIZE / 2, z: corner2.z };
        drawLine(convert3dTo2d(cornerA), convert3dTo2d(cornerB), this.color, 100);
    }
    setCenter() {
        this.center = { x: this.pos.x + CUBE_SIZE / 2, y: this.pos.y + CUBE_SIZE / 2, z: this.pos.z + CUBE_SIZE / 10 };
    }
    drawCenter() {
        const drawableCenter = convert3dTo2d(this.center);
        const differenceZ = getDifference(this.pos.z);
        const pos = getCirclePoint(this.angle, this.distanceFromPlayer * 1);
        // if (cameraPos.z < this.center.z + differenceZ)
        drawCircle(drawableCenter, "orange");
        drawCircle(pos, "limegreen");
    }
    drawCorners() {
        const colors = ["red", "orange", "magenta", "gray", "lightblue", "cornflowerblue", "purple", "olive"];
        this.corners.forEach((corner, i) => {
            const corner1 = convert3dTo2d(corner);
            drawCircle(corner1, colors[i]);
        });
    }
    rotateFromCenter(newAngle) {
        const copyAngles = this.angles.map((angle) => angle + newAngle);
        this.angles = copyAngles;
        this.angles.forEach((angle, i) => {
            // console.log(angle)
            // if (i === 0) {
            //     const a = { x: this.center.x, y: -this.center.z * 10 }
            //     const b = { x: this.corners[i].x, y: -this.corners[i].z * 10 }
            //     let ang = getAngle(a, getDistance(a, b), b)
            //     const result = getCirclePoint(ang, CUBE_SIZE)
            //     pos1.x = result.x
            //     pos1.y = result.y
            //     console.log(ang)
            // }
            const pos = getCirclePoint(angle, this.radiusCube);
            // particle            center
            this.corners[i] = { x: this.center.x + pos.x, y: this.corners[i].y, z: this.center.z + pos.y };
        });
    }
    rotateFromPlayer(newAngle) {
        this.angle += newAngle;
        this.updateCenter();
        this.rotateFromCenter(newAngle);
    }
}
let show = true;
const pos1 = {
    x: 0,
    y: 0
};
const pos2 = {
    x: 0,
    y: 0
};
const drawLine = (pos1, pos2, customColor, customWidth) => {
    ctx.strokeStyle = customColor || color;
    customWidth != null ? ctx.lineWidth = customWidth : ctx.lineWidth = 1;
    // if (pos1.x + canvas.width / 2 + cameraPos.x > canvas.width || pos1.x + canvas.width / 2 + cameraPos.x < 0) return
    // if (pos2.x + canvas.width / 2 + cameraPos.x > canvas.width || pos2.x + canvas.width / 2 + cameraPos.x < 0) return
    // if (pos1.y + canvas.height / 2 + cameraPos.x > canvas.height || pos1.y + canvas.height / 2 + cameraPos.x < 0) return
    // if (pos2.y + canvas.height / 2 + cameraPos.x > canvas.height || pos2.y + canvas.height / 2 + cameraPos.x < 0) return
    const a = canvas.width / 2 + pos1.x + cameraPos.x;
    const b = canvas.height / 2 + pos1.y + cameraPos.y;
    const c = canvas.width / 2 + pos2.x + cameraPos.x;
    const d = canvas.height / 2 + pos2.y + cameraPos.y;
    if (getDistance({ x: a, y: b }, { x: c, y: d }) > canvas.width)
        return;
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
};
const drawCircle = (pos, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + pos.x + cameraPos.x, canvas.height / 2 + pos.y + cameraPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
};
const convert3dTo2d = (pos) => {
    const x = ((pos.x - cameraPos.x) / (pos.z + cameraPos.z)) * SCALE;
    const y = ((pos.y - cameraPos.y) / (pos.z + cameraPos.z)) * SCALE;
    return { x, y };
};
const getCenter = (startPos, endPos) => {
    return { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 };
};
const getDistance = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};
const getDistance3d = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2));
};
const getMidLinePoint = (pos1, pos2) => {
    return { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 };
};
const degreesToRadians = (deg) => deg * (Math.PI / 180);
const radiansToDegrees = (rad) => (rad * 180) / Math.PI;
const getCirclePoint = (angle, radius) => {
    const radians = degreesToRadians(angle);
    return { x: radius * Math.cos(radians), y: -(radius * Math.sin(radians)) / 10 };
};
const getCirclePoint2 = (angle, radius) => {
    const radians = degreesToRadians(angle);
    return { x: radius * Math.cos(radians), y: (radius * Math.sin(radians)) / 10 };
};
const getAngle = (pos, radius, center) => {
    let quarter;
    if (pos.x >= center.x && pos.y <= center.y)
        quarter = 1;
    if (pos.x <= center.x && pos.y <= center.y)
        quarter = 2;
    if (pos.x <= center.x && pos.y >= center.y)
        quarter = 3;
    if (pos.x >= center.x && pos.y >= center.y)
        quarter = 4;
    const a = getDistance({ x: 0, y: center.y }, { x: 0, y: pos.y });
    const c = radius;
    const sin = a / c;
    const radians = Math.asin(sin);
    let degrees = radiansToDegrees(radians);
    if (quarter === 2)
        degrees = 90 + (90 - degrees);
    if (quarter === 3)
        degrees = 180 + degrees;
    if (quarter === 4)
        degrees = 270 + (90 - degrees);
    return degrees;
};
const getAnglePure = (pos, radius, center) => {
    const a = getDistance({ x: 0, y: center.y }, { x: 0, y: pos.y });
    const c = radius;
    const sin = a / c;
    const radians = Math.asin(sin);
    let degrees = radiansToDegrees(radians);
    return degrees;
};
const addCube = (x, y, z, color, rotation) => {
    cubes.push(new Cube({ x, y, z }, color, rotation || 0));
};
const addClassicTreeLeaves = (pos) => {
    addCube(pos.x, pos.y, pos.z, "limegreen");
    addCube(pos.x + 1, pos.y, pos.z, "limegreen");
    addCube(pos.x + 2, pos.y, pos.z, "limegreen");
    addCube(pos.x - 1, pos.y, pos.z, "limegreen");
    addCube(pos.x - 2, pos.y, pos.z, "limegreen");
    addCube(pos.x + 1, pos.y + 1, pos.z, "limegreen");
    addCube(pos.x, pos.y + 1, pos.z, "limegreen");
    addCube(pos.x - 1, pos.y + 1, pos.z, "limegreen");
    addCube(pos.x, pos.y + 2, pos.z, "limegreen");
    addCube(pos.x, pos.y + 1, pos.z + 1, "limegreen");
    addCube(pos.x, pos.y + 1, pos.z - 1, "limegreen");
    addCube(pos.x, pos.y, pos.z + 1, "limegreen");
    addCube(pos.x, pos.y, pos.z - 1, "limegreen");
    addCube(pos.x, pos.y, pos.z + 2, "limegreen");
    addCube(pos.x, pos.y, pos.z - 2, "limegreen");
    addCube(pos.x + 1, pos.y, pos.z - 1, "limegreen");
    addCube(pos.x - 1, pos.y, pos.z - 1, "limegreen");
    addCube(pos.x + 1, pos.y, pos.z + 1, "limegreen");
    addCube(pos.x - 1, pos.y, pos.z + 1, "limegreen");
};
const generatePlatform = (pos, width, depth, color) => {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < depth; y++) {
            addCube(x + pos.x, pos.y, pos.z + y, color);
        }
    }
};
const laodObjects = () => {
    // grass field
    generatePlatform({ x: -5, y: -4, z: 10 }, 10, 20, "limegreen");
    // tree on grass
    addCube(0, -3, 15, "brown");
    addCube(0, -2, 15, "brown");
    addCube(0, -1, 15, "brown");
    addClassicTreeLeaves({ x: 0, y: 0, z: 15 });
    // tree behind
    addCube(-1, 0, -5, "brown");
    addCube(-1, 1, -5, "brown");
    addClassicTreeLeaves({ x: -1, y: 2, z: -5 });
    // sky circle
    for (let i = 0; i < 360; i += 10) {
        const radius = 7;
        const pos = getCirclePoint(i, radius);
        const angle = getAngle({ x: pos.x, y: pos.y * 7 + 15 }, radius, { x: 0, y: 15 });
        addCube(pos.x, 2, pos.y * 10 + 15, "yellow", angle + 45);
    }
    // cube representing camera position
    addCube(cameraPos.x, cameraPos.y, cameraPos.z, "cornflowerblue");
};
// fps logic
let fpsCounter = 0;
let fps = 0;
const fpsCounterReset = () => {
    fps = fpsCounter;
    fpsCounter = 0;
};
// displaying fps
const text = () => {
    ctx.textAlign = "left";
    ctx.font = "20px Comic Sans MS";
    ctx.fillStyle = "purple";
    ctx.fillText("FPS: " + fps, 2, 20);
};
const physics = () => {
    controls();
};
const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cubes.forEach((cube) => cube.draw());
    text();
    fpsCounter++;
};
const startEngine = () => {
    setInterval(fpsCounterReset, 1000);
    render();
    setInterval(render, 1000 / FPS_MAX);
    physics();
    setInterval(physics, 1000 / GAME_TICKS);
    laodObjects();
};
startEngine();
