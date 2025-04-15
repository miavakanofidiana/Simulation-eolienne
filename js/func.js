function setVisibility(isVisible, ...objects) {
    objects.forEach(object => {
        object.visible = isVisible;
    });
}

function setVisibilityOld(isVisible, ...objects) {
    objects.forEach(object => {
        if (isVisible) {
            scene.add(object);
        } else {
            scene.remove(object);
        }
    });
}

function getCharGeometry(char, size) {
    // Crée l'entrée si elle n'existe pas
    if (!geometryCache[char]) geometryCache[char] = {};
    
    // Génère la géométrie si nécessaire
    if (!geometryCache[char][size]) {
        const geom = new THREE.TextGeometry(char, {
            size: size,
            font: TimesFont,
            height: 0.2,
        depth: 0.1,
        curveSegments: 32,
        bevelEnabled: false,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 1,
        });
        
        geom.computeBoundingBox();
        const scaleFactor = 1;
        let width;
        if (char == ' ') {
            width = size*SPACE_RATIO;
        } else {
            width = geom.boundingBox ? geom.boundingBox.max.x - geom.boundingBox.min.x : size * 0.5;
        }
        /* if (char !== ' ' && geom.vertices.length == 0) {
            console.warn(`Empty geomtry for : ${char}`);
        } */
        geometryCache[char][size] = {
            geometry: geom,
            width: width
        };
    }
    
    return geometryCache[char][size];
}

// 3. Fonction de création de texte optimisé
function createOptimizedText(text, material, baseSize = 2) {
    const textGroup = new THREE.Group();
    let cursor = 0;

    for (const char of text) {
        if (!availableChars.includes(char)) continue;

        // Récupère la géométrie avec la taille désirée
        const { geometry, width } = getCharGeometry(char, baseSize);
        
        const charMesh = new THREE.Mesh(geometry, material);
        charMesh.position.x = cursor;
        textGroup.add(charMesh);

        if (char == 1 || char == "." || char == ",") {
            cursor += width * 1.95; // Espacement +95%
        } else {
            cursor += width * 1.10; // Espacement +10%
        }
    }

    return textGroup;
}

function createMixedSizeText(textParts, material) {
    const group = new THREE.Group();
    let currentX = 0;

    for (const part of textParts) {
        const textMesh = createText(part.text, material, part.size);
        textMesh.position.x = currentX;
        group.add(textMesh);
        
        // Met à jour la position pour le prochain élément
        textMesh.traverse((child) => {
            if (child.isMesh) {
                currentX += child.geometry.boundingBox.max.x;
            }
        });
    }

    return group;
}

/*
// Exemple d'utilisation :
const textParts = [
    { text: "Grand ", size: 24 },
    { text: "moyen ", size: 18 },
    { text: "petit", size: 12 }
];

const mixedText = createMixedSizeText(textParts, material);
scene.add(mixedText);*/

function preloadSizes(sizes) {
    for (const char of availableChars) {
        for (const size of sizes) {
            getCharGeometry(char, size);
        }
    }
}


function createText(text, size=2, color='black', mScene = scene) {
    
    // Create a standard material with 50% gloss
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.1
    });
    
    // Geometries are attached to meshes so that they get rendered
    const textMesh = createOptimizedText(text, material, size);
    // Update positioning of the text
   
    mScene.add(textMesh);
    return textMesh;
}


function createTextMesh(text, size=2, color='black') {
    
    // Create a standard material with 50% gloss
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.1
    });
    
    // Geometries are attached to meshes so that they get rendered
    const textMesh = createOptimizedText(text, material, size);
    // Update positioning of the text
    return textMesh;
}

function createTextOLD(text, size=2, color='black', font= TimesFont,) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: size,
        depth: 0.1,
        curveSegments: 32,
        bevelEnabled: false,
        bevelThickness: 0.1,
        bevelSize: 0.5,
        bevelSegments: 1,
    });
    
    // Create a standard material with 50% gloss
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.1
    });
    
    // Geometries are attached to meshes so that they get rendered
    const textMesh = new THREE.Mesh(textGeometry, material);
    // Update positioning of the text
   
    scene.add(textMesh);
    return textMesh;
}

function createTextGeometry(text, size=2, color='black', font= TimesFont,) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: size,
        depth: 0.1,
        curveSegments: 32,
        bevelEnabled: false,
        bevelThickness: 0.1,
        bevelSize: 0.5,
        bevelSegments: 1,
    });
    return textGeometry;
}

function addTextPuissance() {
    pth0 = createText('Puissance théorique', 2, "lime")
    pth0.position.set(-20, -6, 3);
    pth=createText('TH', 1, pth_color);
    pth.position.set(-19, -10.5, 3);
    pth1 = createText('P  =', 2, pth_color)
    pth1.position.set(-20, -10, 3);
    pmr0 = createText('Puissance maximale récupérable', 2, pMaxColor);
    pmr0.position.set(-20, -16, 3);
    pmax=createText('MAX', 1, pMaxColor);
    pmax.position.set(-19, -20.5, 3);
    pmr1 = createText('P    =', 2, pMaxColor)
    pmr1.position.set(-20, -20, 3);

    // Create the text geometry

    const pthGroundGeometry = new THREE.PlaneGeometry(30, 10);
    const pthGroundMaterial = new THREE.MeshBasicMaterial({ color: 0x0F0103 });
    const pthGround = new THREE.Mesh(pthGroundGeometry, pthGroundMaterial);
    pthGround.position.set(-9, -8, 2);
    scene.add(pthGround);
}

function initBlades() {
    blades = new THREE.Group();
    // Create and position the three blades
    for (let i = 0; i < 3; i++) {
        //const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        const blade = createBlade(bladeLengthSimul, 5);
        blade.rotation.z = (2 * Math.PI / 3) * i; // Rotate each blade by 120 degrees
        blade.userData.tooltipText = palesTooltipText;
        blades.add(blade);
    }

    // Position the blades at the desired location
    blades.position.set(1.7, towerSize, 0); // Adjust as needed
    blades.rotation.y = (Math.PI/2);
    blades.userData.tooltipText = palesTooltipText;
    scene.add(blades);

    // Création de la géométrie du cylindre
    const bladesCylinderGeometry = new THREE.CylinderGeometry(bladeLengthSimul, bladeLengthSimul, 7, 32); // 32 segments pour une forme lisse

    // Création d'un matériau semi-transparent pour le cylindre
    const bladesCylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff, transparent: true, opacity: 0.05 });

    // Création d'un maillage à partir de la géométrie et du matériau
    bladesCylinder = new THREE.Mesh(bladesCylinderGeometry, bladesCylinderMaterial);

    bladesCylinder.rotation.z = Math.PI / 2;

    // Positionnement du cylindre
    bladesCylinder.position.set(0, towerSize, 2);

    // Ajout du disque à la scène
    scene.add(bladesCylinder);
    
    blades0 = new THREE.Group();

    // Create and position the three blades
    for (let i = 0; i < 3; i++) {
        //const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        const blade = createBlade(bladeLengthSimul, 10);
        blade.rotation.z = (2 * Math.PI / 3) * i; // Rotate each blade by 120 degrees
        blade.userData.tooltipText = palesTooltipText;
        blades0.add(blade);
    }

    // Position the blades at the desired location
    blades0.position.set(-30, towerSize, 4); // Adjust as needed
    blades0.userData.tooltipText = palesTooltipText;

    // Add blades to the scene
    scene.add(blades0);

    if (disk) {
        scene.remove(disk)
    }

    // Création de la géométrie du disque
    const diskGeometry = new THREE.CircleGeometry(bladeLengthSimul, 32); // 32 segments pour une forme lisse

    // Création d'un matériau semi-transparent pour le disque
    const diskMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.02 });

    // Création d'un maillage à partir de la géométrie et du matériau
    disk = new THREE.Mesh(diskGeometry, diskMaterial);

    // Positionnement du disque
    disk.position.set(-30, towerSize, 3);
    createText("Surface balayée", 1, "darkblue").position.set(-34, towerSize+3, 3);

    disk.userData.tooltipText = "Surface balayée par les pales<br><b>S="+S.toFixed(0)+"m<sup>2</sup></b>";

    // Ajout du disque à la scène
    scene.add(disk);
}

function initEnergyText() {
    Ecin = createText("E. cinétique", 1.5, "green");
        Ecin.position.set(-15, towerSize, 2);
        scene.add(Ecin);
            Emec = createText("E. mécanique", 1.5, "green");
            Emec.position.set(2, towerSize+2, 2);
            scene.add(Emec);
                Eelec = createText("E. électrique", 1.5, "green");
                Eelec.position.set(7, towerSize/2-3, 2);
                scene.add(Eelec);
}

function initTextRotation() {
    pales_text = createText("(rotation "+nombre_tour_par_minute_pales.toFixed(1).replace(".", ",")+" tours/min)", 1.5);
    pales_text.position.set(leg_x+19, leg_y-2, leg_z);

    multip_text = createText("(rotation "+nombre_tour_par_minute_multip.toFixed(1).replace(".", ",")+" tours/min)", 1.5);
    multip_text.position.set(leg_x+19, leg_y-2-leg_dist*2, leg_z);
}

function createBlade(length, segments) {
    var points = [];

    // Définir le profil aérodynamique d'une pale
    points.push(new THREE.Vector2(0, 0));  // Base de la pale (près du moyeu)
    points.push(new THREE.Vector2(0.2, 0));  // Base plus large
    points.push(new THREE.Vector2(length/40, length * 0.1));  // Commence à s'étendre
    points.push(new THREE.Vector2(length/20, length * 0.5));  // Partie la plus large
    points.push(new THREE.Vector2(0.10, length));  // Pointe effilée

    // Génération de la géométrie en tournant le profil défini
    var bladeGeometry = new THREE.LatheGeometry(points, segments);
    var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);

    // Inclinaison pour simuler la courbure des pales
    //blade.rotation.y = Math.PI;

    return blade;
}

function createBladeGeometry(length, segments) {
    var points = [];

    // Définir le profil aérodynamique d'une pale
    points.push(new THREE.Vector2(0, 0));  // Base de la pale (près du moyeu)
    points.push(new THREE.Vector2(0.2, 0));  // Base plus large
    points.push(new THREE.Vector2(length/40, length * 0.1));  // Commence à s'étendre
    points.push(new THREE.Vector2(length/20, length * 0.5));  // Partie la plus large
    points.push(new THREE.Vector2(0.10, length));  // Pointe effilée

    // Génération de la géométrie en tournant le profil défini
    var bladeGeometry = new THREE.LatheGeometry(points, segments);

    return bladeGeometry;
}

function removeGroupFromScene(group, scene) {
    scene.remove(group);
    group.traverse((child)=> {
        if (child.isMesh) {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
}

// Fonction pour créer un cylindre pour les pylônes
function createPylon(x, y, z) {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 32); // Pylône plus large et plus haut
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const pylon = new THREE.Mesh(geometry, material);
    pylon.position.set(x, y, z);
    pylon.userData.tooltipText = pylonTooltipText;
    scene.add(pylon);
    return pylon;
}

function createSupport(x, y, z) {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 32);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const support = new THREE.Mesh(geometry, material);
    support.position.set(x, y, z);
    support.rotation.x = Math.PI / 2;
    scene.add(support);
    return support;
}

// Fonction pour créer des câbles
function createCable(start, end) {
    const cableMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const points = [];
    points.push(start);
    points.push(end);
    const cableGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const cable = new THREE.Line(cableGeometry, cableMaterial);
    cable.userData.tooltipText = "<br>Câble électrique";
    scene.add(cable);

    return cable;
}

// Fonction pour créer la géométrie d'un engrenage avec des dents
function createGear(innerRadius, outerRadius, teethCount, toothHeight, gearThickness) {
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 2 / teethCount;

    for (let i = 0; i < teethCount; i++) {
        const angle = i * angleStep;
        const nextAngle = (i + 1) * angleStep;

        // Points internes
        const xInner1 = innerRadius * Math.cos(angle);
        const yInner1 = innerRadius * Math.sin(angle);
        const xInner2 = innerRadius * Math.cos(nextAngle);
        const yInner2 = innerRadius * Math.sin(nextAngle);

        // Points externes (dents)
        const xOuter1 = outerRadius * Math.cos(angle + angleStep / 3);
        const yOuter1 = outerRadius * Math.sin(angle + angleStep / 3);
        const xOuter2 = outerRadius * Math.cos(angle + 2 * angleStep / 3);
        const yOuter2 = outerRadius * Math.sin(angle + 2 * angleStep / 3);

        shape.lineTo(xInner1, yInner1);
        shape.lineTo(xOuter1, yOuter1);
        shape.lineTo(xOuter2, yOuter2);
        shape.lineTo(xInner2, yInner2);
    }

    // Extrusion pour l'épaisseur de l'engrenage
    const extrudeSettings = {
        steps: 2,
        depth: gearThickness,
        bevelEnabled: false,
    };
    
    const gearGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    return gearGeometry;
}

// Ajouter des isolateurs rouges
function createInsulator(x, y, z) {
    const insulatorGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.7, 32);
    const insulatorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ffba });
    const insulator = new THREE.Mesh(insulatorGeometry, insulatorMaterial);
    insulator.position.set(x, y, z);
    insulator.userData.tooltipText = "Isolateur";
    scene.add(insulator);
    return insulator;
}

function showError(message) {
    const errorDiv = document.getElementById('error-msg');
    errorDiv.style.display = 'block';
    errorDiv.innerHTML = message + '<button onclick="window.location.reload()">Réessayer</button>';
}

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function createVillage(
    numberOfHouses = 10,
    villagePosition = new THREE.Vector3(0, 0, 0),
    houseSize = 0.5, roofColor=0xff0000 // Nouveau paramètre de taille (0.5 = 50% de la taille originale)
) {
    const village = new THREE.Group();
    village.position.copy(villagePosition);

    // Matériaux
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor });

    // Création des maisons
    for(let i = 0; i < numberOfHouses; i++) {
        const house = new THREE.Group();
        
        // Structure principale (taille réduite)
        const geometry = new THREE.BoxGeometry(
            4 * houseSize, 
            3 * houseSize, 
            4 * houseSize
        );
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.y = 1.5 * houseSize; // Ajustement de la position verticale
        house.add(mesh);

        // Toit pyramidal (taille réduite)
        const roofGeometry = new THREE.ConeGeometry(
            3.2 * houseSize, // Rayon réduit
            2 * houseSize,   // Hauteur réduite
            4
        );
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 4 * houseSize; // Position ajustée selon la taille
        house.add(roof);

        // Position aléatoire (rayon réduit en fonction de la taille)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 * houseSize; // Rayon de placement réduit
        
        house.position.x = Math.cos(angle) * radius;
        house.position.z = Math.sin(angle) * radius;
        house.position.y = 0;

        // Rotation aléatoire
        house.rotation.y = Math.random() * Math.PI * 2;

        village.add(house);
    }

    return village;
}

// Températures de référence
const minTemp = -10;  // Froid extrême (bleu nuit)
const maxTemp = 45;   // Chaleur extrême (rougeoyant)

function updateSkyColor(temperature, scene) {
    // Clamper et normaliser la température
    const clamped = THREE.MathUtils.clamp(temperature, minTemp, maxTemp);
    const t = (clamped - minTemp) / (maxTemp - minTemp);

    // Couleurs de base réalistes
    const coldColor = new THREE.Color(0x1a237e);    // Bleu nuit profond
    const coolColor = new THREE.Color(0x87CEEB);    // Bleu ciel clair
    const warmColor = new THREE.Color(0xFFA500);     // Orange chaud
    const hotColor = new THREE.Color(0x8B0000);      // Rouge intense

    // Interpolation en 3 phases
    let color;
    if(t < 0.4) {
        // Phase froide : bleu nuit → bleu ciel
        color = coldColor.clone().lerp(coolColor, t * 2.5);
    } 
    else if(t < 0.7) {
        // Phase tempérée : bleu ciel → blanc (pas de vert)
        const phaseT = (t - 0.4) / 0.3;
        color = new THREE.Color().lerpColors(
            coolColor, 
            new THREE.Color(0xF0F8FF), // Bleu très clair
            phaseT
        );
    }
    else {
        // Phase chaude : blanc → orange → rouge
        const phaseT = (t - 0.7) / 0.3;
        color = new THREE.Color().lerpColors(
            new THREE.Color(0xF0F8FF), 
            hotColor, 
            phaseT
        );
    }

    // Ajustement dynamique de la luminosité
    const lightness = THREE.MathUtils.lerp(0.15, 0.95, t); 
    color.lerp(new THREE.Color(1, 1, 1), (lightness - 0.5) * 0.3);

    // Ajout d'une teinte atmosphérique
    if(t > 0.6) {
        const dust = THREE.MathUtils.smoothstep(t, 0.6, 1);
        color.addScalar(dust * 0.1); // Effet de brume chaude
    }

    scene.background = color;
}

// Avec pré-calcul des constantes (R_specific = R/M = 287 J/(kg·K))
function airDensity(temperatureCelsius) {
    return (353.07 / (temperatureCelsius + 273.15)).toFixed(3); // en kg/m³
}

// Paramètres initiaux
const REF_DENSITY = 1.225; // kg/m³ à 15°C
const REF_PARTICLES = 3000;

function updateParticleCount(density) {
    // Calcul du ratio de particules
    const ratio = density / REF_DENSITY;
    const newCount = Math.round(REF_PARTICLES * (ratio*ratio*ratio*ratio*ratio*ratio));
    
    // Seuils de sécurité
    const MIN_PARTICLES = 500;
    const MAX_PARTICLES = 10000;
    currentParticles = THREE.MathUtils.clamp(newCount, MIN_PARTICLES, MAX_PARTICLES);
    return currentParticles;
}

function createCurve() {
    const positions = new Float32Array(maxPoints * 3);
    curveGeometry = new THREE.BufferGeometry();
    curveGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({ 
        color: 0x0000ff,
        linewidth: 999
    });
    
    curveLine = new THREE.Line(curveGeometry, material);
    // Positionnement à l'origine des axes
    // curveLine.position.set(30, graphHeight - 30, 0);
    // overlayScene.add(curveLine);

    curveLine.position.copy(graphOrigin); // Positionnement exact à l'origine
    overlayScene.add(curveLine);
}

function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function resetCurve() {
    // Réinitialisation des données de la courbe
    const positions = curveGeometry.attributes.position.array;
    positions.fill(0); // Remise à zéro du buffer
    currentIndex = 0;
    curveGeometry.setDrawRange(0, 0);
    curveGeometry.attributes.position.needsUpdate = true;
}

function createGraphAxes() {
    // Axe X (vitesse)
    const xAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(graphMargin, graphMargin, 0),
            new THREE.Vector3(graphWidth - graphMargin, graphMargin, 0)
        ]),
        new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    overlayScene.add(xAxis);

    // Axe Y (puissance)
    const yAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(graphMargin, graphMargin, 0),
            new THREE.Vector3(graphMargin, graphHeight - 30, 0)
        ]),
        new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    overlayScene.add(yAxis);

    // Labels
    const vLabel = createTextMesh("v (m/s)", 1.5, "black");
    vLabel.position.set(graphWidth - 30, 25, 0);
    vLabel.position.set(graphWidth - graphMargin - 50, graphMargin - 20, 0);
    overlayScene.add(vLabel);

    const pLabel = createTextMesh("P (kW)", 1.5, "black");
    pLabel.rotateZ(-Math.PI/2);
    pLabel.position.set(10, graphHeight/2, 0);
    pLabel.position.set(graphMargin - 20, graphHeight/2, 0);
    overlayScene.add(pLabel);
}