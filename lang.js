import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

function createGlowMaterial(color, size = 128, opacity = 0.55) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Sprite(material);
}

const centralGlow = createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25);
centralGlow.scale.set(8, 8, 1);
scene.add(centralGlow);

for (let i = 0; i < 15; i++) {
    const hue = Math.random() * 360;
    const color = `hsla(${hue}, 80%, 50%, 0.6)`;
    const nebula = createGlowMaterial(color, 256);
    nebula.scale.set(100, 100, 1);
    nebula.position.set(
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175
    );
    scene.add(nebula);
}
const galaxyParameters = {
    count: 100000,
    arms: 6,
    radius: 100,
    spin: 0.5,
    randomness: 0.2,
    randomnessPower: 20,
    insideColor: new THREE.Color(0xd63ed6),
    outsideColor: new THREE.Color(0x48b8b8),
};

const heartImages = [
    ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.heartImages ? window.dataLove2Loveloom.data.heartImages : []),
    'img/anh.jpg','img/anh1.jpg','img/anh2.jpg','img/anh3.jpg',
    'img/anh4.jpg','img/anh5.jpg','img/anh6.jpg','img/anh7.jpg','img/anh8.jpg',
    'img/anh9.jpg','img/anh10.jpg','img/anh11.jpg','img/anh12.jpg','img/anh13.jpg',
    'img/anh14.jpg','imganh15.jpg','imganh16.jpg','imganh17.jpg'
];

const numGroups = heartImages.length;
const heartPointClouds = [];
const maxDensity = 15000; // mật độ cao nhất khi ít ảnh
const minDensity = 4000;  // mật độ thấp nhất khi nhiều ảnh
// Số lượng ảnh tối đa mà chúng ta quan tâm để điều chỉnh
const maxGroupsForScale = 8;

let pointsPerGroup;

if (numGroups <= 1) {
    pointsPerGroup = maxDensity;
} else if (numGroups >= maxGroupsForScale) {
    pointsPerGroup = minDensity;
} else {
    const t = (numGroups - 1) / (maxGroupsForScale - 1);
    pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
}

if (pointsPerGroup * numGroups > galaxyParameters.count) {
    pointsPerGroup = Math.floor(galaxyParameters.count / numGroups);
}

console.log(`Số lượng ảnh: ${numGroups}, Điểm mỗi ảnh: ${pointsPerGroup}`);

const positions = new Float32Array(galaxyParameters.count * 3);
const colors = new Float32Array(galaxyParameters.count * 3);
let pointIdx = 0;

for (let i = 0; i < galaxyParameters.count; i++) {
    const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
    const branchAngle = (i % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
    const spinAngle = radius * galaxyParameters.spin;

    const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
    const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const totalAngle = branchAngle + spinAngle;

    if (radius < 30 && Math.random() < 0.7) continue;

    const i3 = pointIdx * 3;
    positions[i3] = Math.cos(totalAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;

    const mixedColor = new THREE.Color(0xff66ff);
    mixedColor.lerp(new THREE.Color(0x66ffff), radius / galaxyParameters.radius);
    mixedColor.multiplyScalar(0.7 + 0.3 * Math.random());
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    pointIdx++;
}

const galaxyGeometry = new THREE.BufferGeometry();
galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, pointIdx * 3), 3));
galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, pointIdx * 3), 3));

const galaxyMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0.0 },
        uSize: { value: 50.0 * renderer.getPixelRatio() },
        uRippleTime: { value: -1.0 },
        uRippleSpeed: { value: 40.0 },
        uRippleWidth: { value: 20.0 }
    },
    vertexShader: `
        uniform float uSize;
        uniform float uTime;
        uniform float uRippleTime;
        uniform float uRippleSpeed;
        uniform float uRippleWidth;

        varying vec3 vColor;

        void main() {
            // Lấy màu gốc từ geometry (giống hệt vertexColors: true)
            vColor = color;

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            // ---- LOGIC HIỆU ỨNG GỢN SÓNG ----
            if (uRippleTime > 0.0) {
                float rippleRadius = (uTime - uRippleTime) * uRippleSpeed;
                float particleDist = length(modelPosition.xyz);

                float strength = 1.0 - smoothstep(rippleRadius - uRippleWidth, rippleRadius + uRippleWidth, particleDist);
                strength *= smoothstep(rippleRadius + uRippleWidth, rippleRadius - uRippleWidth, particleDist);

                if (strength > 0.0) {
                    vColor += vec3(strength * 2.0); // Làm màu sáng hơn khi sóng đi qua
                }
            }

            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;
            // Dòng này làm cho các hạt nhỏ hơn khi ở xa, mô phỏng hành vi của PointsMaterial
            gl_PointSize = uSize / -viewPosition.z;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        void main() {
            // Làm cho các hạt có hình tròn thay vì hình vuông
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            gl_FragColor = vec4(vColor, 1.0);
        }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true
});
const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

function createNeonTexture(image, size) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (aspectRatio > 1) {
        drawWidth = size;
        drawHeight = size / aspectRatio;
        offsetX = 0;
        offsetY = (size - drawHeight) / 2;
    } else {
        drawHeight = size;
        drawWidth = size * aspectRatio;
        offsetX = (size - drawWidth) / 2;
        offsetY = 0;
    }
    ctx.clearRect(0, 0, size, size);
    const cornerRadius = size * 0.1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(offsetX + cornerRadius, offsetY);
    ctx.lineTo(offsetX + drawWidth - cornerRadius, offsetY);
    ctx.arcTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + cornerRadius, cornerRadius);
    ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - cornerRadius);
    ctx.arcTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - cornerRadius, offsetY + drawHeight, cornerRadius);
    ctx.lineTo(offsetX + cornerRadius, offsetY + drawHeight);
    ctx.arcTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - cornerRadius, cornerRadius);
    ctx.lineTo(offsetX, offsetY + cornerRadius);
    ctx.arcTo(offsetX, offsetY, offsetX + cornerRadius, offsetY, cornerRadius);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
    return new THREE.CanvasTexture(canvas);
}

for (let group = 0; group < numGroups; group++) {
    const groupPositions = new Float32Array(pointsPerGroup * 3);
    const groupColorsNear = new Float32Array(pointsPerGroup * 3);
    const groupColorsFar = new Float32Array(pointsPerGroup * 3);
    let validPointCount = 0;

    for (let i = 0; i < pointsPerGroup; i++) {
        const idx = validPointCount * 3;
        const globalIdx = group * pointsPerGroup + i;
        const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
        if (radius < 30) continue;

        const branchAngle = (globalIdx % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
        const spinAngle = radius * galaxyParameters.spin;

        const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
        const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const totalAngle = branchAngle + spinAngle;

        groupPositions[idx] = Math.cos(totalAngle) * radius + randomX;
        groupPositions[idx + 1] = randomY;
        groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

        const colorNear = new THREE.Color(0xffffff);
        groupColorsNear[idx] = colorNear.r;
        groupColorsNear[idx + 1] = colorNear.g;
        groupColorsNear[idx + 2] = colorNear.b;

        const colorFar = galaxyParameters.insideColor.clone();
        colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius);
        colorFar.multiplyScalar(0.7 + 0.3 * Math.random());
        groupColorsFar[idx] = colorFar.r;
        groupColorsFar[idx + 1] = colorFar.g;
        groupColorsFar[idx + 2] = colorFar.b;

        validPointCount++;
    }

    if (validPointCount === 0) continue;
    const groupGeometryNear = new THREE.BufferGeometry();
    groupGeometryNear.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
    groupGeometryNear.setAttribute('color', new THREE.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3));

    const groupGeometryFar = new THREE.BufferGeometry();
    groupGeometryFar.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
    groupGeometryFar.setAttribute('color', new THREE.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3));


    const posAttr = groupGeometryFar.getAttribute('position');
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < posAttr.count; i++) {
        cx += posAttr.getX(i);
        cy += posAttr.getY(i);
        cz += posAttr.getZ(i);
    }
    cx /= posAttr.count;
    cy /= posAttr.count;
    cz /= posAttr.count;
    groupGeometryNear.translate(-cx, -cy, -cz);
    groupGeometryFar.translate(-cx, -cy, -cz);
    const src = heartImages[group];
    const buildWithTexture = (neonTexture) => {
        const materialNear = new THREE.PointsMaterial({
            size: 1.8,
            map: neonTexture,
            transparent: false,
            alphaTest: 0.2,
            depthWrite: true,
            depthTest: true,
            blending: THREE.NormalBlending,
            vertexColors: true
        });
        const materialFar = new THREE.PointsMaterial({
            size: 1.8,
            map: neonTexture,
            transparent: true,
            alphaTest: 0.2,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        const pointsObject = new THREE.Points(groupGeometryFar, materialFar);
        pointsObject.position.set(cx, cy, cz);
        pointsObject.userData.materialNear = materialNear;
        pointsObject.userData.geometryNear = groupGeometryNear;
        pointsObject.userData.materialFar = materialFar;
        pointsObject.userData.geometryFar = groupGeometryFar;
        scene.add(pointsObject);
        heartPointClouds.push(pointsObject);
    };

    if (src) {
        const img = new window.Image();
        try {
            const u = new URL(src, window.location.href);
            if (u.origin !== window.location.origin) {
                img.crossOrigin = 'anonymous';
            }
        } catch (e) {}
        img.src = src;
        img.onload = () => {
            const neonTexture = createNeonTexture(img, 256);
            buildWithTexture(neonTexture);
        };
        img.onerror = () => {
            const placeholder = document.createElement('canvas');
            placeholder.width = placeholder.height = 64;
            const ctx = placeholder.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 64, 64);
            grad.addColorStop(0, '#ffb3de');
            grad.addColorStop(1, '#e0b3ff');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            const neonTexture = createNeonTexture(placeholder, 256);
            buildWithTexture(neonTexture);
        };
    } else {
        const placeholder = document.createElement('canvas');
        placeholder.width = placeholder.height = 64;
        const ctx = placeholder.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 64, 64);
        grad.addColorStop(0, '#ffb3de');
        grad.addColorStop(1, '#e0b3ff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const neonTexture = createNeonTexture(placeholder, 256);
        buildWithTexture(neonTexture);
    }
}


const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const starCount = 20000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
});
const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = 'starfield';
starField.renderOrder = 999;
scene.add(starField);

let shootingStars = [];


function makeStarSpriteTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    g.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function makeTrailTexture(w = 16, h = 256, tint = '#99eaff') {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, h);
    // sáng ở đầu (gần head) -> mờ dần
    g.addColorStop(0.0, `${tint}`);
    g.addColorStop(0.25, `${tint}cc`);
    g.addColorStop(0.6, `${tint}66`);
    g.addColorStop(1.0, `${tint}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function createShootingStar() {
    const trailLength = 100;
    if (!planet.userData.atmosphere) {
        const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.05, 48, 48);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: { glowColor: { value: new THREE.Color(0xe0b3ff) } },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                uniform vec3 glowColor;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
        planet.userData.atmosphere = atmosphere;
    }

    // Màu sao băng: chỉ màu trắng
    const tailColor = new THREE.Color(0xffffff);

    // Đầu sao băng: sprite phát sáng mềm mại
    const headSpriteMat = new THREE.SpriteMaterial({
        map: makeStarSpriteTexture(256),
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
    });
    const head = new THREE.Sprite(headSpriteMat);
    const headScale = 1.2 + Math.random() * 0.8;
    head.scale.set(headScale, headScale, 1);

    const haloMat = new THREE.SpriteMaterial({
        map: makeStarSpriteTexture(256),
        color: tailColor.clone().multiplyScalar(1.2),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.75
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(headScale * 2.2, headScale * 2.2, 1);
    head.add(halo);
    const curve = createRandomCurve();
    const trailPoints = [];
    for (let i = 0; i < trailLength; i++) {
        const progress = i / (trailLength - 1);
        trailPoints.push(curve.getPoint(progress));
    }

    const trailTex = makeTrailTexture(8, 256, `#${tailColor.getHexString()}`);
    const tubeRadius = 0.25 + Math.random() * 0.25;
    const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trailPoints), trailLength * 2, tubeRadius, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
        color: tailColor,
        map: trailTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    opacity: 0.8,
        side: THREE.DoubleSide
    });
    const trailMesh = new THREE.Mesh(tubeGeo, tubeMat);

    const shootingStarGroup = new THREE.Group();
    shootingStarGroup.add(trailMesh);
    shootingStarGroup.add(head);
    shootingStarGroup.userData = {
        curve,
        progress: 0,
        speed: 0.0012 + Math.random() * 0.0012,
        life: 0,
        maxLife: 300,
        head,
        halo,
        trailMesh,
        trailTex,
        trailLength,
        trailPoints,
        tubeRadius,
        tailColor
    };
    scene.add(shootingStarGroup);
    shootingStars.push(shootingStarGroup);
}

function createRandomCurve() {
    const points = [];
    const startPoint = new THREE.Vector3(-200 + Math.random() * 100, -100 + Math.random() * 200, -100 + Math.random() * 200);
    const endPoint = new THREE.Vector3(600 + Math.random() * 200, startPoint.y + (-100 + Math.random() * 200), startPoint.z + (-100 + Math.random() * 200));
    const controlPoint1 = new THREE.Vector3(startPoint.x + 200 + Math.random() * 100, startPoint.y + (-50 + Math.random() * 100), startPoint.z + (-50 + Math.random() * 100));
    const controlPoint2 = new THREE.Vector3(endPoint.x - 200 + Math.random() * 100, endPoint.y + (-50 + Math.random() * 100), endPoint.z + (-50 + Math.random() * 100));

    points.push(startPoint, controlPoint1, controlPoint2, endPoint);
    return new THREE.CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint);
}

function createPlanetTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(size / 2, size / 2, size / 8, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.00, '#f8bbd0');
    gradient.addColorStop(0.12, '#f48fb1');
    gradient.addColorStop(0.22, '#f06292');
    gradient.addColorStop(0.35, '#ffffff');
    gradient.addColorStop(0.50, '#e1aaff');
    gradient.addColorStop(0.62, '#a259f7');
    gradient.addColorStop(0.75, '#b2ff59');
    gradient.addColorStop(1.00, '#3fd8c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const spotColors = ['#f8bbd0', '#f8bbd0', '#f48fb1', '#f48fb1', '#f06292', '#f06292', '#ffffff', '#e1aaff', '#a259f7', '#b2ff59'];
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 30 + Math.random() * 120;
        const color = spotColors[Math.floor(Math.random() * spotColors.length)];
        const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        spotGradient.addColorStop(0, color + 'cc'); // 'cc' là alpha
        spotGradient.addColorStop(1, color + '00');
        ctx.fillStyle = spotGradient;
        ctx.fillRect(0, 0, size, size);
    }
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * size, Math.random() * size);
        ctx.bezierCurveTo(Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size);
        ctx.strokeStyle = 'rgba(180, 120, 200, ' + (0.12 + Math.random() * 0.18) + ')';
        ctx.lineWidth = 8 + Math.random() * 18;
        ctx.stroke();
    }

    if (ctx.filter !== undefined) {
        ctx.filter = 'blur(2px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
    }

    return new THREE.CanvasTexture(canvas);
}


const stormShader = {
    uniforms: {
        time: { value: 0.0 },
        baseTexture: { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform sampler2D baseTexture;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            float angle = length(uv - vec2(0.5)) * 3.0;
            float twist = sin(angle * 3.0 + time) * 0.1;
            uv.x += twist * sin(time * 0.5);
            uv.y += twist * cos(time * 0.5);
            vec4 texColor = texture2D(baseTexture, uv);
            float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;
            texColor.rgb += noise * vec3(0.8, 0.4, 0.2);
            gl_FragColor = texColor;
        }
    `
};

const planetRadius = 10;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 48, 48);
const planetTexture = createPlanetTexture();
const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0.0 },
        baseTexture: { value: planetTexture }
    },
    vertexShader: stormShader.vertexShader,
    fragmentShader: stormShader.fragmentShader
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
scene.add(planet);

const ringTexts = [
    'I love u <3',
    ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.ringTexts ? window.dataLove2Loveloom.data.ringTexts : [])
];

function createTextRings() {
    const numRings = ringTexts.length;
    // Đẩy các vòng chữ ra xa hành tinh thêm một chút
    const baseRingRadius = planetRadius * 1.35; // trước đây 1.1
    const ringSpacing = 6; // trước đây 5
    window.textRings = [];

    for (let i = 0; i < numRings; i++) {
        const text = ringTexts[i % ringTexts.length] + '   ';
        const ringRadius = baseRingRadius + i * ringSpacing;

        function getCharType(char) {
            const charCode = char.charCodeAt(0);
            if ((charCode >= 0x4E00 && charCode <= 0x9FFF) ||
                (charCode >= 0x3040 && charCode <= 0x309F) ||
                (charCode >= 0x30A0 && charCode <= 0x30FF) ||
                (charCode >= 0xAC00 && charCode <= 0xD7AF)) {
                return 'cjk';
            } else if (charCode >= 0 && charCode <= 0x7F) {
                return 'latin';
            }
            return 'other';
        }

        let charCounts = { cjk: 0, latin: 0, other: 0 };
        for (let char of text) {
            charCounts[getCharType(char)]++;
        }

        const totalChars = text.length;
        const cjkRatio = charCounts.cjk / totalChars;

        let scaleParams = { fontScale: 0.75, spacingScale: 1.1 };

        if (i === 0) {
            scaleParams.fontScale = 0.55;
            scaleParams.spacingScale = 0.9;
        } else if (i === 1) {
            scaleParams.fontScale = 0.65;
            scaleParams.spacingScale = 1.0;
        }

        if (cjkRatio > 0) {
            scaleParams.fontScale *= 0.9;
            scaleParams.spacingScale *= 1.1;
        }

        const textureHeight = 200;
        const fontSize = Math.max(120, 0.9 * textureHeight);
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `bold ${fontSize}px Arial, sans-serif`;
        let singleText = ringTexts[i % ringTexts.length];
        const separator = '   ';
        let repeatedTextSegment = singleText + separator;

        let segmentWidth = tempCtx.measureText(repeatedTextSegment).width;
        let textureWidthCircumference = 2 * Math.PI * ringRadius * 180;
        let repeatCount = Math.ceil(textureWidthCircumference / segmentWidth);

        let fullText = '';
        for (let j = 0; j < repeatCount; j++) {
            fullText += repeatedTextSegment;
        }

        let finalTextureWidth = segmentWidth * repeatCount;
        if (finalTextureWidth < 1 || !fullText) {
            fullText = repeatedTextSegment;
            finalTextureWidth = segmentWidth;
        }

        const textCanvas = document.createElement('canvas');
        textCanvas.width = Math.ceil(Math.max(1, finalTextureWidth));
        textCanvas.height = textureHeight;
        const ctx = textCanvas.getContext('2d');

        ctx.clearRect(0, 0, textCanvas.width, textureHeight);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        ctx.shadowColor = '#e0b3ff';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(fullText, 0, textureHeight * 0.8);

        ctx.shadowColor = '#ffb3de';
        ctx.shadowBlur = 16;
        ctx.fillText(fullText, 0, textureHeight * 0.8);

        const ringTexture = new THREE.CanvasTexture(textCanvas);
        ringTexture.wrapS = THREE.RepeatWrapping;
        ringTexture.repeat.x = finalTextureWidth / textureWidthCircumference;
        ringTexture.needsUpdate = true;

        const ringGeometry = new THREE.CylinderGeometry(ringRadius, ringRadius, 1, 128, 1, true);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: ringTexture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.01
        });

        const textRingMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        textRingMesh.position.set(0, 0, 0);
        textRingMesh.rotation.y = Math.PI / 2;

        const ringGroup = new THREE.Group();
        ringGroup.add(textRingMesh);
        ringGroup.userData = {
            ringRadius: ringRadius,
            angleOffset: 0.15 * Math.PI * 0.5,
            speed: 0.007,
            tiltSpeed: 0, rollSpeed: 0, pitchSpeed: 0,
            tiltAmplitude: Math.PI / 3, rollAmplitude: Math.PI / 6, pitchAmplitude: Math.PI / 8,
            tiltPhase: Math.PI * 2, rollPhase: Math.PI * 2, pitchPhase: Math.PI * 2,
            isTextRing: true
        };

        const initialRotationX = i / numRings * (Math.PI / 1);
        ringGroup.rotation.x = initialRotationX;
        scene.add(ringGroup);
        window.textRings.push(ringGroup);
    }
}

createTextRings();

function updateTextRingsRotation() {
    if (!window.textRings || !camera) return;

    window.textRings.forEach((ringGroup, index) => {
        ringGroup.children.forEach(child => {
            if (child.userData.initialAngle !== undefined) {
                const angle = child.userData.initialAngle + ringGroup.userData.angleOffset;
                const x = Math.cos(angle) * child.userData.ringRadius;
                const z = Math.sin(angle) * child.userData.ringRadius;
                child.position.set(x, 0, z);

                const worldPos = new THREE.Vector3();
                child.getWorldPosition(worldPos);

                const lookAtVector = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
                const rotationY = Math.atan2(lookAtVector.x, lookAtVector.z);
                child.rotation.y = rotationY;
            }
        });
    });
}

function animatePlanetSystem() {
    if (window.textRings) {
        const time = Date.now() * 0.001;
        window.textRings.forEach((ringGroup, index) => {
            const userData = ringGroup.userData;
            userData.angleOffset += userData.speed;

            const tilt = Math.sin(time * userData.tiltSpeed + userData.tiltPhase) * userData.tiltAmplitude;
            const roll = Math.cos(time * userData.rollSpeed + userData.rollPhase) * userData.rollAmplitude;
            const pitch = Math.sin(time * userData.pitchSpeed + userData.pitchPhase) * userData.pitchAmplitude;

            ringGroup.rotation.x = (index / window.textRings.length) * (Math.PI / 1) + tilt;
            ringGroup.rotation.z = roll;
            ringGroup.rotation.y = userData.angleOffset + pitch;

            const verticalBob = Math.sin(time * (userData.tiltSpeed * 0.7) + userData.tiltPhase) * 0.3;
            ringGroup.position.y = verticalBob;

            const pulse = (Math.sin(time * 1.5 + index) + 1) / 2; 
            const textMesh = ringGroup.children[0];
            if (textMesh && textMesh.material) {
                textMesh.material.opacity = 0.7 + pulse * 0.3;
            }
        });
        updateTextRingsRotation();
    }
}


let fadeOpacity = 0.1;
let fadeInProgress = false;

let hintIcon;
let hintText;

function createHintIcon() {
    hintIcon = new THREE.Group();
    hintIcon.name = 'hint-icon-group';
    scene.add(hintIcon);

    const cursorVisuals = new THREE.Group();
    const cursorShape = new THREE.Shape();
    const h = 1.5;
    const w = h * 0.5;

    cursorShape.moveTo(0, 0);
    cursorShape.lineTo(-w * 0.4, -h * 0.7);
    cursorShape.lineTo(-w * 0.25, -h * 0.7);
    cursorShape.lineTo(-w * 0.5, -h);
    cursorShape.lineTo(w * 0.5, -h);
    cursorShape.lineTo(w * 0.25, -h * 0.7);
    cursorShape.lineTo(w * 0.4, -h * 0.7);
    cursorShape.closePath();

    const backgroundGeometry = new THREE.ShapeGeometry(cursorShape);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    const foregroundGeometry = new THREE.ShapeGeometry(cursorShape);
    const foregroundMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
    });
    const foregroundMesh = new THREE.Mesh(foregroundGeometry, foregroundMaterial);

    foregroundMesh.scale.set(0.8, 0.8, 1);
    foregroundMesh.position.z = 0.01;

    cursorVisuals.add(backgroundMesh, foregroundMesh);
    cursorVisuals.position.y = h / 2;
    cursorVisuals.rotation.x = Math.PI / 2;

    const ringGeometry = new THREE.RingGeometry(1.8, 2.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    hintIcon.userData.ringMesh = ringMesh;
    hintIcon.add(cursorVisuals);
    hintIcon.add(ringMesh);

    hintIcon.position.set(1.5, 1.5, 15);

    hintIcon.scale.set(0.8, 0.8, 0.8);
    hintIcon.lookAt(planet.position);
    hintIcon.userData.initialPosition = hintIcon.position.clone();
}

/**
 * Animate icon gợi ý.
 * @param {number} time
 */
function animateHintIcon(time) {
    if (!hintIcon) return;

    if (!introStarted) {
        hintIcon.visible = true;

        const tapFrequency = 2.5;
        const tapAmplitude = 1.5;
        const tapOffset = Math.sin(time * tapFrequency) * tapAmplitude;
        const direction = new THREE.Vector3();
        hintIcon.getWorldDirection(direction);
        hintIcon.position.copy(hintIcon.userData.initialPosition).addScaledVector(direction, -tapOffset);
        const ring = hintIcon.userData.ringMesh;
        const ringScale = 1 + Math.sin(time * tapFrequency) * 0.1;
        ring.scale.set(ringScale, ringScale, 1);
        ring.material.opacity = 0.5 + Math.sin(time * tapFrequency) * 0.2;
        if (hintText) {
            hintText.visible = true;
            hintText.material.opacity = 0.7 + Math.sin(time * 3) * 0.3;
            hintText.position.y = 15 + Math.sin(time * 2) * 0.5;
            hintText.lookAt(camera.position);
        }
    } else {
        if (hintIcon) hintIcon.visible = false;

        if (hintText) hintText.visible = false;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;

    controls.update();
    planet.material.uniforms.time.value = time * 0.5;

    if (fadeInProgress && fadeOpacity < 1) {
        fadeOpacity += 0.025;
        if (fadeOpacity > 1) fadeOpacity = 1;
    }

    if (!introStarted) {
        fadeOpacity = 0.1;
        scene.traverse(obj => {
            if (obj.name === 'starfield') {
                if (obj.points && obj.material.opacity !== undefined) {
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                }
                return;
            }
            if (obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing)) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                }
                if (obj.material && obj.material.color) {
                    obj.material.color.set(0xffffff);
                }
            } else if (obj !== planet && obj !== centralGlow && obj !== hintIcon && obj.type !== 'Scene' && !obj.parent.isGroup) {
                 if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity = 0.1;
                }
            }
        });
        planet.visible = true;
        centralGlow.visible = true;
    } else {
        scene.traverse(obj => {
            if (!(obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing) || obj === planet || obj === centralGlow || obj.type === 'Scene')) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity = fadeOpacity;
                }
            } else {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.opacity = 1;
                    obj.material.transparent = false;
                }
            }
            if (obj.material && obj.material.color) {
                obj.material.color.set(0xffffff);
            }
        });
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.userData.life++;

        let opacity = 1.0;
        if (star.userData.life < 30) {
            opacity = star.userData.life / 30;
        } else if (star.userData.life > star.userData.maxLife - 30) {
            opacity = (star.userData.maxLife - star.userData.life) / 30;
        }

        star.userData.progress += star.userData.speed;
        if (star.userData.progress > 1) {
            if (star.userData.trailMesh) {
                if (star.userData.trailMesh.geometry) star.userData.trailMesh.geometry.dispose();
                if (star.userData.trailMesh.material) {
                    if (star.userData.trailMesh.material.map) star.userData.trailMesh.material.map.dispose();
                    star.userData.trailMesh.material.dispose();
                }
            }
            if (star.userData.head) {
                if (star.userData.head.material && star.userData.head.material.map) star.userData.head.material.map.dispose();
                if (star.userData.head.material) star.userData.head.material.dispose();
            }
            if (star.userData.halo) {
                if (star.userData.halo.material && star.userData.halo.material.map) star.userData.halo.material.map.dispose();
                if (star.userData.halo.material) star.userData.halo.material.dispose();
            }
            scene.remove(star);
            shootingStars.splice(i, 1);
            continue;
        }

        const currentPos = star.userData.curve.getPoint(star.userData.progress);
        star.userData.head.position.copy(currentPos);
        const pulse = 0.85 + 0.15 * Math.sin(time * 5.0 + i);
        if (star.userData.head.material) star.userData.head.material.opacity = opacity * 0.95;
        if (star.userData.halo && star.userData.halo.material) star.userData.halo.material.opacity = opacity * 0.75 * pulse;
        const trailPoints = star.userData.trailPoints;
        trailPoints[0].copy(currentPos);
        for (let j = 1; j < star.userData.trailLength; j++) {
            const trailProgress = Math.max(0, star.userData.progress - j * 0.01);
            trailPoints[j].copy(star.userData.curve.getPoint(trailProgress));
        }
        const newCurve = new THREE.CatmullRomCurve3(trailPoints);
        const newGeo = new THREE.TubeGeometry(newCurve, star.userData.trailLength * 2, star.userData.tubeRadius, 8, false);
        if (star.userData.trailMesh && star.userData.trailMesh.geometry) star.userData.trailMesh.geometry.dispose();
        star.userData.trailMesh.geometry = newGeo;
        if (star.userData.trailMesh.material) star.userData.trailMesh.material.opacity = opacity * 0.9;
    }

    if (shootingStars.length < 3 && Math.random() < 0.02) {
        createShootingStar();
    }

    scene.traverse(obj => {
        if (obj.isPoints && obj.userData.materialNear && obj.userData.materialFar) {
            const positionAttr = obj.geometry.getAttribute('position');
            let isClose = false;
            for (let i = 0; i < positionAttr.count; i++) {
                const worldX = positionAttr.getX(i) + obj.position.x;
                const worldY = positionAttr.getY(i) + obj.position.y;
                const worldZ = positionAttr.getZ(i) + obj.position.z;
                const distance = camera.position.distanceTo(new THREE.Vector3(worldX, worldY, worldZ));
                if (distance < 10) {
                    isClose = true;
                    break;
                }
            }
            if (isClose) {
                if (obj.material !== obj.userData.materialNear) {
                    obj.material = obj.userData.materialNear;
                    obj.geometry = obj.userData.geometryNear;
                }
            } else {
                if (obj.material !== obj.userData.materialFar) {
                    obj.material = obj.userData.materialFar;
                    obj.geometry = obj.userData.geometryFar;
                }
            }
        }
    });

    planet.lookAt(camera.position);
    animatePlanetSystem();

    if (starField && starField.material && starField.material.opacity !== undefined) {
        starField.material.opacity = 1.0;
        starField.material.transparent = false;
    }

    renderer.render(scene, camera);
}
function createHintText() {
    const canvasSize = 512; 
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = canvasSize;
    const context = canvas.getContext('2d');
    const fontSize = 50; 
    const text = window.dataLove2Loveloom?.messages?.click_to_open || 'Chạm vào tinh cầu';
    context.font = `bold ${fontSize}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = '#ffb3de';
    context.shadowBlur = 5;
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(255, 200, 220, 0.8)'; 
    context.strokeText(text, canvasSize / 2, canvasSize / 2);
    context.shadowColor = '#e0b3ff';
    context.shadowBlur = 5;
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(220, 180, 255, 0.5)'; 
    context.strokeText(text, canvasSize / 2, canvasSize / 2);
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.fillStyle = 'white';
    context.fillText(text, canvasSize / 2, canvasSize / 2);
    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.needsUpdate = true;
    const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const planeGeometry = new THREE.PlaneGeometry(16, 8); 
    hintText = new THREE.Mesh(planeGeometry, textMaterial);
    hintText.position.set(0, 15, 0);
    scene.add(hintText);
}

createShootingStar();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.target.set(0, 0, 0);
    controls.update();
});

function startCameraAnimation() {
    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const midPos1 = { x: startPos.x, y: 0, z: startPos.z };
    const midPos2 = { x: startPos.x, y: 0, z: 160 };
    const endPos = { x: -40, y: 100, z: 100 };

    const duration1 = 0.2;
    const duration2 = 0.55;
    const duration3 = 0.4;
    let progress = 0;

    function animatePath() {
        progress += 0.001010;
        let newPos;

        if (progress < duration1) {
            let t = progress / duration1;
            newPos = {
                x: startPos.x + (midPos1.x - startPos.x) * t,
                y: startPos.y + (midPos1.y - startPos.y) * t,
                z: startPos.z + (midPos1.z - startPos.z) * t,
            };
        } else if (progress < duration1 + duration2) {
            let t = (progress - duration1) / duration2;
            newPos = {
                x: midPos1.x + (midPos2.x - midPos1.x) * t,
                y: midPos1.y + (midPos2.y - midPos1.y) * t,
                z: midPos1.z + (midPos2.z - midPos1.z) * t,
            };
        } else if (progress < duration1 + duration2 + duration3) {
            let t = (progress - duration1 - duration2) / duration3;
            let easedT = 0.5 - 0.5 * Math.cos(Math.PI * t);
            newPos = {
                x: midPos2.x + (endPos.x - midPos2.x) * easedT,
                y: midPos2.y + (endPos.y - midPos2.y) * easedT,
                z: midPos2.z + (endPos.z - midPos2.z) * easedT,
            };
        } else {
            camera.position.set(endPos.x, endPos.y, endPos.z);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            controls.enabled = true;
            return;
        }

        camera.position.set(newPos.x, newPos.y, newPos.z);
        camera.lookAt(0, 0, 0);
        requestAnimationFrame(animatePath);
    }
    controls.enabled = false;
    animatePath();
}


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let introStarted = false;

const originalStarCount = starGeometry.getAttribute('position').count;
if (starField && starField.geometry) {
    starField.geometry.setDrawRange(0, Math.floor(originalStarCount * 0.1));
}

function requestFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}
function onCanvasClick(event) {
    if (introStarted) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(planet);

    if (intersects.length > 0) {

        requestFullScreen();
        introStarted = true;
        fadeInProgress = true;
        document.body.classList.add('intro-started');
        startCameraAnimation();
        if (starField && starField.geometry) {
            starField.geometry.setDrawRange(0, originalStarCount);
        }
    } else if (introStarted) {
        const heartIntersects = raycaster.intersectObjects(heartPointClouds);
        if (heartIntersects.length > 0) {
            const targetObject = heartIntersects[0].object;
            controls.target.copy(targetObject.position);
        }
    }
}

renderer.domElement.addEventListener('click', onCanvasClick);

animate();

planet.name = 'main-planet';
centralGlow.name = 'main-glow';

// ---- CÁC THIẾT LẬP CHO GIAO DIỆN VÀ MOBILE ----
function setFullScreen() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    const container = document.getElementById('container');
    if (container) {
        container.style.height = `${window.innerHeight}px`;
    }
}

window.addEventListener('resize', setFullScreen);
window.addEventListener('orientationchange', () => {
    setTimeout(setFullScreen, 300);
});
setFullScreen();

const preventDefault = event => event.preventDefault();
document.addEventListener('touchmove', preventDefault, { passive: false });
document.addEventListener('gesturestart', preventDefault, { passive: false });

const container = document.getElementById('container');
if (container) {
    container.addEventListener('touchmove', preventDefault, { passive: false });
}

function checkOrientation() {

    const isMobilePortrait = window.innerHeight > window.innerWidth && 'ontouchstart' in window;

    if (isMobilePortrait) {
        document.body.classList.add('portrait-mode');
    } else {
        document.body.classList.remove('portrait-mode');
    }
}
window.addEventListener('DOMContentLoaded', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
    setTimeout(checkOrientation, 200); 
});