const canvas = document.getElementById('graph');
        const overlay = document.getElementById('overlay');
        const ctx = canvas.getContext('2d');
        const overlayCtx = overlay.getContext('2d');
        let currentDataPoints = [];
        let isAnimating = false;
        let maxX, maxY;
        let currentAnimationFrame = null;

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
            
            const cutIn = 3;//Vitesse de démarrage
            const ratedSpeed = windSpeedNominal;
            const cutOut = 25; //Vitesse d'arrêt
            maxY = calculateMaxPower(ratedSpeed);
            maxX = cutOut;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
            drawGrid();
            drawAxes();

            currentDataPoints = [];
            
            // Génération des points avec densité adaptative
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

            // Ajout des points critiques
            [cutIn, ratedSpeed, cutOut].forEach(v => {
                if(!currentDataPoints.some(p => p.v === v)) {
                    currentDataPoints.push(createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY));
                }
            });

            currentDataPoints.sort((a, b) => a.v - b.v);

            // Dessin de la courbe principale
            ctx.beginPath();
            ctx.moveTo(currentDataPoints[0].x, currentDataPoints[0].y);
            currentDataPoints.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Animation des phases colorées
            await drawPhases(cutIn, ratedSpeed, cutOut);
            isAnimating = false;
        }

        function createDataPoint(v, cutIn, ratedSpeed, cutOut, maxY) {
            return {
                v,
                power: calculatePower(v, cutIn, ratedSpeed, cutOut, maxY),
                x: 40 + (v/maxX * (canvas.width - 60)),
                y: canvas.height - 40 - (calculatePower(v, cutIn, ratedSpeed, cutOut, maxY)/maxY * (canvas.height - 80))
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
			p = p*16/27;
			return p;
		}

        function calculatePower(v, cutIn, ratedSpeed, cutOut, maxPower) {
            if(v < cutIn) return 0;
            if(v < ratedSpeed) return maxPower * Math.pow((v - cutIn)/(ratedSpeed - cutIn), 3);
            if(v <= cutOut) return maxPower;
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
            
            // Début au premier point de la phase
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
            // Calculer les facteurs d'échelle
			const scaleX = canvas.width / rect.width;
			const scaleY = canvas.height / rect.height;
			
			// Ajuster les coordonnées avec l'échelle
			const mouseX = (e.clientX - rect.left) * scaleX;
			const mouseY = (e.clientY - rect.top) * scaleY;

            let closestPoint = currentDataPoints.reduce((closest, point) => {
                const dx = mouseX - point.x;
                const dy = mouseY - point.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                return distance < 15 && distance < closest.distance ? 
                    {point, distance} : closest;
            }, {point: null, distance: Infinity}).point;

            if(closestPoint) {
                await drawProjectionLines(closestPoint);
            }
        });

		clearTimeoutId = null;

        async function drawProjectionLines(point) {
			if (clearTimeoutId) {
				clearTimeout(clearTimeoutId);
			}
            if(currentAnimationFrame) cancelAnimationFrame(currentAnimationFrame);
            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

            // Affichage de l'effet sur l'animation
            document.getElementById("windSpeed").value = point.v;
            updateSimulation();
            updateCalculation();

            // Animation des tirets
            await animateDashedLines([
                {startX: point.x, startY: point.y, endX: point.x, endY: canvas.height - 40},
                {startX: point.x, startY: point.y, endX: 40, endY: point.y}
            ]);

            // Affichage des valeurs APRÈS l'animation
            overlayCtx.fillStyle = '#3498db';
            overlayCtx.font = 'bold 13px Arial';
            overlayCtx.textBaseline = 'middle';
            
            // Valeur vitesse
            overlayCtx.fillText(
                `${point.v.toFixed(1)} m/s`,
                point.x + 15,
                canvas.height - 50
            );

            
            switch(powerUnit) {
                case "kW": 
                case "MW": {
                    pointPower = point.power.toFixed(3);
                    break;
                }
                case "W": {
                    pointPower = point.power.toFixed(0);
                }
            }

            // Valeur puissance
            overlayCtx.fillText(
                `${pointPower} ${powerUnit}`,
                50,
                point.y-10
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
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 0.5;
            
            // Grille verticale
            for(let x = 50; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height - 40);
                ctx.stroke();
            }

            // Grille horizontale
            for(let y = 50; y < canvas.height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(40, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
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
            ctx.font = '12px Arial';
            
            // Échelle Y
            for(let i = 0; i <= maxY; i += maxY/5) {
                switch(powerUnit) {
                    case "kW": 
                    case "MW": {
                        i_power = i.toFixed(3);
                        break;
                    }
                    case "W": {
                        i_power = Math.round(i);
                    }
                }
                const y = canvas.height - 40 - (i/maxY * (canvas.height - 80));
                ctx.fillText(`${i_power} ${powerUnit}`, 5, y + 5);
            }

            // Échelle X
            for(let v = 0; v <= maxX; v += 5) {
                const x = 40 + (v/maxX * (canvas.width - 60));
                ctx.fillText(`${v} m/s`, x - 15, canvas.height - 25);
            }
        }