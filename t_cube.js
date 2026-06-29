const ctx = game.getContext('2d');
game.width = 400; game.height = 400;
game.style.cursor = 'grab';

const vs = [
  {x:.5,y:.5,z:.5},{x:-.5,y:.5,z:.5},
  {x:-.5,y:-.5,z:.5},{x:.5,y:-.5,z:.5},
  {x:.5,y:.5,z:-.5},{x:-.5,y:.5,z:-.5},
  {x:-.5,y:-.5,z:-.5},{x:.5,y:-.5,z:-.5}
];
const faces = [
  {idx:[0,1,2,3],nx:0,ny:0,nz:1},
  {idx:[4,5,6,7],nx:0,ny:0,nz:-1},
  {idx:[0,1,5,4],nx:0,ny:1,nz:0},
  {idx:[2,3,7,6],nx:0,ny:-1,nz:0},
  {idx:[1,2,6,5],nx:-1,ny:0,nz:0},
  {idx:[0,3,7,4],nx:1,ny:0,nz:0}
];
const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

let rotX=0.4, rotY=0.6;
let velX=0, velY=0.008;
let shimmerT=0;
let dragging=false, lastMX=0, lastMY=0;
let dragVX=0, dragVY=0;
let wobble=0, wobbleV=0;
const dz=2, FPS=60;

function screen(p){ return {x:(p.x+1)/2*400, y:(1-(p.y+1)/2)*400}; }
function project({x,y,z}){ return {x:x/z, y:y/z}; }
function tzz({x,y,z},d){ return {x,y,z:z+d}; }

function rotateX({x,y,z},a){
  const c=Math.cos(a),s=Math.sin(a);
  return {x, y:y*c-z*s, z:y*s+z*c};
}
function rotateY({x,y,z},a){
  const c=Math.cos(a),s=Math.sin(a);
  return {x:x*c+z*s, y, z:-x*s+z*c};
}
function rotateZ({x,y,z},a){
  const c=Math.cos(a),s=Math.sin(a);
  return {x:x*c-y*s, y:x*s+y*c, z};
}

function transform(v){
  let p = rotateZ(rotateY(rotateX(v, rotX+wobble*0.3), rotY), wobble*0.15);
  return screen(project(tzz(p, dz)));
}
function transformRaw(v){
  return rotateZ(rotateY(rotateX(v, rotX+wobble*0.3), rotY), wobble*0.15);
}

function clear(){
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,400,400);
}

function drawFaces(pts){
  const sortable = faces.map(f => {
    const tr = f.idx.map(i => transformRaw(vs[i]));
    const avgZ = tr.reduce((s,p) => s+p.z, 0) / tr.length;
    const rn = transformRaw({x:f.nx, y:f.ny, z:f.nz});
    return {f, avgZ, dot:rn.z};
  }).filter(o => o.dot < 0).sort((a,b) => b.avgZ - a.avgZ);

  for(const {f, dot} of sortable){
    const fp = f.idx.map(i => pts[i]);
    const light = Math.max(0, Math.min(1, -dot));
    const cx = fp.reduce((s,p) => s+p.x, 0) / fp.length;
    const cy = fp.reduce((s,p) => s+p.y, 0) / fp.length;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fp[0].x, fp[0].y);
    for(let i=1;i<fp.length;i++) ctx.lineTo(fp[i].x, fp[i].y);
    ctx.closePath();
    ctx.clip();

    const ba = 0.08 + light * 0.10;
    const g = ctx.createRadialGradient(cx-30,cy-30,5,cx,cy,120);
    g.addColorStop(0, `rgba(255,255,255,${0.22+light*0.12})`);
    g.addColorStop(0.3, `rgba(180,220,255,${ba})`);
    g.addColorStop(0.6, `rgba(140,190,255,${ba*0.6})`);
    g.addColorStop(1, `rgba(255,255,255,${0.04+light*0.06})`);
    ctx.fillStyle=g; ctx.fill();

    const sx = cx + Math.cos(shimmerT + f.nx*2) * 80;
    const sy = cy + Math.sin(shimmerT + f.ny*2) * 80;
    const sh = ctx.createRadialGradient(sx,sy,0,sx,sy,90);
    sh.addColorStop(0, `rgba(200,230,255,${0.20*light})`);
    sh.addColorStop(0.4, `rgba(150,200,255,${0.08*light})`);
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle=sh; ctx.fill();

    const eg = ctx.createLinearGradient(fp[0].x,fp[0].y,fp[2].x,fp[2].y);
    eg.addColorStop(0, `rgba(255,255,255,${0.35*light})`);
    eg.addColorStop(0.5, `rgba(180,215,255,${0.10*light})`);
    eg.addColorStop(1, `rgba(255,255,255,${0.20*light})`);
    ctx.strokeStyle=eg; ctx.lineWidth=0.5; ctx.stroke();
    ctx.restore();
  }
}

function drawEdges(pts){
  for(const [a,b] of edges){
    const p1=pts[a], p2=pts[b];
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.lineWidth=5; ctx.stroke();

    const gr = ctx.createLinearGradient(p1.x,p1.y,p2.x,p2.y);
    gr.addColorStop(0,   'rgba(255,255,255,0.65)');
    gr.addColorStop(0.3, 'rgba(180,215,255,0.85)');
    gr.addColorStop(0.6, 'rgba(200,230,255,0.60)');
    gr.addColorStop(1,   'rgba(255,255,255,0.65)');
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.strokeStyle=gr; ctx.lineWidth=1.5; ctx.stroke();
  }
}

function drawVerts(pts){
  for(const p of pts){
    const g = ctx.createRadialGradient(p.x-2,p.y-2,1,p.x,p.y,7);
    g.addColorStop(0,   'rgba(255,255,255,0.95)');
    g.addColorStop(0.4, 'rgba(180,220,255,0.70)');
    g.addColorStop(1,   'rgba(140,190,255,0)');
    ctx.beginPath(); ctx.arc(p.x,p.y,7,0,Math.PI*2);
    ctx.fillStyle=g; ctx.fill();
  }
}

function frame(){
  shimmerT += 0.8/FPS;

  if(dragging){
    velX = dragVY * 0.04;
    velY = dragVX * 0.04;
    wobbleV += (Math.abs(dragVX) + Math.abs(dragVY)) * 0.003;
  } else {
    velX *= 0.92;
    velY += (0.008 - velY) * 0.01;
    wobbleV *= 0.88;
  }

  wobble += wobbleV;
  wobble *= 0.93;
  wobbleV *= 0.93;

  rotX += velX;
  rotY += velY;

  clear();
  const pts = vs.map(v => transform(v));
  drawFaces(pts);
  drawEdges(pts);
  drawVerts(pts);
  setTimeout(frame, 1000/FPS);
}

function getPos(e){
  const r = game.getBoundingClientRect();
  if(e.touches) return {x:e.touches[0].clientX-r.left, y:e.touches[0].clientY-r.top};
  return {x:e.clientX-r.left, y:e.clientY-r.top};
}

game.addEventListener('mousedown', e => {
  dragging=true; game.style.cursor='grabbing';
  const p=getPos(e); lastMX=p.x; lastMY=p.y;
  dragVX=0; dragVY=0;
});
game.addEventListener('touchstart', e => {
  e.preventDefault(); dragging=true;
  const p=getPos(e); lastMX=p.x; lastMY=p.y;
  dragVX=0; dragVY=0;
}, {passive:false});

window.addEventListener('mousemove', e => {
  if(!dragging) return;
  const p=getPos(e);
  dragVX=p.x-lastMX; dragVY=p.y-lastMY;
  lastMX=p.x; lastMY=p.y;
});
game.addEventListener('touchmove', e => {
  e.preventDefault();
  if(!dragging) return;
  const p=getPos(e);
  dragVX=p.x-lastMX; dragVY=p.y-lastMY;
  lastMX=p.x; lastMY=p.y;
}, {passive:false});

window.addEventListener('mouseup', () => {
  dragging=false; game.style.cursor='grab';
  wobbleV += Math.sqrt(dragVX*dragVX + dragVY*dragVY) * 0.02;
});
game.addEventListener('touchend', () => {
  dragging=false;
  wobbleV += Math.sqrt(dragVX*dragVX + dragVY*dragVY) * 0.02;
});

setTimeout(frame, 1000/FPS);