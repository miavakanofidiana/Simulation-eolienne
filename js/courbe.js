const canvas = document.getElementById('graph');
const overlay = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const overlayCtx = overlay.getContext('2d');
let currentDataPoints = [];
let isAnimating = false;
let maxX, maxY;
let currentAnimationFrame = null;
let clearTimeoutId = null;
let cutIn, ratedSpeed, cutOut;

async function hideCourbePuissance() {
    document.querySelector('#courbe').style.display = 'none';
}

async function showCourbePuissance() {
    document.querySelector('#courbe').style.display = 'block';
    generateCourbePuissance();
}

async function generateCourbePuissance() {
    if(isAnimating) return;
    isAnimating = true;
    
    cutIn = calculateCutInSpeed(bladeLength); // Vitesse de démarrage
    ratedSpeed = windSpeedNominal;
    cutOut = 25; // Vitesse d'arrêt
    maxY = calculateMaxPower(ratedSpeed);
    maxX = cutOut;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    drawGrid();
    drawAxes();

    currentDataPoints = [];
    
    // Génération des points
    const steps = [
        { start: 0, end: cutIn, step: 0.5 },
        { start: cutIn, end: ratedSpeed, step: 0.1 },
        { start: ratedSpeed, end: cutOut, step: 0.5 },
        { start: cutOut, end: cutOut + 5, step: 0.5 }
    ];

    steps.forEach(segment => {
        for(let v = segment.start; v <= segment.end; v += segment.step) {
            currentDataPoints.push(createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY));
        }
    });

    [cutIn, ratedSpeed, cutOut].forEach(v => {
        if(!currentDataPoints.some(p => p.v === v)) {
            currentDataPoints.push(createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY));
        }
    });

    currentDataPoints.sort((a, b) => a.v - b.v);

    ctx.beginPath();
    ctx.moveTo(currentDataPoints[0].x, currentDataPoints[0].y);
    currentDataPoints.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    await drawPhases(cutIn, ratedSpeed, cutOut);
    isAnimating = false;
}

function createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY) {
    return {
        v,
        power: calculateRecPower(v, cutIn, ratedSpeed, cutOut, maxY),
        x: 40 + (v/maxX * (canvas.width - 60)),
        y: canvas.height - 40 - (calculateRecPower(v, cutIn, ratedSpeed, cutOut, maxY)/maxY * (canvas.height - 80))
    };
}

function calculateMaxPower(ratedSpeed) {
    S = Math.PI*Math.pow(bladeLength, 2);
    v3 = Math.pow(ratedSpeed, 3);
    p = (1/2)*rho*S*v3;
    if (powerUnit == "kW") {
        p /= 1000;
    } else if (powerUnit == "MW") {
        p /= 1000000;
    }
    p = p*(rendement/100);
    return p;
}

function calculateRecPower(v, cutIn, ratedSpeed, cutOut, maxPower) {
    return calculatePower(v, cutIn, ratedSpeed, cutOut, maxPower)*(rendement/100);
}

function calculatePower(v, cutIn, ratedSpeed, cutOut, maxPower) {
    if(v < cutIn) return 0;
    c_power = (1/2)*rho*S*Math.pow(v, 3);
    if (powerUnit == "kW") {
        c_power /= 1000;
    } else if (powerUnit == "MW") {
        c_power /= 1000000;
    }
    if(v < ratedSpeed) return c_power;
    if(v <= cutOut) return maxPower*100/rendement;
    return 0;
}

async function drawPhases(cutIn, ratedSpeed, cutOut) {
    await drawPhase(0, cutIn, '#95a5a6');
    await drawPhase(cutIn, ratedSpeed, '#e67e22');
    await drawPhase(ratedSpeed, cutOut, '#2ecc71');
    await drawPhase(cutOut, cutOut + 5, '#e74c3c');
}

async function drawPhase(startV, endV, color) {
    const phasePoints = currentDataPoints.filter(p => p.v >= startV && p.v <= endV);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    const firstPoint = phasePoints[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for(const point of phasePoints) {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        await new Promise(resolve => setTimeout(resolve, 15));
    }
}

canvas.addEventListener('click', async (e) => {
    if(isAnimating) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Recherche point sur la courbe
    let closestPoint = currentDataPoints.reduce((closest, point) => {
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        return distance < 15 && distance < closest.distance ? 
            {point, distance} : closest;
    }, {point: null, distance: Infinity}).point;

    if (closestPoint) {
        const lines = [
            {startX: closestPoint.x, startY: closestPoint.y, endX: closestPoint.x, endY: canvas.height -40},
            {startX: closestPoint.x, startY: closestPoint.y, endX:40, endY: closestPoint.y}
        ];
        await drawProjectionLines(closestPoint, lines);
    } else {
        // Vérification clic sur l'axe X
        const yAxisPos = canvas.height - 40;
        const tolerance = 5;
        if (Math.abs(mouseY - yAxisPos) < tolerance) {
            const graphStartX = 40;
            const graphWidth = canvas.width - 60;
            const xInGraph = mouseX - graphStartX;
            
            if (xInGraph >= 0 && xInGraph <= graphWidth) {
                const v = (xInGraph / graphWidth) * maxX;
                const point = createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY);
                
                const lines = [
                    { startX: point.x, startY: yAxisPos, endX: point.x, endY: point.y },
                    { startX: point.x, startY: point.y, endX:40, endY: point.y }
                ];
                await drawProjectionLines(point, lines);
            }
        }
    }
});

async function drawProjectionLines(point, lines) {
    if (clearTimeoutId) {
        clearTimeout(clearTimeoutId);
    }
    if(currentAnimationFrame) cancelAnimationFrame(currentAnimationFrame);
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

    document.getElementById("windSpeed").value = point.v;
    updateSimulation();
    updateCalculation();

    await animateDashedLines(lines);

    overlayCtx.fillStyle = '#3498db';
    overlayCtx.font = 'bold 13px Arial';
    overlayCtx.textBaseline = 'middle';
    
    // Affichage vitesse
    overlayCtx.fillText(
        `${point.v.toFixed(1)} m/s`,
        point.x + 15,
        canvas.height - 50
    );

    // Affichage puissance
    let pointPower;
    switch(powerUnit) {
        case "kW": 
        case "MW": 
            pointPower = point.power.toFixed(2);
            break;
        case "W": 
            pointPower = point.power.toFixed(0);
            break;
    }

    overlayCtx.fillText(
        `${pointPower} ${powerUnit}`,
        100,
        point.y - 10
    );

    clearTimeoutId = setTimeout(() => {
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    }, 4000);
}

function animateDashedLines(lines) {
    return new Promise(resolve => {
        const totalSteps = 100;
        let currentStep = 0;
        
        const animate = () => {
            if(currentStep > totalSteps) {
                resolve();
                return;
            }
            
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            overlayCtx.setLineDash([5, 5]);
            overlayCtx.strokeStyle = '#3498db';
            overlayCtx.lineWidth = 1;

            lines.forEach(line => {
                const progress = Math.min(currentStep / totalSteps, 1);
                overlayCtx.beginPath();
                overlayCtx.moveTo(line.startX, line.startY);
                overlayCtx.lineTo(
                    line.startX + (line.endX - line.startX) * progress,
                    line.startY + (line.endY - line.startY) * progress
                );
                overlayCtx.stroke();
            });

            currentStep++;
            currentAnimationFrame = requestAnimationFrame(animate);
        };
        
        currentAnimationFrame = requestAnimationFrame(animate);
    });
}

function drawGrid() {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    
    // Carreaux verticaux (tous les 1 m/s)
    for(let v = 0; v <= maxX; v += 1) {
        const x = 40 + (v/maxX * (canvas.width - 60));
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();
    }

    // Carreaux horizontaux (tous les 10% de maxY)
    for(let p = 0; p <= maxY+(maxY/5); p += maxY/10) {
        const y = canvas.height - 40 - (p/maxY * (canvas.height - 80));
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Style des lignes principales plus épaisses
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Lignes verticales principales (tous les 5 m/s)
    for(let v = 0; v <= maxX; v += 5) {
        const x = 40 + (v/maxX * (canvas.width - 60));
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height - 40);
        ctx.stroke();
    }

    // Mise en évidence de la zone nominale
    if(ratedSpeed && false) {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
        const startX = 40 + (ratedSpeed/maxX * (canvas.width - 60));
        ctx.fillRect(
            startX,
            0,
            canvas.width - startX-20,
            canvas.height - 40
        );
    }
}

function drawAxes() {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    // Axe Y
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, canvas.height - 40);
    ctx.stroke();

    // Axe X
    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();

    // Étiquettes
    ctx.fillStyle = '#000';
    ctx.font = '11px Arial';
    
    // Échelle Y
    for(let i = 0; i <= maxY+(maxY/5); i += maxY/5) {
        switch(powerUnit) {
            case "kW": {
                i_power = i.toFixed(2);
                break;
            }
            case "MW": {
                i_power = i.toFixed(2);
                break;
            }
            case "W": {
                i_power = Math.round(i);
            }
        }
        i_power = i_power.toLocaleString('fr-FR').replace('.', ',');
        const y = canvas.height - 40 - (i/maxY * (canvas.height - 80));
        ctx.fillText(`${i_power}`, 2, y + 5); // Décaler de 5 → 2
    }

    // Échelle X avec plus de graduations
    const xStep = maxX > 25 ? 5 : 1; // Adapte le pas selon la plage
    for(let v = 0; v <= maxX; v += xStep) {
        const x = 47 + (v/maxX * (canvas.width - 60));
        
        // Style différent pour les demi-valeurs
        if(v % 5 !== 0) {
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
        } else {
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
        }
        
        ctx.fillText(
            `${v.toFixed(v % 1 === 0 ? 0 : 1)}`, 
            x - (v < 10 ? 10 : 15), 
            canvas.height - 25
        );
    }

    // Marqueurs secondaires pour l'axe Y (tous les 10% de maxY)
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    for(let i = 0; i <= maxY; i += maxY/20) { // Pas de 5% au lieu de 20%
        const y = canvas.height - 40 - (i/maxY * (canvas.height - 80));
        ctx.beginPath();
        ctx.moveTo(38, y); // Départ légèrement à gauche de l'axe
        ctx.lineTo(42, y); // Ligne courte de 4px
        ctx.stroke();
    }

    // Ajout de marqueurs secondaires
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.5;
    for(let v = 0; v <= maxX; v += 1) {
        const x = 40 + (v/maxX * (canvas.width - 60));
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 45);
        ctx.lineTo(x, canvas.height - 35);
        ctx.stroke();
    }

    // Ajouter les libellés d'axes avec unités
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    
    // Libellé axe Y (Puissance)
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Ajuster la position (-30 décalage vertical, 20 marge gauche)
    ctx.translate(25, canvas.height / 2); // Déplacer vers la droite
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Puissance (${powerUnit})`, 0, 30); // Décalage vertical
    
    ctx.restore();

    // Libellé axe X (Vitesse)
    ctx.fillText('Vitesse du vent (m/s)', canvas.width/2 - 60, canvas.height - 10);
    
    ctx.restore();
}