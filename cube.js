let BACKGROUND = "#ffffff"
let FOREGROUND = "#ff5050"

//console.log(game)
game.width = 400
game.height = 400

const ctx = game.getContext("2d")
//console.log(ctx)

function clear(){
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0,0,game.width,game.height)
}

//Vertice as a square of size s @ (x,y) point
function point({x, y}){
    const s = 20;
    ctx.fillStyle = FOREGROUND
    //re
    ctx.fillRect(x - s/2, y - s/2, s, s)
}

function line(p1,p2){
    ctx.lineWidth = 3;
    ctx.strokeStyle = FOREGROUND
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

//make the middle of the canvas the reference coord point (middle@x:0,y:0)
function screen(p){
    return{ // -1 ..1 -> 0..2 -> 0..1 -> 0..w
        x: (p.x + 1)/2*game.width,
        y: (1-(p.y + 1)/2)*game.height //y is flipped
    }
}
// based on a formula x'=x/z and y'=y/z from point (x,y,z)
function project({x,y,z}){
    return {
        x: x/z,
        y: y/z
    }
}

function translate_z({x,y,z}, dz){
    return {x,y,z: z+dz};
}

function rotate_xz({x,y,z},angle){
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return{
        x: x*c-z*s,
        y,
        z: x*s+z*c
    }
}

//vertices - Cube
const vs = [
    {x:0.5, y:0.5, z: 0.5}, //@ z=0 the object is in the eye
    {x:-0.5, y:0.5, z: 0.5},
    {x:-0.5, y:-0.5, z: 0.5},
    {x:0.5, y:-0.5, z: 0.5},

    {x:0.5, y:0.5, z: -0.5},
    {x:-0.5, y:0.5, z: -0.5},
    {x:-0.5, y:-0.5, z: -0.5},
    {x:0.5, y:-0.5, z: -0.5}
]

//faces - connects the lines to vertices
const edges = [
    [0,1,2,3],
    [4,5,6,7],
    [0,4],[1,5],
    [2,6],[3,7]
]

const faces = [
    { idx: [0,1,2,3], color: "#ff0000" }, // front
    { idx: [4,5,6,7], color: "#00ff00" }, // back
    { idx: [0,1,5,4], color: "#0000ff" }, // top
    { idx: [2,3,7,6], color: "#ffff00" }, // bottom
    { idx: [1,2,6,5], color: "#ff00ff" }, // left
    { idx: [0,3,7,4], color: "#00ffff" }  // right
]

function drawFace(face){
    const pts = face.idx.map(i =>
        screen(project(translate_z(rotate_xz(vs[i], angle), dz)))
    );

    ctx.fillStyle = face.color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.closePath();
    ctx.fill();
}

const FPS = 60;
let dz = 2; //tracks the offset of z
let angle = 0;

function frame(){
    const dt = 1/FPS; //the delta time between the frames
    //dz += 1*dt
    angle += 1.5*dt
    clear()
    for (const v of vs){
        point(screen(project(translate_z(rotate_xz(v,angle),dz))))
    }
    for (const face of faces){
        drawFace(face);
    }
    for (const e of edges){
        for(let i =0; i<e.length; ++i){
            const a = vs[e[i]];
            const b = vs[e[(i+1)%e.length]];
            line(
                screen(project(translate_z(rotate_xz(a,angle),dz))),
                screen(project(translate_z(rotate_xz(b,angle),dz)))
            );
        }
    }
    setTimeout(frame, 1000/FPS);
}//1000 = milisec
setTimeout(frame, 1000/FPS);

game.addEventListener('mouseleave', () => {
  FOREGROUND = "#ff5050";
});

game.addEventListener('mouseenter', () => {
  FOREGROUND = "#50FF50";
});