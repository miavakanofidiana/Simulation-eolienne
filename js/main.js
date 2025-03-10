let windSpeed = 5; // m/s
let bladeLength = 50; // m
let powerUnit = 'W';
let bladeLengthSimul = bladeLength/2;
const windSpeedHighNorm = 25; // Norme supérieure de la vitesse du vent en m/s
const windSpeedLowNorm = 3; // Norme inférieure de la vitesse du vent en m/s

const alertHigh = document.getElementById('alertHigh');
const alertLow = document.getElementById('alertLow');

let scene, camera, renderer, controls;

// Load the font 
const TimesFont = new THREE.Font(Times);
const availableChars  = "aàâäbcdeéèëêfghiîïjklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-()/=' \n\s";
const SPACE_RATIO = 0.35;
const TEXT_RESOLUTION = 4;
// 2. Créer le cache des géométries
const geometryCache = {};

//Legendes
const leg_x = 20;
const leg_y = 30;
const leg_z = 0;
const leg_dist = 4;
const towerSize = 25;
let activeGroundMaterial, notActiveGroundMaterial;

// Initialize particle system variables
let particleSystem, particleCount, particleCountLegend, windParticles, windParticlesSystemLegend, particlePositions, particleSpeeds;

let blades, bladesL, blades0, disk, bladesCylinder;

let particles;

let pth, pTtextMesh, power;
let pmax, pMaxTextMesh, max_power;

let pales_text, multip_text;

let Ecin, Emec, Eelec, S;

let last_nombre_tour_par_minute_pales, last_nombre_tour_par_minute_multip;

let lastBladesLength = 0;

const pth_color = 0x00FF00;
const pMaxColor = 0xFF0000;

let arbreLentActive = true, windActive = true, palesActive = true, multiplicateurActive = true, alternateurActive = true;



let bladeAngle = 0;
let shaftAngle = 0;
let gearboxAngle = 0;
let alternatorAngle = 0;
let particleSpeed = 0.1;

let vitesse_angulaire_pales, vitesse_angulaire_multip;

let multiplicateur, shaft, shaft2, alternateur, shaft3, shaft4;
let multiplicateurL, alternateurL;

let points, points2;

// Appeler avant initScene()
preloadSizes([2, 1.2, ]);

function init() {
    if (!isWebGLAvailable()) {
        showError("WEBGL n'est pas supporté sur votre appareil");
        return;
    }
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Ajouter l'événement de clic
    renderer.domElement.addEventListener('click', onMouseClick, false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);


    // MapControls for camera manipulation
    controls = new THREE.MapControls( camera, renderer.domElement );

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;
    controls.reversed = true;

    //controls.minDistance = 100;
    //controls.maxDistance = 500;

    controls.maxPolarAngle = Math.PI / 2;


    window.onresize = function (e) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    setVisibilityOld(true, light, new THREE.AmbientLight(0x404040));

    scene.background = new THREE.Color(0xB7CEEB);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(400, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    //scene.add(ground);



    //Legendes
    const legendGroundGeometry = new THREE.CircleGeometry(1, 20);
    activeGroundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22});
    notActiveGroundMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000});

    windLegende = createText("Particules d'air (vent)", 1.5);
    windLegende.position.set(leg_x+10, leg_y+leg_dist, leg_z);

    scene.add(windLegende);
    const windGround = new THREE.Mesh(legendGroundGeometry, activeGroundMaterial);
    windGround.position.set(leg_x+8, leg_y+leg_dist+0.6, leg_z);
    windGround.userData.onclick = function() {
        windActive = !windActive;
        particleSystem.visible = !particleSystem.visible;
        
        if (windActive) {
            windGround.material = activeGroundMaterial;
        } else {
            windGround.material = notActiveGroundMaterial;
        }
        updateSimulation();
    }
    scene.add(windGround);

    bladesL = new THREE.Group();

    // Create and position the three blades
    for (let i = 0; i < 3; i++) {
        //const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        const blade = createBlade(3, 5);
        blade.rotation.z = (2 * Math.PI / 3) * i; // Rotate each blade by 120 degrees
        blade.userData.tooltipText = palesTooltipText;
        bladesL.add(blade);
    }

    // Position the blades at the desired location
    bladesL.position.set(leg_x, leg_y, leg_z); // Adjust as needed
    // Add blades to the scene
    bladesL.userData.tooltipText = palesTooltipText;
    scene.add(bladesL);

    const palesGround = new THREE.Mesh(legendGroundGeometry, activeGroundMaterial);
    palesGround.position.set(leg_x+8, leg_y+0.6, leg_z);
    palesGround.userData.onclick = function() {
        palesActive = !palesActive;
        blades.visible = !blades.visible;
        if (palesActive) {
            palesGround.material = activeGroundMaterial;
        } else {
            palesGround.material = notActiveGroundMaterial;
        }
        
        updateSimulation();
    }
    scene.add(palesGround);

    palesLegende = createText("Pales", 1.5);
    palesLegende.position.set(leg_x+10, leg_y, leg_z);

    // Création de la géométrie du disque
    const diskLGeometry = new THREE.CircleGeometry(3, 32); // 32 segments pour une forme lisse
    // Création d'un matériau semi-transparent pour le disque
    const diskLMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.0 });

    // Création d'un maillage à partir de la géométrie et du matériau
    diskL = new THREE.Mesh(diskLGeometry, diskLMaterial);
    // Positionnement du disque
    diskL.position.set(leg_x, leg_y, leg_z);

    diskL.userData.tooltipText = palesTooltipText;
    // Ajout du disque à la scène
    scene.add(diskL);

    //Arbre lent
    const shaftGeometryL = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 32);
    const shaftMaterialL = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const shaftL = new THREE.Mesh(shaftGeometryL, shaftMaterialL);
    shaftL.position.set(leg_x, leg_y-leg_dist, leg_z);
    shaftL.rotation.z = Math.PI / 2;
    shaftL.userData.tooltipText = arbreLentTooltipText;
    scene.add(shaftL);
    arbreLentLegende = createText("Arbre lent", 1.5)
    arbreLentLegende.position.set(leg_x+10, leg_y-leg_dist, leg_z);
    arbreLentLegende.userData.onclick = function() {
        arbreLentActive = !arbreLentActive;
        shaft.visible = !shaft.visible;
        updateSimulation();
    }
    const arbreGround = new THREE.Mesh(legendGroundGeometry, activeGroundMaterial);
    arbreGround.position.set(leg_x+8, leg_y-leg_dist+0.6, leg_z);
    arbreGround.userData.onclick = function() {
        arbreLentActive = !arbreLentActive;
        palesGround.material.dispose();
        if (arbreLentActive) {
            arbreGround.material = activeGroundMaterial;
        } else {
            arbreGround.material = notActiveGroundMaterial;
        }
        updateSimulation();
    }
    scene.add(arbreGround);

    // Create gearbox
    multiplicateurL = new THREE.Group();
    const multiplicateurMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });


    const gearL = new THREE.Mesh(createGear(0.7, 1, 5, 0.3, 2), multiplicateurMaterial);
    gearL.rotation.y = Math.PI/2;
    gearL.userData.tooltipText = multiplicateurTooltipText;

    multiplicateurL.add(gearL);

    multiplicateurL.position.set(leg_x, leg_y-leg_dist*2, leg_z);
    multiplicateurL.userData.tooltipText = multiplicateurTooltipText;
    scene.add(multiplicateurL);
    multiplicateurLegende = createText("Multiplicateur", 1.5);
    multiplicateurLegende.position.set(leg_x+10, leg_y-leg_dist*2, leg_z);
    multiplicateurLegende.userData.onclick = function() {
        multiplicateurActive = !multiplicateurActive;
        updateSimulation();
    }
    const multiplicateurGround = new THREE.Mesh(legendGroundGeometry, activeGroundMaterial);
    multiplicateurGround.position.set(leg_x+8, leg_y-leg_dist*2+0.6, leg_z);
    multiplicateurGround.userData.onclick = function() {
        multiplicateurActive = !multiplicateurActive;
        multiplicateurGround.material.dispose();
        if (multiplicateurActive) {
            multiplicateurGround.material = activeGroundMaterial;
        } else {
            multiplicateurGround.material = notActiveGroundMaterial;
        }
        updateSimulation();
    }
    scene.add(multiplicateurGround);


    alternateurL = new THREE.Group();
    const alternatorMaterial = new THREE.MeshLambertMaterial({ color: 0xd14c32 });

    const gearALL = new THREE.Mesh(createGear(0.7, 1, 5, 0.7, 1), alternatorMaterial);
    gearALL.rotation.y = Math.PI/2;

    alternateurL.add(gearALL);
    alternateurL.position.set(leg_x-1.5, leg_y-leg_dist*3, leg_z);
    alternateurL.userData.tooltipText = alternateurTooltipText;
    scene.add(alternateurL);

    // Create shaft of alternator
    const shaft3GeometryL = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
    const shaft3L = new THREE.Mesh(shaft3GeometryL, alternatorMaterial);
    shaft3L.position.set(leg_x, leg_y-leg_dist*3, leg_z);
    shaft3L.rotation.z = Math.PI / 2;
    shaft3L.userData.tooltipText = alternateurTooltipText;
    scene.add(shaft3L);


    // Create cylinder of alternator
    const shaft4GeometryL = new THREE.CylinderGeometry(1.2, 1.2, 2, 32);
    const shaft4L = new THREE.Mesh(shaft4GeometryL, alternatorMaterial);
    shaft4L.position.set(leg_x+1, leg_y-leg_dist*3, leg_z);
    shaft4L.rotation.z = Math.PI / 2;
    scene.add(shaft4L);
    shaft4L.userData.tooltipText = alternateurTooltipText;
    alternateurLegende = createText("Alternateur", 1.5);
    alternateurLegende.position.set(leg_x+10, leg_y-leg_dist*3, leg_z);
    alternateurLegende.userData.onclick = function() {
        alternateurActive = !alternateurActive;
        updateSimulation();
    }
    const alternateurGround = new THREE.Mesh(legendGroundGeometry, activeGroundMaterial);
    alternateurGround.position.set(leg_x+8, leg_y-leg_dist*3+0.6, leg_z);
    alternateurGround.userData.onclick = function() {
        alternateurActive = !alternateurActive;
        alternateurGround.material.dispose();
        if (alternateurActive) {
            alternateurGround.material = activeGroundMaterial;
        } else {
            alternateurGround.material = notActiveGroundMaterial;
        }
        updateSimulation();
    }
    scene.add(alternateurGround);

    createText("By Miavaka", 1, '#6b7b8a').position.set(40, -20, 0);

    // Create sky background using a large sphere
    /*const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshLambertMaterial({
        color: 0xAAAAAA, // Light blue color
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);*/

    // FIN LEGENDE

    // DEBUT EOLIENNE PROFIL

    // Create turbine tower
    const towerGeometry = new THREE.CylinderGeometry(1.2, 2, towerSize+1, 120);

    const tower0Material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });

    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.userData.tooltipText = matTooltipText;
    tower.position.set(7, 10.5, 0);
    scene.add(tower);

    // Create nacelle
    const nacelleGeometry = new THREE.BoxGeometry(3, 3, 8);
    const nacelleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333});

    // Define geometry and material for the cube
    const geometry = new THREE.BoxGeometry(8, 3, 3);
    const materials = [
        new THREE.MeshLambertMaterial({ color: 0x333333 }), // Right face
        new THREE.MeshLambertMaterial({ color: 0x333333 }), // Left face
        new THREE.MeshLambertMaterial({ color: 0x333333 }), // Top face
        new THREE.MeshLambertMaterial({ color: 0x333333 }), // Bottom face
        new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0  }), // Back face
        new THREE.MeshLambertMaterial({ color: 0x333333,}) // Front face (invisible)
    ];

    // Create the cube
    const cube = new THREE.Mesh(geometry, materials);
    cube.position.set(6, towerSize, 0);
    cube.userData.tooltipText = "Nacelle";
    scene.add(cube);

    // Create turbine tower
    const tower0 = new THREE.Mesh(towerGeometry, tower0Material);
    tower0.position.set(-30, 11, 0);
    tower0.userData.tooltipText = matTooltipText;
    scene.add(tower0);

    createText("Vue de profil").position.set(-40, 0, 4);

    // FIN EOLIENNE PROFIL

    // DEBUT Echelle
    createCable(new THREE.Vector3(-45, -10, 4), new THREE.Vector3(-35, -10, 4));
    createCable(new THREE.Vector3(-45, -10, 4), new THREE.Vector3(-45, -9, 4));
    createCable(new THREE.Vector3(-40, -10, 4), new THREE.Vector3(-40, -9, 4));
    createCable(new THREE.Vector3(-35, -10, 4), new THREE.Vector3(-35, -9, 4));
    createText("Echelle", 1.5).position.set(-55, -10, 4);
    createText("0", 1.2).position.set(-45, -8, 4);
    createText("10", 1.2).position.set(-40, -8, 4);
    createText("20 m", 1.2).position.set(-35, -8, 4);
    // FIN Echelle

    // DEBUT EOLIENNE FONCTIONNEMENT

    // Create nacelle
    const nacelle0 = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle0.userData.tooltipText = "Nacelle";
    nacelle0.position.set(-30, towerSize, 0);
    nacelle0.rotation.z = Math.PI/2;
    scene.add(nacelle0);

    // Create shaft blue
    const shaftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3.9, 32);
    const shaftMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(3.5, towerSize, 0);
    shaft.rotation.z = Math.PI / 2;
    shaft.userData.tooltipText = "Arbre lent";
    scene.add(shaft);

    // Create gearbox
    multiplicateur = new THREE.Group();

    const gear = new THREE.Mesh(createGear(0.7, 1, 5, 0.3, 2), multiplicateurMaterial);
    gear.rotation.y = Math.PI/2;

    multiplicateur.add(gear);

    multiplicateur.position.set(3, towerSize, 0);
    scene.add(multiplicateur);


    // Create shaft of gearbox
    const shaft2Geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const shaft2Material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    shaft2 = new THREE.Mesh(shaft2Geometry, shaft2Material);
    shaft2.position.set(5, towerSize, 0);
    shaft2.rotation.z = Math.PI / 2;
    scene.add(shaft2);

    // Create alternator
    alternateur = new THREE.Group();

    const gearAL = new THREE.Mesh(createGear(0.7, 1, 5, 0.7, 1), alternatorMaterial);
    gearAL.rotation.y = Math.PI/2;

    alternateur.add(gearAL);
    alternateur.userData.tooltipText = "Alternateur";
    alternateur.position.set(5.5, towerSize, 0);
    scene.add(alternateur);

    // Create shaft of alternator
    const shaft3Geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    shaft3 = new THREE.Mesh(shaft3Geometry, alternatorMaterial);
    shaft3.position.set(7, towerSize, 0);
    shaft3.rotation.z = Math.PI / 2;
    shaft3.userData.tooltipText = "Alternateur";
    scene.add(shaft3);


    // Create cylinder of alternator
    const shaft4Geometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 32);
    shaft4 = new THREE.Mesh(shaft4Geometry, alternatorMaterial);
    shaft4.position.set(8, towerSize, 0);
    shaft4.rotation.z = Math.PI / 2;
    shaft4.userData.tooltipText = "Alternateur";
    scene.add(shaft4);

    // Create wires
    //const wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    points = [
        new THREE.Vector3(8, towerSize, 0),
        new THREE.Vector3(8, 10, 0)
    ];

    points2 = [
        new THREE.Vector3(6.5, -1, 0),
    ];
    /*const wireGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const wire = new THREE.Line(wireGeometry, wireMaterial);
    scene.add(wire);*/

    createCable(new THREE.Vector3(8, towerSize, 0), new THREE.Vector3(8, -1, 0));

    createCable(new THREE.Vector3(8, -1, 0), new THREE.Vector3(9, -1, 0));

    document.getElementById('cameraX').value = camera.position.x;
    camera.position.z = 55;
    camera.position.y = 0;

    addTextPuissance();

    // FIN EOLIENNE FONCTIONNEMENT

    // DEBUT TRANSFO ET DISTRIBUTION
    // Créer le transformateur
    const transformerGeometry = new THREE.BoxGeometry(4, 4, 2); // Transformer agrandi
    const transformerMaterial = new THREE.MeshLambertMaterial({ color: 0x7F8C8D });
    const transformer = new THREE.Mesh(transformerGeometry, transformerMaterial);
    transformer.position.set(11, -0.5, 0);
    transformer.userData.tooltipText = transformateurTooltipText;
    scene.add(transformer);

    // Ajouter un réservoir d'huile sur le dessus du transformateur
    const tankGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
    const tankMaterial = new THREE.MeshLambertMaterial({ color: 0x95A5A6 });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.rotation.z = Math.PI / 2;
    tank.rotation.y = Math.PI / 2;
    tank.position.set(10.5, 2.2, 0);
    tank.userData.tooltipText = transformateurTooltipText;
    scene.add(tank);
    createText("Transformateur", 1.5).position.set(9, -4, 1);

    createText("Réseau électrique", 1.5).position.set(30, -4, 1);

    const insulator1 = createInsulator(12, 1.9, -0.8);
    const insulator2 = createInsulator(12, 1.9, 0);
    const insulator3 = createInsulator(12, 1.9, 0.8);

    createCable(new THREE.Vector3(12, 1.9, -0.8), new THREE.Vector3(25, 6, -0.8));
    createCable(new THREE.Vector3(12, 1.9, 0), new THREE.Vector3(25, 6, 0));
    createCable(new THREE.Vector3(12, 1.9, 0.8), new THREE.Vector3(25, 6, 0.8));

    // Créer les pylônes du réseau électrique
    const pylon1 = createPylon(25, 2, 0);
    const pylon2 = createPylon(50, 2, 0);
    const pylon3 = createPylon(80, 2, 0);

    const support1 = createSupport(25, 6.8, 0);
    const insulator11 = createInsulator(25, 6.4, -0.8);
    const insulator12 = createInsulator(25, 6.4, 0);
    const insulator13 = createInsulator(25, 6.4, 0.8);

    const support2 = createSupport(50, 6.8, 0);
    const insulator21 = createInsulator(50, 6.4, -0.8);
    const insulator22 = createInsulator(50, 6.4, 0);
    const insulator23 = createInsulator(50, 6.4, 0.8);

    const support3 = createSupport(80, 6.8, 0);
    const insulator31 = createInsulator(80, 6.4, -0.8);
    const insulator32 = createInsulator(80, 6.4, 0);
    const insulator33 = createInsulator(80, 6.4, 0.8);

    createCable(new THREE.Vector3(25, 6, -0.8), new THREE.Vector3(90, 6, -0.8));
    createCable(new THREE.Vector3(25, 6, 0), new THREE.Vector3(90, 6, 0));
    createCable(new THREE.Vector3(25, 6, 0.8, 1.9, 0.8), new THREE.Vector3(90, 6, 0.8));

    // FIN TRANSFO ET DISTRIBUTION

    updateSimulation();
    animate(0);

    document.getElementById('splashscreen').style.display = "none"; 
}

function updateSimulation() {
    windSpeed = parseFloat(document.getElementById('windSpeed').value);
    windSpeed = windActive ? parseFloat(document.getElementById('windSpeed').value) : 0;
    bladeLength = parseFloat(document.getElementById('bladeLength').value);
    powerUnit = document.getElementById('powerUnit').value;
    bladeLengthSimul = bladeLength/2;
    r = parseFloat(document.getElementById('rendement').value);

    g = 10;
    rho = 1.225;
    S = Math.PI*Math.pow(bladeLength, 2);
    v3 = Math.pow(windSpeed, 3);
    if (windSpeed >= windSpeedLowNorm && windSpeed <= windSpeedHighNorm && (palesActive && arbreLentActive)) {
        power = (1/2)*g*rho*S*v3;
        if (powerUnit == "kW") {
            power /= 1000;
        } else if (powerUnit == "MW") {
            power /= 1000000;
        }
    } else {
        power = 0;
    }

    setVisibility(multiplicateurActive, multiplicateur, shaft2);
    setVisibility(alternateurActive, alternateur, shaft3, shaft4);

    setVisibility(arbreLentActive, shaft);

    gamma = 7; //vitesse spécifique
    w = (gamma*windSpeed*0.59)/bladeLength;

    if (!palesActive || windSpeed < windSpeedLowNorm) {
        w = 0;
    }

    vitesse_angulaire_pales = w;
    coeff = 50;
    if (!arbreLentActive) {
        coeff = 0;
    } else if (!multiplicateurActive) {
        power /= coeff;
        coeff = 1;
    }

    max_power = power*16/27;
    vitesse_angulaire_multip = w*coeff;

    nombre_tour_par_seconde_pales = w/(2*Math.PI);
    nombre_tour_par_minute_pales = nombre_tour_par_seconde_pales*60;
    nombre_tour_par_seconde_multip = vitesse_angulaire_multip/(2*Math.PI);
    nombre_tour_par_minute_multip = nombre_tour_par_seconde_multip*60;
    
    if (windSpeed > 25) {
        nombre_tour_par_minute_pales = 0;
        nombre_tour_par_minute_multip = 0;
    }

    if (vitesse_angulaire_multip > 32) {
        vitesse_angulaire_multip = 32;
    }
    
    if (!Ecin) {
        initEnergyText();
    }
    if (windSpeed > 2) {
        Ecin.visible = true;
        if (palesActive) {
            Emec.visible = true;
            if (arbreLentActive && alternateurActive ) {
                Eelec.visible = true;
            } else {
                Eelec.visible = false;
            }
        } else {
            Emec.visible = false;
            Eelec.visible = false;
        }
    } else {
        Ecin.visible = false;
        Emec.visible = false;
        Eelec.visible = false;
    }
    


    document.getElementById('bladeLengthCaption').innerHTML = "L="+bladeLength+" m";
    document.getElementById('windSpeedCaption').innerHTML = "v="+windSpeed+" m/s";
    document.getElementById('surfaceBalayee').innerHTML = "Surface balayée par les pales <b>S="+S.toFixed(0)+"m<sup>2</sup></b>";

    if (powerUnit == "W") {
        power_ = power.toFixed(0);
    } else if (powerUnit == "kW") {
        power_ = power.toFixed(3)
    } else if (powerUnit == "MW") {
        power_ = power.toFixed(3);
    }
    /* const ptTextGeometry = new TextGeometry(Number.parseFloat(power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit, {
        font: TimesFont,
        size: 2,
        depth: 0.1,
        curveSegments: 32,
        bevelEnabled: false,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 1,
    }); */

    // Create a standard material with 50% gloss
    const ptTextMaterial = new THREE.MeshStandardMaterial({
        color: pth_color,
        roughness: 0.1
    });
    if (powerUnit == "W") {
        max_power_ = max_power.toFixed(0);
    } else if (powerUnit == "kW") {
        max_power_ = max_power.toFixed(3)
    } else if (powerUnit == "MW") {
        max_power_ = max_power.toFixed(3);
    }
    
    /* const pMaxTextGeometry = new TextGeometry(Number.parseFloat(max_power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit, {
        font: TimesFont,
        size: 2,
        depth: 0.1,
        curveSegments: 32,
        bevelEnabled: false,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 1,
    }); */

    // Create a standard material with 50% gloss
    const pMaxTextMaterial = new THREE.MeshStandardMaterial({
        color: pMaxColor,
        roughness: 0.1
    });

    if (pTtextMesh) {
        setVisibility(false, pTtextMesh, pMaxTextMesh);
    }

    if (!pales_text) {
        initTextRotation();
    }

        if (true || (windSpeed >= windSpeedLowNorm && windSpeed <= windSpeedHighNorm)) {
            // Geometries are attached to meshes so that they get rendered
            //pTtextMesh = new THREE.Mesh(ptTextGeometry, ptTextMaterial);
            pTtextMesh = createOptimizedText(Number.parseFloat(power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit, ptTextMaterial, 2);
            // Update positioning of the text
            pTtextMesh.position.set(-15, -10, 3);
            scene.add(pTtextMesh);

            //pMaxTextMesh = new THREE.Mesh(pMaxTextGeometry, pMaxTextMaterial);
            pMaxTextMesh = createOptimizedText(Number.parseFloat(max_power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit, pMaxTextMaterial);
            // Update positioning of the text
            pMaxTextMesh.position.set(-14, -20, 3);
            scene.add(pMaxTextMesh);

            if(nombre_tour_par_minute_pales != last_nombre_tour_par_minute_pales) {
                scene.remove(pales_text);
                last_nombre_tour_par_minute_pales = nombre_tour_par_minute_pales;
                pales_text = createText("(rotation "+nombre_tour_par_minute_pales.toFixed(1).replace(".", ",")+" tours/min)", 1.5);
                pales_text.position.set(leg_x+19, leg_y-2, leg_z);
            }

            if(nombre_tour_par_minute_multip != last_nombre_tour_par_minute_multip) {
                scene.remove(multip_text);
                last_nombre_tour_par_minute_multip = nombre_tour_par_minute_multip;
                multip_text = createText("(rotation "+nombre_tour_par_minute_multip.toFixed(1).replace(".", ",")+" tours/min)", 1.5);
                multip_text.position.set(leg_x+19, leg_y-2-leg_dist*2, leg_z);
            }
        }

    // Check wind speed and display alerts if necessary
    if (windSpeed > windSpeedHighNorm) {
        alertHigh.style.display = 'block';
    } else {
        alertHigh.style.display = 'none';
    }

    if (windSpeed < windSpeedLowNorm) {
        alertLow.style.display = 'block';
    } else {
        alertLow.style.display = 'none';
    }

    if (windSpeed > 0 && !particleSystem) {
        // Create particle geometry and material
        particleCount = 3000;
        windParticles = new THREE.BufferGeometry();
        particlePositions = new Float32Array(particleCount * 3);
        particleSpeeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = Math.random() * 20 - 10;
            particlePositions[i * 3 + 1] = Math.random() * 30 - (-7);
            particlePositions[i * 3 + 2] = Math.random() * 10 - 5;
            particleSpeeds[i] = (Math.random() * 0.1 + 0.05)*(windSpeed*0.2);
        }

        windParticles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        windParticles.setAttribute('speed', new THREE.BufferAttribute(particleSpeeds, 1));

        // Create new particle system
        windParticleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.01,
        });

        particleSystem = new THREE.Points(windParticles, windParticleMaterial);
        particleSystem.userData.tooltipText = windTooltipText;
        scene.add(particleSystem);
    } else if (windSpeed == 0) {
        // Remove the old particle system from the scene
        if (particleSystem) {
            particleSystem.visible = false;
        }
    } else if (windSpeed > 0 && !particleSystem.visible) {
        particleSystem.visible = true;
    }

    if (!windParticlesSystemLegend) {
        // Create particle geometry and material
        particleCountLegend = 200;
        windParticles = new THREE.BufferGeometry();
        particlePositions = new Float32Array(particleCountLegend * 3);

        for (let i = 0; i < particleCountLegend; i++) {
            particlePositions[i * 3] = Math.random() * (leg_x-25) - -leg_y-10;
            particlePositions[i * 3 + 1] = Math.random() * (leg_y-25) - (-35);
            particlePositions[i * 3 + 2] = Math.random() * 5 - 0;
        }

        windParticles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        // Create new particle system
        windParticleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.01,
        });

        windParticlesSystemLegend = new THREE.Points(windParticles, windParticleMaterial);
        windParticlesSystemLegend.userData.tooltipText = windTooltipText;
        scene.add(windParticlesSystemLegend);
    }

    if (!blades) {
        initBlades();
    }

    if (lastBladesLength != bladeLength) {
        bladeGeom = createBladeGeometry(bladeLengthSimul, 10);
        blades.children.forEach((blade, i) => {
            blade.geometry = bladeGeom;
        });
        bladesCylinderGeometry = new THREE.CylinderGeometry(bladeLengthSimul, bladeLengthSimul, 7, 32); // 32 segments pour une forme lisse
        bladesCylinder.geometry = bladesCylinderGeometry;
        blades0.children.forEach((blade, i) => {
            blade.geometry = bladeGeom;
        });
        diskGeometry = new THREE.CircleGeometry(bladeLengthSimul, 32); // 32 segments pour une forme lisse
        disk.geometry=diskGeometry;
        lastBladesLength = bladeLength;
    }
        

    if (particles) {
        particles.forEach((particle, index) => {
            scene.remove(particle);
        })
    }
    // Create yellow particles
    const particleGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    particles = [];

    // Particle positions along the first wire
    for (let i = 0; i < towerSize+5; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(points[0]);
        particle.position.y -= i * 1; // Space particles along the y-axis
        particles.push(particle);
        scene.add(particle);
    }
    // Particle positions along the second wire
    for (let i = 0; i < 2; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(points2[0]);
        particle.position.x += i * 1; // Space particles along the x-axis
        particles.push(particle);
        scene.add(particle);
    }
}


last_timestamp = 0;
function animate(timestamp) {
    if (isContextLost) return;
    deltaTime = (timestamp - last_timestamp)*0.001;
    last_timestamp = timestamp;
    requestAnimationFrame(animate);
    controls.update();

    if (particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += (Math.random() * 0.1 + 0.05)*(windSpeed*0.2);//speeds[i];

            // Reset particle position if it goes out of bounds
            if (positions[i * 3] > 10) {
                positions[i * 3] = -10;
            }
        }

        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    if (windParticlesSystemLegend) {
        const positions = windParticlesSystemLegend.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += (Math.random() * 0.1 + 0.05)*(windSpeed*0.2);//speeds[i];

            // Reset particle position if it goes out of bounds
            if (positions[i * 3] > leg_x+5) {
                positions[i * 3] = leg_x;
            }
        }

        windParticlesSystemLegend.geometry.attributes.position.needsUpdate = true;
    }

    if (windSpeed >= windSpeedLowNorm && windSpeed <= windSpeedHighNorm) {
        bladeAngle += (vitesse_angulaire_pales*deltaTime) % (2*Math.PI);//windSpeed * 0.005; // Adjusted speed of rotation
        bladeAngle = bladeAngle % (2*Math.PI);
        shaftAngle += vitesse_angulaire_pales*deltaTime;//windSpeed * 0.004; // Shaft rotates slower than blades
        gearboxAngle += (vitesse_angulaire_multip*deltaTime) % (2*Math.PI);//windSpeed * 0.026; // Gearbox rotates faster than the shaft
        gearboxAngle = gearboxAngle % (2*Math.PI);
        //console.log(gearboxAngle+" "+bladeAngle)
        
        if (alternateurActive) {
            alternatorAngle += (vitesse_angulaire_multip*deltaTime) % (2*Math.PI);//windSpeed * 0.02; // Alternator rotates faster than gearbox
            alternatorAngle = alternatorAngle % (2*Math.PI);
        }
        
    }


    blades0.rotation.z = bladeAngle; // Adjust rotation speed as needed
    bladesL.rotation.z = bladeAngle; // Adjust rotation speed as needed
    blades.rotation.x = bladeAngle;
    shaft.rotation.x = shaftAngle;
    multiplicateur.rotation.x = gearboxAngle;
    multiplicateurL.rotation.x = gearboxAngle;
    alternateur.rotation.x = alternatorAngle;
    alternateurL.rotation.x = alternatorAngle;

    // Animate particles
    particles.forEach((particle, index) => {
        if (windSpeed < windSpeedLowNorm || windSpeed > windSpeedHighNorm || !alternateurActive || (power == 0)) {
            scene.remove(particle);
        } else {
            // Determine which wire the particle is on
            if (index < towerSize+5) {
                particle.position.y -= particleSpeed;
                if (particle.position.y < -1) {
                    particle.position.y = towerSize;
                }
            } else {
                particle.position.x += particleSpeed;
                if (particle.position.x > 10) {
                    particle.position.x = 8;
                }
            }
        }
    });

    // Calculer la puissance produite par l'éolienne
    //let power = calculatePower();  // Exemple: calcul de la puissance

    // Mettre à jour l'affichage du galvanomètre
    //updateGalvanometer(galvanometerObj, power);

    renderer.render(scene, camera);
}


// Créez le raycaster et le vecteur pour stocker la position de la souris
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Calculer la position de la souris en coordonnées normalisées pour Three.js
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Mettre à jour le raycaster avec la position de la souris
    raycaster.setFromCamera(mouse, camera);

    // Trouver les objets intersectés par le raycaster
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Si un objet est cliqué, afficher un tooltip
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.tooltipText) {
            showTooltip(event.clientX, event.clientY, object.userData.tooltipText);
        } else if (object.parent && object.parent.userData.tooltipText) {
            showTooltip(event.clientX, event.clientY, object.parent.userData.tooltipText);
        }
        if (object.userData.onclick) {
            object.userData.onclick();
        }
    }
}

let isContextLost = false;
function onContextLost(event) {
    event.preventDefault();
    isContextLost = true;
    showError("Contexte WebGL perdu - Recharger la page");
}
function onContextRestored(event) {
    isContextLost = true;
    init();
}

// Optionnel : Cacher le tooltip lorsqu'on clique ailleurs
document.addEventListener('click', (event) => {
    if (!event.target.closest('canvas')) {
        tooltip.style.display = 'none';
    }
});

init();