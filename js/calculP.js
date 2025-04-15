let lastChanged = null;
let typingInterval;
        let timeoutIds = [];
        const inputs = {
            L: document.getElementById('bladeLength'),
            v: document.getElementById('windSpeed'),
            temperature: document.getElementById('temperature')
        };

        function hideCalculation() {
            const result_fermer = document.querySelector('.result_fermer');
			result_fermer.style.display = "none";
        }

        function showCalculation() {
            const result_fermer = document.querySelector('.result_fermer');
			result_fermer.style.display = "block";
            updateCalculation();
        }
        
        function calculationIsVisible() {
            const result_fermer = document.querySelector('.result_fermer');
			return result_fermer.style.display == "block";
        }

        function updateCalculation() {
            timeoutIds.forEach(clearTimeout);
            timeoutIds = [];
            
            const L = bladeLength;
            let v = windSpeed;
            const rho = airDensity(parseFloat(inputs.temperature.value));


            let text = "<p>Puissance théorique</p>";
            if (windSpeed > windSpeedHighNorm) {
                text += "<p>Vitesse du vent trop forte!</p>";
                v = 0;
            } else if (windSpeed < windSpeedLowNorm) {
                text += "<p>Vitesse du vent trop faible!</p>";
                v = 0;
            } else {
                
                if (windSpeed <= windSpeedNominal) {
                    text += `<p>v<sub>vent</sub>=${windSpeed} m/s &els; v<sub>nominale</sub>=${windSpeedNominal} m/s</p>`;
                    text += `<p> alors v=${windSpeed} m/s</p>`;
                } else  {
                    text += `<p>v<sub>vent</sub>=${windSpeed} m/s &gt; v<sub>nominale</sub>=${windSpeedNominal} m/s</p>`;
                    text += `<p> alors v=${windSpeedNominal} m/s</p>`;
                    v = windSpeedNominal;
                }
                text += `<p>L=${bladeLength} m</p>`;
                text += `<p>ρ=${rho} kg/m<sup>3</sup></p>`;
                //text += `<p>Alors</p>`;
                text += formatLine(`<p>P<sub>TH</sub> = (1/2)·ρ·S·v³</p>`, L, v, rho);
                text += formatLine(`<p>    = (1/2)·ρ·(π·L²)·v³</p>`, L, v, rho);
                text += formatLine(`<p>    = (1/2)·(${rho})·(π·${L}²)·(${v}³)</p>`, L, v, rho);
                text += formatLine(`<p>P<sub>TH</sub>  = ...</p>`, L, v, rho);
            }

            text = formatLine(text, L, v, rho);

            // Calcul
            S = Math.PI*Math.pow(bladeLength, 2);
            v3 = Math.pow(v, 3);
            power = (1/2)*rho*S*v3;
            power_ = power.toFixed(0);
            if (powerUnit == "kW") {
                power /= 1000;
                power_ = power.toFixed(3)
            } else if (powerUnit == "MW") {
                power /= 1000000;
                power_ = power.toFixed(3);
            }
            power_text = Number.parseFloat(power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit;
            if (!calculationIsVisible()) {
                showSceneTexts(power_text, power);
                return;
            }

            const resultDiv = document.querySelector('.result');
            resultDiv.innerHTML = text;

            // Effet machine à écrire
            let i = 0;
            let buffer = "";
            clearInterval(typingInterval);
            typingInterval = setInterval(function() {
                if (i < text.length) {
                    // Gère les balises HTML
                    if (false && text[i] === '<') {
                        const endTag = text.indexOf('>', i);
                        resultDiv.innerHTML += text.substring(i, endTag + 1);
                        i = endTag + 1;
                    } else {
                        // Accumule le texte brut dans un buffer
                        buffer += text[i];
                        
                        // Affiche le contenu brut TEMPORAIREMENT
                        resultDiv.innerHTML = buffer + "█"; // Curseur clignotant stylisable en CSS
                        i++;
                    }
                } else {
                    clearInterval(typingInterval);
                    
                    // Ajoute le résultat final après un délai
                    setTimeout(() => {

                        resultDiv.innerHTML = resultDiv.innerHTML.replace('...', power_text);
						showSceneTexts(power_text, power);
						
                    }, 500);
                }
            }, 10);
        }

        function formatLine(content, L, v, rho) {
            return content
                .replaceAll('(1/2)', '<span class="fraction"><span>1</span><span class="denominator">2</span></span>')
                .replaceAll(/ρ/g, `<span class="highlight-blue">ρ</span>`)
                .replaceAll(/kg\/m<sup>3<\/sup>/g, `<span class="highlight-blue">kg/m<sup>3</sup></span>`)
                .replaceAll(/π/g, 'π')
                .replaceAll(/L²/g, `<span class="highlight-magenta">L<sup>2</sup></span>`)
                .replaceAll(/L=/g, `<span class="highlight-magenta">L=</span>`)
                .replaceAll(/v³/g, `<span class="highlight-green">v<sup>3</sup></span>`)
                .replaceAll(/v=/g, `<span class="highlight-green">v=</span>`)
                .replaceAll(new RegExp(`=${rho}`, 'g'), `<span class="highlight-blue">=${rho}</span>`)
                .replaceAll(new RegExp(`\\(${rho}`, 'g'), `(<span class="highlight-blue">${rho}</span>`)
                .replaceAll(new RegExp(`${L}²`, 'g'), `<span class="highlight-magenta">${L}<sup>2</sup></span>`)
                .replaceAll(new RegExp(`${L} m`, 'g'), `<span class="highlight-magenta">${L} m</span>`)
                .replaceAll(new RegExp(`${v}³`, 'g'), `<span class="highlight-green">${v}<sup>3</sup></span>`)
                .replaceAll(new RegExp(`${v} m/s`, 'g'), `<span class="highlight-green">${v} m/s</span>`);
        }

        function showSceneTexts(power_text, power) {
            if (pTtextMesh) {
                scene.remove(pTtextMesh);
                scene.remove(pMaxTextMesh);
            }
            const ptTextMaterial = new THREE.MeshStandardMaterial({
                color: pth_color,
                roughness: 0.1
            });
            pTtextMesh = createOptimizedText(power_text, ptTextMaterial, 2);
            // Update positioning of the text
            pTtextMesh.position.set(-15, -10, 3);
            scene.add(pTtextMesh);
            
            max_power = power * 16/27;
            
            if (powerUnit == "W") {
                max_power_ = max_power.toFixed(0);
            } else if (powerUnit == "kW") {
                max_power_ = max_power.toFixed(3)
            } else if (powerUnit == "MW") {
                max_power_ = max_power.toFixed(3);
            }

            // Create a standard material with 50% gloss
            const pMaxTextMaterial = new THREE.MeshStandardMaterial({
                color: pMaxColor,
                roughness: 0.1
            });
            pMaxTextMesh = createOptimizedText(Number.parseFloat(max_power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit, pMaxTextMaterial);
            // Update positioning of the text
            pMaxTextMesh.position.set(-14, -20, 3);
            scene.add(pMaxTextMesh);
        }

        const draggable = document.getElementById('courbe');

        let isDragging = false;

function startDrag(e, isTouchEvent) {
    // Vérifie si l'élément cible est un enfant interactif
    const target = e.target;
    if (target !== draggable && target.closest('[data-clickable]')) {
        return; // Ignore le drag si c'est un élément cliquable
    }
    // Empêche le comportement par défaut (défilement, zoom)
    if (isTouchEvent) e.preventDefault();

    // Désactive les événements sur les enfants pendant le drag
    draggable.style.pointerEvents = 'none';

    // Récupère les coordonnées initiales
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    // Calcule le décalage initial
    const rect = draggable.getBoundingClientRect();
    const shiftX = clientX - rect.left;
    const shiftY = clientY - rect.top;

    function moveAt(pageX, pageY) {
        draggable.style.left = `${pageX - shiftX}px`;
        draggable.style.top = `${pageY - shiftY}px`;
    }

    function handleMove(e) {
        if (isTouchEvent) {
            // Pour les événements tactiles
            const touch = e.touches[0];
            moveAt(touch.pageX, touch.pageY);
            e.preventDefault(); // Empêche le défilement
        } else {
            // Pour la souris
            moveAt(e.pageX, e.pageY);
        }
    }

    function handleEnd() {
        // Réactive les événements après le drag
        draggable.style.pointerEvents = 'auto';
        if (isTouchEvent) {
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        } else {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
        }

        // Vérifie si c'était un clic simple (sans mouvement)
        if (!isDragging) {
            const clickEvent = new Event('click');
            target.dispatchEvent(clickEvent);
        }
        isDragging = false;
    }

    // Ajoute les écouteurs appropriés
    if (isTouchEvent) {
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd, { passive: false });
    } else {
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
}

// Gestionnaires pour le démarrage du glissement
draggable.addEventListener('mousedown', (e) => startDrag(e, false));
draggable.addEventListener('touchstart', (e) => startDrag(e, true));

// Désactive le drag-and-drop natif
draggable.ondragstart = () => false;