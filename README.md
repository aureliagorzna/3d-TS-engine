# 3D TS Engine

A 3D wireframe renderer written from scratch in TypeScript - no Three.js,
no WebGL, no matrix library. Objects are projected onto a plain 2D canvas
and drawn as lines.

- [PLAY](https://aureliagorzna.github.io/3d-TS-engine/)

## How it works

**Projection.** Each 3D point is flattened by dividing its x and y by its
depth, then scaled:

    x2d = (x - cameraX) / (z + cameraZ) * SCALE
    y2d = (y - cameraY) / (z + cameraZ) * SCALE

No projection matrix - just perspective division, which is enough for a
wireframe and keeps the whole pipeline readable.

**Cubes.** Each cube stores 8 corners and draws its 12 edges as lines. It
also tracks its own center, its distance from the camera, and the polar
angle of each corner relative to that center.

**Rotation is done in polar coordinates, not with matrices.** To spin a
cube, every corner's angle is incremented and its new position is
recomputed with cos/sin around the cube's center. Angles come from an
`asin` helper with manual quadrant correction, since `asin` alone can't
tell which of the four quadrants a point is in.

**Looking around orbits the world, not the camera.** Rather than rotating
a view direction, `rotateFromPlayer` moves each cube along a circle
centred on the player and spins it by the same angle. The visual result
is a camera turn, achieved entirely with the same circle math used for
cube rotation.

**Culling.** Cubes whose center is behind the camera are skipped, and
lines longer than the canvas width are discarded - a cheap way to drop
edges that blow up as z approaches zero.

**Loop.** Rendering and input run on two independent intervals: a render
loop and a 200-tick-per-second physics loop, so movement smoothness is
decoupled from frame rate. Live FPS is drawn to the canvas.

**World.** The scene is built procedurally - a platform generator for the
ground, a leaf-pattern function for trees, and a ring of cubes placed
around the sky using the same polar helper.

## Controls

WASD to move, space/shift for up and down, C/V to look, E/R to spin cubes.
