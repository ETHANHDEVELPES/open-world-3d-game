import * as THREE from 'three';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91b4df);
scene.fog = new THREE.FogExp2(0xacc3c1, 0.0042);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 700);

const hemi = new THREE.HemisphereLight(0xd9efff, 0x5d7044, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1c2, 2.8);
sun.position.set(-80,110,-40);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-90; sun.shadow.camera.right=90;
sun.shadow.camera.top=90; sun.shadow.camera.bottom=-90;
scene.add(sun);

const WORLD=300;
function heightAt(x,z){
  const rolling=Math.sin(x*.027)*3.2 + Math.cos(z*.024)*3.5;
  const hills=6*Math.sin((x+z)*.018)*Math.cos((x-z)*.014);
  const ridges=Math.exp(-(x*x+z*z)/23000)*-5;
  const detail=Math.sin(x*.08)*Math.cos(z*.07)*.55;
  return rolling+hills+ridges+detail;
}

const geo = new THREE.PlaneGeometry(WORLD,WORLD,100,100);
geo.rotateX(-Math.PI/2);
const pos=geo.attributes.position;
const colors=[];
const low=new THREE.Color(0x687a45), high=new THREE.Color(0x9da26a), rock=new THREE.Color(0x777967);
for(let i=0;i<pos.count;i++){ const x=pos.getX(i),z=pos.getZ(i),y=heightAt(x,z); pos.setY(i,y); const t=THREE.MathUtils.clamp((y+3)/14,0,1); const c=y>9?rock:low.clone().lerp(high,t); colors.push(c.r,c.g,c.b); }
geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals();
const terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));
terrain.receiveShadow=true; scene.add(terrain);

const water=new THREE.Mesh(new THREE.CircleGeometry(160,64),new THREE.MeshPhysicalMaterial({color:0x70a7a0,transparent:true,opacity:.72,roughness:.18,metalness:.05,depthWrite:false}));
water.rotation.x=-Math.PI/2; water.position.y=-4.8; water.position.z=15; scene.add(water);

function seededRandom(seed){ let s=seed>>>0; return ()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296); }
const rand=seededRandom(73429);

// Low-poly vegetation
const trunkMat=new THREE.MeshStandardMaterial({color:0x5c452c,roughness:1});
const leafMat=new THREE.MeshStandardMaterial({color:0x506d3a,roughness:.9});
for(let i=0;i<220;i++){
  const x=(rand()-.5)*280, z=(rand()-.5)*280;
  const y=heightAt(x,z); if(y<-.5||y>12||Math.abs(x)<8&&Math.abs(z)<18) continue;
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.32,.55,3.4,6),trunkMat); trunk.position.y=1.7; trunk.castShadow=true; g.add(trunk);
  const foliage=new THREE.Mesh(new THREE.ConeGeometry(2.2+rand(),5+rand()*2,7),leafMat); foliage.position.y=5.2+rand(); foliage.castShadow=true; g.add(foliage);
  g.position.set(x,y,z); g.rotation.y=rand()*Math.PI*2; g.scale.setScalar(.75+rand()*.65); scene.add(g);
}

// Rocks
const rockMat=new THREE.MeshStandardMaterial({color:0x777969,roughness:.9,flatShading:true});
for(let i=0;i<130;i++){ const x=(rand()-.5)*290,z=(rand()-.5)*290,y=heightAt(x,z); if(y<-.5)continue; const r=.35+rand()*1.6; const m=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),rockMat); m.position.set(x,y+r*.25,z); m.scale.y=.65+rand()*.6; m.rotation.set(rand(),rand()*3,rand()); m.castShadow=true;m.receiveShadow=true;scene.add(m); }

// Player character
const player=new THREE.Group();
const cloth=new THREE.MeshStandardMaterial({color:0xb99b55,roughness:.75});
const boots=new THREE.MeshStandardMaterial({color:0x3f3025,roughness:.9});
const skin=new THREE.MeshStandardMaterial({color:0x8d5c42,roughness:.8});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.15,4,8),cloth); body.position.y=1.45; body.castShadow=true; player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.38,12,8),skin); head.position.y=2.55; head.castShadow=true; player.add(head);
for(const side of [-1,1]){ const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.62,4,6),boots);leg.position.set(side*.23,.5,0);leg.castShadow=true;player.add(leg); }
scene.add(player);

// Ancient waystones
const waystones=[];
const stonePositions=[[28,-25],[-38,-48],[55,38],[-58,35],[18,62]];
const crystalMat=new THREE.MeshStandardMaterial({color:0x72d3c7,emissive:0x1b7d74,emissiveIntensity:.8,roughness:.25,metalness:.15});
for(let i=0;i<stonePositions.length;i++){ const [x,z]=stonePositions[i]; const g=new THREE.Group(); const base=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.1,.35,8),rockMat);base.position.y=.18;base.castShadow=true;g.add(base); const stem=new THREE.Mesh(new THREE.DodecahedronGeometry(.72,0),crystalMat);stem.position.y=2.1;stem.scale.set(.65,1.8,.65);stem.castShadow=true;g.add(stem); const ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.055,6,24),crystalMat);ring.position.y=2.15;ring.rotation.x=Math.PI/2;g.add(ring); g.position.set(x,heightAt(x,z),z);g.userData.collected=false;scene.add(g);waystones.push(g); }

let yaw=0, pitch=.18, collected=0, started=false;
const keys={};
const velocity=new THREE.Vector3();
addEventListener('keydown',e=>keys[e.code]=true);
addEventListener('keyup',e=>keys[e.code]=false);

canvas.addEventListener('click',()=>{if(started)canvas.requestPointerLock();});
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||!started)return;yaw-=e.movementX*.0025;pitch-=e.movementY*.0020;pitch=THREE.MathUtils.clamp(pitch,-.05,.65);});

const startButton=document.querySelector('#startButton');
startButton.addEventListener('click',()=>{started=true;document.querySelector('#startScreen').classList.add('hidden');canvas.requestPointerLock();});

const toast=document.querySelector('#toast');
let toastTimer;
function showToast(text){ toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2200); }

player.position.set(0,heightAt(0,0),12);
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const desired=new THREE.Vector3();
  if(keys.KeyW)desired.add(forward); if(keys.KeyS)desired.sub(forward); if(keys.KeyD)desired.add(right); if(keys.KeyA)desired.sub(right);
  if(desired.lengthSq()>0){ desired.normalize();const speed=keys.ShiftLeft||keys.ShiftRight?11:6.5;velocity.lerp(desired.multiplyScalar(speed),1-Math.pow(.001,dt));player.rotation.y=yaw+Math.PI; }
  else velocity.multiplyScalar(Math.pow(.025,dt));
  player.position.addScaledVector(velocity,dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-145,145);player.position.z=THREE.MathUtils.clamp(player.position.z,-145,145);
  player.position.y=heightAt(player.position.x,player.position.z);

  const target=player.position.clone().add(new THREE.Vector3(0,1.9,0));
  const dist=8.5;
  const offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*dist,pitch*9+5,Math.cos(yaw)*Math.cos(pitch)*dist);
  camera.position.lerp(target.clone().add(offset),1-Math.exp(-dt*8));camera.lookAt(target);

  for(const s of waystones){ if(s.userData.collected)continue; s.children[1].rotation.y+=dt*.9;s.children[2].rotation.z+=dt*.5; if(s.position.distanceTo(player.position)<3){ s.userData.collected=true;collected++;document.querySelector('#progress').textContent=`${collected} / 5`;for(const part of s.children)part.visible=false;if(collected===5){showToast('All waystones restored — the valley remembers');document.querySelector('#objectiveText').textContent='Journey complete'; }else showToast(`Waystone restored · ${collected} / 5`);} }

  const deg=((THREE.MathUtils.radToDeg(yaw)%360)+360)%360;
  const dirs=['N','NE','E','SE','S','SW','W','NW'];
  document.querySelector('#direction').textContent=dirs[Math.round(deg/45)%8];
  water.material.opacity=.68+Math.sin(clock.elapsedTime*.8)*.04;
  document.querySelector('#crosshair').style.opacity=document.pointerLockElement===canvas?'1':'0';
  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
