const canvas: HTMLCanvasElement = document.querySelector("canvas")
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")

const FPS_MAX: number = Infinity
const GAME_TICKS: number = 100
const CUBE_SIZE: number = 2
const SCALE: number = 150
const viewDistance: number = 12
const color: string = "limegreen"
const bgColor: string = "rgb(15,15,15)"
// const bgColor: string = "lightblue"
const aspectRatio: number = canvas.width / canvas.height

canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.backgroundColor = bgColor

const cameraPos: position3d = {
    x: -0.5,
    y: -1,
    z: 0
}

const initCameraPos: position3d = Object.create(cameraPos)

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
}

const movementProps: typeof KEYS = Object.create(KEYS)

for (let key in movementProps) {
    movementProps[key] = false
}

window.addEventListener("keydown", (e: KeyboardEvent) => {
    for (let key in KEYS) {
        if (e.key.toLowerCase() === KEYS[key].toLowerCase())
            movementProps[key] = true
    }
})

window.addEventListener("keyup", (e: KeyboardEvent) => {
    for (let key in KEYS) {
        if (e.key.toLowerCase() === KEYS[key].toLowerCase())
            movementProps[key] = false
    }
})

const controls = (): void => {
    if (movementProps.moveLeft) {
        cameraPos.x += 0.2
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
    }
    if (movementProps.moveRight) {
        cameraPos.x -= 0.2
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
    }
    if (movementProps.moveUp) cameraPos.y += 0.2
    if (movementProps.moveDown) cameraPos.y -= 0.2
    if (movementProps.moveIn) {
        cameraPos.z += 0.01
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
        // console.log("Camera: " + cameraPos.z)
        // console.log("Cube: " + cubes[0].center.z)
        // console.log(cubes[0].pos.z)
        // console.log(cameraPos.z)
    }
    if (movementProps.moveOut) {
        cameraPos.z -= 0.01
        // cubes.forEach((cube: Cube) => cube.updateDistanceFromPlayer())
        // console.log(cubes[0].pos.z)
        // console.log(cameraPos.z)
    }

    if (movementProps.rotateRight) cubes.forEach((cube: Cube) => cube.rotateFromCenter(1))
    if (movementProps.rotateLeft) cubes.forEach((cube: Cube) => cube.rotateFromCenter(-1))
    if (movementProps.lookRight) cubes.forEach((cube: Cube) => cube.rotateFromPlayer(1))
    if (movementProps.lookLeft) cubes.forEach((cube: Cube) => cube.rotateFromPlayer(-1))
}

type position3d = {
    x: number
    y: number
    z: number
}

type position = {
    x: number
    y: number
}

const cubes: Cube[] = []

// 1 -2.4
// 0 -0.4
// -1 1.6 2.6
// -2 3.6 5.6
// -3 5.6 8.6
// -4 7.6 11.6

const getDifference = (z: number): number => -2.4 + (z - 1) * -2

class Cube {
    public pos: position3d
    public displayPos: position3d
    public corners: position3d[]
    public angle: number
    public angles: number[]
    public center: position3d
    public radiusCube: number
    public radiusReal: number
    public distanceFromPlayer: number
    public color: string

    constructor(pos: position3d, color?: string, rotation?: number) {
        this.color = color || "limegreen"
        this.displayPos = pos
        this.pos = { x: this.displayPos.x * 2, y: this.displayPos.y * 2, z: this.displayPos.z * 2 }

        this.setCorners()
        this.setCenter()

        this.radiusCube = getDistance({ x: this.center.x, y: this.center.y }, { x: this.corners[0].x, y: this.corners[0].y })

        this.setAngles()

        const radiusCenter = convert3dTo2d({ x: this.center.x, y: this.center.y, z: 1 })
        const corner1Real = convert3dTo2d({ x: this.corners[0].x, y: this.corners[0].y, z: 1 })
        this.radiusReal = getDistance({ x: this.center.x, y: this.center.y }, { x: this.corners[0].x, y: this.corners[0].y })

        this.updateDistanceFromPlayer()

        this.updateAngle()

        this.rotateFromCenter(rotation || 0)
        // this.rotateFromPlayer(0)

        this.updateCenter()
        if (this.color === "cornflowerblue") this.center = cameraPos
    }

    public updateCenter() {
        const pos = getCirclePoint(this.angle, this.distanceFromPlayer * 1)
        // console.log(this.distanceFromPlayer)
        this.center = { x: pos.x, y: this.center.y, z: pos.y }
        this.rotateFromCenter(0)
        // if (this.center.z < cameraPos.z) console.log("behind")
    }

    public updateAngle() {
        // this.updateDistanceFromPlayer()
        const a = { x: cameraPos.x, y: cameraPos.z }
        const b = { x: this.center.x, y: this.center.z }
        this.angle = getAngle(a, this.distanceFromPlayer, b)
    }

    public updateDistanceFromPlayer() {
        const a = { x: cameraPos.x, y: cameraPos.z }
        const b = { x: this.center.x, y: this.center.z }

        this.distanceFromPlayer = getDistance(a, b)
    }

    public setAngles() {
        const a1Angle = getAngle(this.corners[0], this.radiusCube, this.center)
        const a2Angle = getAngle(this.corners[1], this.radiusCube, this.center)
        const b1Angle = getAngle(this.corners[2], this.radiusCube, this.center)
        const b2Angle = getAngle(this.corners[3], this.radiusCube, this.center)

        const a3Angle = a1Angle
        const a4Angle = a2Angle
        const b3Angle = b2Angle
        const b4Angle = b1Angle

        this.angles = [a1Angle, a2Angle, a3Angle, a4Angle, b1Angle, b2Angle, b3Angle, b4Angle]
    }

    public setCorners() {
        const corner1: position3d = this.pos
        const corner2: position3d = { x: this.pos.x + CUBE_SIZE, y: this.pos.y, z: this.pos.z }
        const corner3: position3d = { x: this.pos.x, y: this.pos.y + CUBE_SIZE, z: this.pos.z }
        const corner4: position3d = { x: this.pos.x + CUBE_SIZE, y: this.pos.y + CUBE_SIZE, z: this.pos.z }

        const corner5: position3d = { x: this.pos.x, y: this.pos.y, z: this.pos.z + CUBE_SIZE / 5 }
        const corner6: position3d = { x: this.pos.x + CUBE_SIZE, y: this.pos.y, z: this.pos.z + CUBE_SIZE / 5 }
        const corner7: position3d = { x: this.pos.x, y: this.pos.y + CUBE_SIZE, z: this.pos.z + CUBE_SIZE / 5 }
        const corner8: position3d = { x: this.pos.x + CUBE_SIZE, y: this.pos.y + CUBE_SIZE, z: this.pos.z + CUBE_SIZE / 5 }

        this.corners = [corner1, corner2, corner3, corner4, corner5, corner6, corner7, corner8]
    }

    public renderLine(x: number, y: number) {
        const corner1: position = convert3dTo2d(this.corners[x - 1])
        const corner2: position = convert3dTo2d(this.corners[y - 1])

        const differenceZ: number = getDifference(this.pos.z)
        // if (cameraPos.z < this.corners[x - 1].z + differenceZ && cameraPos.z < this.corners[y - 1].z + differenceZ)

        drawLine(corner1, corner2, this.color)
    }

    public draw() {
        if (this.color === "cornflowerblue") this.center = cameraPos
        if (cameraPos.z > -this.center.z) return

        this.renderLine(1, 2)
        this.renderLine(1, 3)
        this.renderLine(2, 4)
        this.renderLine(3, 4)
        this.renderLine(5, 6)
        this.renderLine(5, 8)
        this.renderLine(6, 7)
        this.renderLine(8, 7)

        this.renderLine(1, 5)
        this.renderLine(2, 6)
        this.renderLine(3, 8)
        this.renderLine(4, 7)

        // this.drawCenter()
        // this.fillColor()
        // this.drawCorners()
    }

    public fillColor() {
        const corner1: position3d = this.corners[0]
        const corner2: position3d = this.corners[3]

        const cornerA = { x: corner1.x, y: corner1.y + CUBE_SIZE / 2, z: corner1.z }
        const cornerB = { x: corner2.x, y: corner2.y - CUBE_SIZE / 2, z: corner2.z }

        drawLine(convert3dTo2d(cornerA), convert3dTo2d(cornerB), this.color, 100)
    }

    public setCenter() {
        this.center = { x: this.pos.x + CUBE_SIZE / 2, y: this.pos.y + CUBE_SIZE / 2, z: this.pos.z + CUBE_SIZE / 10 }
    }

    public drawCenter(): void {
        const drawableCenter: position = convert3dTo2d(this.center)
        const differenceZ: number = getDifference(this.pos.z)

        const pos: position = getCirclePoint(this.angle, this.distanceFromPlayer * 1)

        // if (cameraPos.z < this.center.z + differenceZ)
        drawCircle(drawableCenter, "orange")
        drawCircle(pos, "limegreen")
    }

    public drawCorners(): void {
        const colors: string[] = ["red", "orange", "magenta", "gray", "lightblue", "cornflowerblue", "purple", "olive"]

        this.corners.forEach((corner: position3d, i: number) => {
            const corner1: position = convert3dTo2d(corner)
            drawCircle(corner1, colors[i])
        })
    }

    public rotateFromCenter(newAngle: number): void {
        const copyAngles: number[] = this.angles.map((angle: number) => angle + newAngle)
        this.angles = copyAngles

        this.angles.forEach((angle: number, i: number) => {
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

            const pos: position = getCirclePoint(angle, this.radiusCube)
            // particle            center
            this.corners[i] = { x: this.center.x + pos.x, y: this.corners[i].y, z: this.center.z + pos.y }
        })
    }

    public rotateFromPlayer(newAngle: number): void {
        this.angle += newAngle
        this.updateCenter()
        this.rotateFromCenter(newAngle)
    }
}
let show = true

const pos1: position = {
    x: 0,
    y: 0
}

const pos2: position = {
    x: 0,
    y: 0
}

const drawLine = (pos1: position, pos2: position, customColor?: string, customWidth?: number): void => {
    ctx.strokeStyle = customColor || color
    customWidth != null ? ctx.lineWidth = customWidth : ctx.lineWidth = 1

    // if (pos1.x + canvas.width / 2 + cameraPos.x > canvas.width || pos1.x + canvas.width / 2 + cameraPos.x < 0) return
    // if (pos2.x + canvas.width / 2 + cameraPos.x > canvas.width || pos2.x + canvas.width / 2 + cameraPos.x < 0) return
    // if (pos1.y + canvas.height / 2 + cameraPos.x > canvas.height || pos1.y + canvas.height / 2 + cameraPos.x < 0) return
    // if (pos2.y + canvas.height / 2 + cameraPos.x > canvas.height || pos2.y + canvas.height / 2 + cameraPos.x < 0) return

    const a = canvas.width / 2 + pos1.x + cameraPos.x
    const b = canvas.height / 2 + pos1.y + cameraPos.y
    const c = canvas.width / 2 + pos2.x + cameraPos.x
    const d = canvas.height / 2 + pos2.y + cameraPos.y

    if (getDistance({ x: a, y: b }, { x: c, y: d }) > canvas.width) return

    ctx.beginPath()
    ctx.moveTo(a, b)
    ctx.lineTo(c, d)
    ctx.stroke()
}

const drawCircle = (pos: position, color: string) => {
    ctx.fillStyle = color

    ctx.beginPath()
    ctx.arc(canvas.width / 2 + pos.x + cameraPos.x, canvas.height / 2 + pos.y + cameraPos.y, 4, 0, Math.PI * 2)
    ctx.fill()
}

const convert3dTo2d = (pos: position3d): position => {
    const x: number = ((pos.x - cameraPos.x) / (pos.z + cameraPos.z)) * SCALE
    const y: number = ((pos.y - cameraPos.y) / (pos.z + cameraPos.z)) * SCALE
    return { x, y }
}

const getCenter = (startPos: position, endPos: position): position => {
    return { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 }
}

const getDistance = (pos1: position, pos2: position): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}

const getDistance3d = (pos1: position3d, pos2: position3d): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) + Math.pow(pos1.z - pos2.z, 2))
}

const getMidLinePoint = (pos1: position, pos2: position): position => {
    return { x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 }
}

const degreesToRadians = (deg: number): number => deg * (Math.PI / 180)

const radiansToDegrees = (rad: number): number => (rad * 180) / Math.PI

const getCirclePoint = (angle: number, radius: number): position => {
    const radians: number = degreesToRadians(angle)
    return { x: radius * Math.cos(radians), y: -(radius * Math.sin(radians)) / 10 }
}

const getCirclePoint2 = (angle: number, radius: number): position => {
    const radians: number = degreesToRadians(angle)
    return { x: radius * Math.cos(radians), y: (radius * Math.sin(radians)) / 10 }
}

const getAngle = (pos: position, radius: number, center: position): number => {
    let quarter: number

    if (pos.x >= center.x && pos.y <= center.y) quarter = 1
    if (pos.x <= center.x && pos.y <= center.y) quarter = 2
    if (pos.x <= center.x && pos.y >= center.y) quarter = 3
    if (pos.x >= center.x && pos.y >= center.y) quarter = 4

    const a: number = getDistance({ x: 0, y: center.y }, { x: 0, y: pos.y })
    const c: number = radius
    const sin: number = a / c

    const radians: number = Math.asin(sin)
    let degrees: number = radiansToDegrees(radians)

    if (quarter === 2) degrees = 90 + (90 - degrees)
    if (quarter === 3) degrees = 180 + degrees
    if (quarter === 4) degrees = 270 + (90 - degrees)

    return degrees
}

const getAnglePure = (pos: position, radius: number, center: position): number => {
    const a: number = getDistance({ x: 0, y: center.y }, { x: 0, y: pos.y })
    const c: number = radius
    const sin: number = a / c

    const radians: number = Math.asin(sin)
    let degrees: number = radiansToDegrees(radians)

    return degrees
}

// for (let i = 0; i < 360; i += 10) {
//     const radius = 10
//     const pos = getCirclePoint(i, radius) 
//     cubes.push(new Cube({ x: pos.x + cameraPos.x, y: cameraPos.y, z: (pos.y - 0) * 10 }, "red"))
// }
// cubes.push(new Cube({ x: cameraPos.x, y: cameraPos.y, z: cameraPos.z - 14 }, "orange"))

// for (let i = 0; i < 360; i += 10) {
//     const radius = 10
//     const pos = getCirclePoint(i, radius) 
//     cubes.push(new Cube({ x: pos.x + cameraPos.x, y: cameraPos.y, z: (pos.y + 4) * 10 }, "red"))
// }

// for (let i = 0; i < 360; i += 10) {
//     const pos = getCirclePoint(i, 1) 
//     cubes.push(new Cube({ x: pos.x + cameraPos.x, y: cameraPos.y, z: pos.y - cameraPos.z }, "red"))
//     // console.log(pos)
// }

// cubes.push(new Cube({ x: 2, y: -0, z: -3 }, "limegreen"))
// cubes.push(new Cube({ x: -2, y: -0, z: -3 }, "limegreen"))
// cubes.push(new Cube({ x: 2, y: -1, z: -3 }, "red"))
// cubes.push(new Cube({ x: -1, y: 3, z: -3 }, "limegreen"))
// cubes.push(new Cube({ x: 7, y: 3, z: -3 }, "limegreen"))

// cubes.push(new Cube({ x: 3, y: 3, z: -2.6 }, "orange"))
// cubes.push(new Cube({ x: 3, y: 3, z: -3.6 }, "limegreen"))

// cubes.push(new Cube({ x: 3, y: 2, z: -2 }, "cornflowerblue"))
// cubes.push(new Cube({ x: 3, y: 2, z: -2.2 }, "orange"))

const cubeX: number = -1

// cubes.push(new Cube({ x: cubeX, y: -1, z: -3 }, "limegreen"))
// // cubes.push(new Cube({ x: cubeX + 2, y: -1, z: -3 }, "orange"))

// cubes.push(new Cube({ x: cubeX, y: -1, z: -3 }, "limegreen", 45))
// cubes.push(new Cube({ x: cubeX, y: -1, z: -3 }, "limegreen", 22.5))
// cubes.push(new Cube({ x: cubeX, y: -1, z: -3 }, "limegreen", 67.5))

// cubes.push(new Cube({ x: 1, y: -1, z: -3 }, "limegreen"))
// cubes.push(new Cube({ x: 1, y: -1, z: -3 }, "limegreen", 45))
// cubes.push(new Cube({ x: 1, y: -1, z: -3 }, "limegreen", 22.5))
// cubes.push(new Cube({ x: 1, y: -1, z: -3 }, "limegreen", 67.5))

// cubes.push(new Cube({ x: 3, y: -1, z: -3 }, "limegreen"))
// cubes.push(new Cube({ x: 3, y: -1, z: -3 }, "limegreen", 45))
// cubes.push(new Cube({ x: 3, y: -1, z: -3 }, "limegreen", 22.5))
// cubes.push(new Cube({ x: 3, y: -1, z: -2 }, "limegreen", 67.5))

// cubes.push(new Cube({ x: cubeX, y: -1, z: -4 }, "brown"))
// cubes.push(new Cube({ x: cubeX, y: 1, z: -4 }, "brown"))

// cubes.push(new Cube({ x: cubeX, y: 3, z: -4 }, "limegreen"))

// cubes.push(new Cube({ x: cubeX - 2, y: 3, z: -4 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX - 4, y: 3, z: -4 }, "limegreen"))

// cubes.push(new Cube({ x: cubeX + 2, y: 3, z: -4 }, "limegreen"))

// cubes.push(new Cube({ x: cubeX + 4, y: 3, z: -4 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX, y: 5, z: -4 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX, y: 7, z: -4 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX - 2, y: 5, z: -4 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX + 2, y: 5, z: -4 }, "limegreen"))

// cubes.push(new Cube({ x: cubeX - 2, y: 3, z: -3.8 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX, y: 3, z: -3.8 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX + 2, y: 3, z: -3.8 }, "limegreen"))

// cubes.push(new Cube({ x: cubeX - 2, y: 3, z: -4.2 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX, y: 3, z: -4.2 }, "limegreen"))
// cubes.push(new Cube({ x: cubeX + 2, y: 3, z: -4.2 }, "limegreen"))

// cubes.push(new Cube({ x: 1, y: -7, z: -5 }, "limegreen"))
// cubes.push(new Cube({ x: 2, y: -7, z: -5 }, "limegreen"))

// cubes.push(new Cube({ x: 1, y: -7, z: 40 }, "lightblue"))
// cubes.push(new Cube({ x: 2, y: -7, z: 40 }, "lightblue"))

// cubes.push(new Cube({ x: -16, y: -7, z: -5 }, "limegreen"))
// cubes.push(new Cube({ x: -15, y: -7, z: -5 }, "limegreen"))
// cubes.push(new Cube({ x: -16, y: -7, z: -6 }, "limegreen"))
// cubes.push(new Cube({ x: 0, y: -4, z: 15 }, "limegreen"))

const addCube = (x: number, y: number, z: number, color: string) => {
    cubes.push(new Cube({ x, y, z }, color))
}

for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 20; x++) {
        addCube(y - 5, -4, 10 + x, "limegreen")
    }
}

addCube(0, -3, 15, "brown")
addCube(0, -2, 15, "brown")
addCube(0, -1, 15, "brown")

const cameraCube = new Cube(cameraPos, "cornflowerblue")
cubes.push(cameraCube)
console.log(cameraCube.center, cameraCube.pos)

// cubes.push(new Cube({ x: 1, y: -7, z: -80 }, "limegreen"))
// cubes.push(new Cube({ x: 6, y: -7, z: -80 }, "limegreen"))

// for (let y = 0; y < 10; y++) {
//     for (let x = 0; x < 20; x++) {
//         cubes.push(new Cube({ x: x, y: -7, z: y }, "limegreen"))
//     }
// }

let fpsCounter: number = 0
let fps: number = 0

const fpsCounterReset = (): void => {
    fps = fpsCounter
    fpsCounter = 0
}

// displaying text on the canvas

const text = (): void => {
    ctx.textAlign = "left"
    ctx.font = "20px Comic Sans MS"
    ctx.fillStyle = "purple"
    ctx.fillText("FPS: " + fps, 2, 20)
}

const physics = (): void => {
    controls()
}

const render = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    cubes.forEach((cube: Cube) => cube.draw())
    // const cameraCube = new Cube(Object.create(cameraPos), "cornflowerblue")
    // // cameraCube.center.z = cameraPos.z - 1
    // cameraCube.draw()
    text()
    // drawCircle(pos1, "orange")
    // drawCircle(pos2, "lightblue")
    fpsCounter++
}

setInterval(fpsCounterReset, 1000)

render()
setInterval(render, 1000 / FPS_MAX)

// setTimeout(() => {
//     setInterval(render, 1000 / FPS_MAX)
// }, 500)

physics()
setInterval(physics, 1000 / GAME_TICKS)