# 3D TS Engine

A 3D rendering engine written from scratch in TypeScript - no Three.js,
no WebGL. Objects are projected and drawn as lines on a plain HTML canvas.

- [PLAY](https://aureliagorzna.github.io/3d-TS-engine/)

## How it works

Every frame, the engine takes the vertices of each object in 3D world
space, transforms them relative to the camera position and rotation,
projects them onto a 2D plane using perspective division, and draws
the resulting edges to canvas.

- **Projection** - perspective projection matrix, applied per vertex
- **Camera** - free movement on all three axes plus yaw rotation
- **Rendering** - edge-based wireframe drawing, redrawn each frame

## What I learned

Writing the math myself instead of using a library meant working
through the projection pipeline step by step - the part that took
longest was implementing camera rotation and rendering objects 
relative to it.

## Controls

Movement WASD, up/down space/shift, look C/V, rotate cubes E/R.
