const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
// number of movement checks per second (the higher the smoother, max 1000, might generate lags when there are a lot of elements in game)
const GAME_TICKS = 200;
const CUBE_SIZE = 2; // dont change this
const SCALE = 150; // 150 optimal
const LIMIT_VIEW_DISTANCE = false;
const viewDistance = 50;
const moveSpeed = 0.05;
const color = "limegreen";
const bgColor = "rgb(15,15,15)";
const cubes = [];
const DEBUG = false;
const debugButton = document.querySelector(".button-debug");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = bgColor;
const debugData = {};
const cameraPos = {
    x: 4,
    y: 2,
    z: 0,
};
const viewAngle = {
    x: 0,
    y: 0,
};
let cameraRotation = 0;
const KEYS = {
    moveLeft: "a",
    moveRight: "d",
    moveUp: " ",
    moveDown: "Shift",
    rotateLeft: "e",
    rotateRight: "r",
    moveIn: "w",
    moveOut: "s",
    lookLeft: "mousemove",
    lookRight: "mousemove",
    debugLeft: "c",
    debugRight: "v",
};
const movementProps = Object.create(KEYS);
// <----------------------- GAME STATE FUNCTIONS -----------------------> //
const controls = () => {
    const forward = getCirclePoint(90 - viewAngle.x, moveSpeed);
    const right = getCirclePoint(-viewAngle.x, moveSpeed);
    const zMoveSpeed = moveSpeed / 4;
    if (movementProps.moveLeft) {
        // LEFT
        cameraPos.z += (right.y * zMoveSpeed) / moveSpeed;
        cameraPos.x += right.x;
    }
    if (movementProps.moveRight) {
        // RIGHT
        cameraPos.z -= (right.y * zMoveSpeed) / moveSpeed;
        cameraPos.x -= right.x;
    }
    if (movementProps.moveIn) {
        // IN
        cameraPos.z += (forward.y * zMoveSpeed) / moveSpeed;
        cameraPos.x += forward.x;
    }
    if (movementProps.moveOut) {
        // OUT
        cameraPos.z -= (forward.y * zMoveSpeed) / moveSpeed;
        cameraPos.x -= forward.x;
    }
    if (movementProps.moveUp) {
        // UP
        cameraPos.y += moveSpeed;
    }
    if (movementProps.moveDown) {
        // DOWN
        cameraPos.y -= moveSpeed;
    }
};
const controlsMouse = (movementX, movementY) => {
    viewAngle.x -= movementX / 10; // LOOK LEFT/RIGHT
    if (viewAngle.x < 0) {
        viewAngle.x += 360;
    }
    else if (viewAngle.x > 360) {
        viewAngle.x -= 360;
    }
    viewAngle.y -= movementY / 10; // LOOK UP/DOWN
    viewAngle.y = Math.max(-90, Math.min(90, viewAngle.y));
};
const setEventListeners = () => {
    for (let key in movementProps) {
        movementProps[key] = false;
    }
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });
    window.addEventListener("mousemove", (e) => {
        if (document.pointerLockElement !== canvas)
            return;
        controlsMouse(e.movementX, e.movementY);
    });
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
    if (DEBUG) {
        debugButton.addEventListener("click", () => { });
    }
    else {
        debugButton.remove();
    }
};
// <----------------------- CUBE CLASS -----------------------> //
class Cube {
    constructor(pos, color, rotation) {
        // position is the very center of the cube
        pos.z = pos.z / CUBE_SIZE;
        this.initPos = { ...pos };
        this.color = color || "limegreen";
        this.size = CUBE_SIZE / 2;
        this.angle = rotation || 0;
        this.setCorners();
        const rotatedCorners = this.rotateCubeFromCenter(this.angle, 0);
        this.corners = rotatedCorners;
    }
    // distance between corners is 2, for z its 2 / 4 (0.5)
    setCorners() {
        const size = this.size;
        const a1 = { x: -size, y: -size, z: -(size / (CUBE_SIZE * 2)) };
        const a2 = { x: size, y: -size, z: -(size / (CUBE_SIZE * 2)) };
        const a3 = { x: -size, y: size, z: -(size / (CUBE_SIZE * 2)) };
        const a4 = { x: size, y: size, z: -(size / (CUBE_SIZE * 2)) };
        const b1 = { x: -size, y: -size, z: size / (CUBE_SIZE * 2) };
        const b2 = { x: size, y: -size, z: size / (CUBE_SIZE * 2) };
        const b3 = { x: -size, y: size, z: size / (CUBE_SIZE * 2) };
        const b4 = { x: size, y: size, z: size / (CUBE_SIZE * 2) };
        this.corners = [a1, a2, a3, a4, b1, b2, b3, b4];
    }
    drawCubeCenter() {
        const pos = this.rotateCubeFromPlayer(viewAngle.x, viewAngle.y);
        const center = convert3dTo2d(pos);
        drawCircle(center, "red");
    }
    drawCubeTopCenter() {
        const pos = this.rotateCubeFromPlayer(viewAngle.x, viewAngle.y);
        const topCenter = {
            x: pos.x,
            y: this.size,
            z: pos.z,
        };
        const center = convert3dTo2d(topCenter);
        drawCircle(center, "yellow");
    }
    drawOutline() {
        if (LIMIT_VIEW_DISTANCE) {
            const cameraDistance = this.getDistanceXFromPlayer();
            if (cameraDistance > viewDistance) {
                return;
            }
        }
        const corners = [];
        for (let i = 0; i < this.corners.length; i++) {
            corners.push(this.getCornerWithCubePos(i));
        }
        // back
        drawLine3d(corners[0], corners[1], this.color);
        drawLine3d(corners[0], corners[2], this.color);
        drawLine3d(corners[1], corners[3], this.color);
        drawLine3d(corners[2], corners[3], this.color);
        // front
        drawLine3d(corners[4], corners[5], this.color);
        drawLine3d(corners[4], corners[6], this.color);
        drawLine3d(corners[5], corners[7], this.color);
        drawLine3d(corners[6], corners[7], this.color);
        // side
        drawLine3d(corners[0], corners[4], this.color);
        drawLine3d(corners[1], corners[5], this.color);
        drawLine3d(corners[3], corners[7], this.color);
        drawLine3d(corners[2], corners[6], this.color);
        // drawLine3d(corners[0], corners[7], this.color)
    }
    getCornerWithCubePos(index) {
        let pos = this.rotateCubeFromPlayer(viewAngle.x, viewAngle.y);
        let rotatedCorners = this.rotateCubeFromCenter(90 + viewAngle.x, viewAngle.y);
        const corner = rotatedCorners[index];
        return {
            x: corner.x + pos.x,
            y: corner.y + pos.y,
            z: corner.z + pos.z,
        };
    }
    getDistanceXFromPlayer() {
        const cubePos = {
            x: this.initPos.x,
            y: this.initPos.z * 4,
        };
        const distance = getDistance2d({ x: cameraPos.x, y: cameraPos.z }, cubePos);
        return distance;
    }
    rotateCubeFromCenter(angleX, angleY) {
        const rotatedCorners = [];
        for (let i = 0; i < this.corners.length; i++) {
            const centerPos = {
                x: 0,
                y: 0,
            };
            const cornerPos = {
                x: this.corners[i].x,
                y: this.corners[i].z * 4,
            };
            const currentAngleX = getAngleAtan2(centerPos, cornerPos);
            const newAngleX = currentAngleX + angleX;
            const radiusX = getDistance2d(centerPos, cornerPos);
            const pointIncludingAngleX = getCirclePoint(newAngleX, radiusX);
            const cornerPosY = {
                x: this.corners[i].y,
                y: pointIncludingAngleX.y,
            };
            const currentAngleY = getAngleAtan2(centerPos, cornerPosY);
            const newAngleY = currentAngleY + angleY;
            const radiusY = getDistance2d(centerPos, cornerPosY);
            const pointIncludingAngleY = getCirclePoint(newAngleY, radiusY);
            const yawedCorner = {
                x: pointIncludingAngleX.x,
                y: pointIncludingAngleY.x,
                z: pointIncludingAngleY.y / 4,
            };
            rotatedCorners.push(yawedCorner);
        }
        return rotatedCorners;
    }
    rotateCubeFromPlayer(viewAngleX, viewAngleY) {
        let x = this.initPos.x - cameraPos.x;
        let y = this.initPos.y - cameraPos.y;
        let z = (this.initPos.z - cameraPos.z) * 4;
        const yawCenter = {
            x: 0,
            y: 0,
        };
        const yawPoint = {
            x: x,
            y: z,
        };
        const currentAngleX = getAngleAtan2(yawCenter, yawPoint);
        const radiusX = getDistance2d(yawCenter, yawPoint);
        const newAngleX = currentAngleX + viewAngleX;
        const pointX = getCirclePoint(newAngleX, radiusX);
        const pitchPoint = {
            x: y,
            y: pointX.y,
        };
        const currentAngleY = getAngleAtan2(yawCenter, pitchPoint);
        const radiusY = getDistance2d(yawCenter, pitchPoint);
        const newAngleY = currentAngleY + viewAngleY;
        const pointY = getCirclePoint(newAngleY, radiusY);
        return {
            x: pointX.x + cameraPos.x,
            y: pointY.x + cameraPos.y,
            z: pointY.y / 4 + cameraPos.z,
        };
    }
}
// <----------------------- DRAW FUNCTIONS -----------------------> //
const drawLine2d = (pos1, pos2, customColor, customWidth) => {
    ctx.strokeStyle = customColor || color;
    customWidth != null ? (ctx.lineWidth = customWidth) : (ctx.lineWidth = 1);
    const a = canvas.width / 2 - pos1.x;
    const b = canvas.height / 2 - pos1.y;
    const c = canvas.width / 2 - pos2.x;
    const d = canvas.height / 2 - pos2.y;
    // If line exceeds screen size, it won't be drawn
    // if (distanceBetweenPositions > canvas.width) return;
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
};
const drawLine3d = (uPos1, uPos2, customColor, customWidth) => {
    // If line is behind the camera, it won't be drawn
    if (cameraPos.z > uPos1.z || cameraPos.z > uPos2.z) {
        return;
    }
    const pos1 = convert3dTo2d(uPos1);
    const pos2 = convert3dTo2d(uPos2);
    ctx.strokeStyle = customColor || color;
    customWidth != null ? (ctx.lineWidth = customWidth) : (ctx.lineWidth = 1);
    const a = canvas.width / 2 - pos1.x;
    const b = canvas.height / 2 - pos1.y;
    const c = canvas.width / 2 - pos2.x;
    const d = canvas.height / 2 - pos2.y;
    // If line exceeds screen size, it won't be drawn
    // if (distanceBetweenPositions > canvas.width) return;
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
};
const drawCircle = (pos, color) => {
    ctx.fillStyle = color;
    const x = canvas.width / 2 - pos.x;
    const y = canvas.height / 2 - pos.y;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
};
// <----------------------- MATH FUNCTIONS -----------------------> //
const convert3dTo2d = (pos) => {
    const x = ((pos.x - cameraPos.x) / (pos.z - cameraPos.z)) * SCALE;
    const y = ((pos.y - cameraPos.y) / (pos.z - cameraPos.z)) * SCALE;
    return { x, y };
};
const getDistance2d = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};
const getDistance3d = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2));
};
const getCenterBetweenPoints = (pos1, pos2) => {
    return { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 };
};
const degreesToRadians = (deg) => deg * (Math.PI / 180);
const radiansToDegrees = (rad) => (rad * 180) / Math.PI;
const getCirclePoint = (angle, radius) => {
    const radians = degreesToRadians(angle);
    return {
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
    };
};
const getAngleAtan2 = (center, point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    let angle = radiansToDegrees(Math.atan2(dy, dx));
    if (angle < 0) {
        angle += 360;
    }
    return angle;
};
// <----------------------- ADD OBJECTS FUNCTIONS -----------------------> //
const addCube = (x, y, z, color, rotation) => {
    cubes.push(new Cube({ x, y, z }, color, rotation || 0));
};
const addClassicTreeLeaves = (pos, color = "#47b345") => {
    addCube(pos.x, pos.y, pos.z, color);
    addCube(pos.x + 2, pos.y, pos.z, color);
    addCube(pos.x + 4, pos.y, pos.z, color);
    addCube(pos.x - 2, pos.y, pos.z, color);
    addCube(pos.x - 4, pos.y, pos.z, color);
    addCube(pos.x + 2, pos.y + 2, pos.z, color);
    addCube(pos.x, pos.y + 2, pos.z, color);
    addCube(pos.x - 2, pos.y + 2, pos.z, color);
    addCube(pos.x, pos.y + 4, pos.z, color);
    addCube(pos.x, pos.y + 2, pos.z + 1, color);
    addCube(pos.x, pos.y + 2, pos.z - 1, color);
    addCube(pos.x, pos.y, pos.z + 1, color);
    addCube(pos.x, pos.y, pos.z - 1, color);
    addCube(pos.x, pos.y, pos.z + 2, color);
    addCube(pos.x, pos.y, pos.z - 2, color);
    addCube(pos.x + 2, pos.y, pos.z - 1, color);
    addCube(pos.x - 2, pos.y, pos.z - 1, color);
    addCube(pos.x + 2, pos.y, pos.z + 1, color);
    addCube(pos.x - 2, pos.y, pos.z + 1, color);
};
const generatePlatform = (pos, width, depth, color) => {
    for (let x = 0; x < width * CUBE_SIZE; x += CUBE_SIZE) {
        for (let y = 0; y < depth; y++) {
            addCube(x + pos.x, pos.y, pos.z + y, color);
        }
    }
};
/**
 * This function includes every object that should be generated
 */
const loadObjects = () => {
    // grass field
    generatePlatform({ x: -5, y: -4, z: 10 }, 8, 12, "#47b345");
    // tree on grass
    addClassicTreeLeaves({ x: 1, y: 4, z: 15 });
    addCube(1, 2, 15, "#5b3d25");
    addCube(1, 0, 15, "#5b3d25");
    addCube(1, -2, 15, "#5b3d25");
    // cube representing camera position
    addCube(cameraPos.x, cameraPos.y, cameraPos.z, "cornflowerblue");
    // sky circle
    for (let angle = 0; angle < 360; angle += 10) {
        const radius = 10;
        const pos = getCirclePoint(angle, radius);
        addCube(pos.x + 1, 15, pos.y / 2 + 15, "yellow", angle);
    }
    // testing set
    // addCube(0, 0, 3, 'limegreen')
    // addCube(0, 0, 4, 'limegreen')
    // addCube(0, 0, 8, 'limegreen')
    // addCube(0, 0, 9, 'limegreen')
    // addCube(0, 0, 10, 'limegreen')
    // addCube(cameraPos.x, cameraPos.y, cameraPos.z, 'cornflowerblue')
};
// fps logic
let fpsCounter = 0;
let fps = 0;
const fpsCounterReset = () => {
    fps = fpsCounter;
    fpsCounter = 0;
};
const drawFpsCounter = () => {
    ctx.textAlign = "left";
    ctx.font = "20px Comic Sans MS";
    ctx.fillStyle = "purple";
    ctx.fillText("FPS: " + fps, 2, 20);
};
const drawMovementInfo = () => {
    ctx.textAlign = "left";
    ctx.font = "30px Comic Sans MS";
    ctx.fillStyle = "#5EE7FF";
    ctx.fillText("Click to move with mouse", canvas.width / 2 - 130, 40);
};
const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cubes.forEach((cube) => cube.drawOutline());
    drawFpsCounter();
    drawMovementInfo();
    fpsCounter++;
    requestAnimationFrame(render);
};
const startEngine = () => {
    setInterval(fpsCounterReset, 1000);
    requestAnimationFrame(render);
    loadObjects();
    setEventListeners();
    setInterval(controls, 1000 / GAME_TICKS);
};
startEngine();
