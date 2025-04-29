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

            if (windSpeed > windSpeedHighNorm || windSpeed < windSpeedLowNorm) {
                v = 0;
            }

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

            max_power = power * 16/27;
            
            if (powerUnit == "W") {
                max_power_ = max_power.toFixed(0);
            } else if (powerUnit == "kW") {
                max_power_ = max_power.toFixed(3)
            } else if (powerUnit == "MW") {
                max_power_ = max_power.toFixed(3);
            }

            max_power_text = Number.parseFloat(max_power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit;

            power_text = Number.parseFloat(power_).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' '+powerUnit;
            if (!calculationIsVisible()) {
                showSceneTexts(power_text, max_power_text);
                return;
            }


            let text = "<p style='font-weight:bold;text-decoration: underline;'>Puissance théorique</p>";
            if (windSpeed > windSpeedHighNorm) {
                text += "<p>Vitesse du vent trop forte!</p>";
                v = 0;
            } else if (windSpeed < windSpeedLowNorm) {
                text += "<p>Vitesse du vent trop faible!</p>";
                v = 0;
            } else {
                
                if (windSpeed <= windSpeedNominal) {
                    text += `<p>v<sub>vent</sub>=${windSpeed} m/s &els; v<sub>nominale</sub>=${windSpeedNominal} m/s`;
                    text += `<p> alors v=${windSpeed} m/s</p>`;
                } else  {
                    text += `<p>v<sub>vent</sub>=${windSpeed} m/s &gt; v<sub>nominale</sub>=${windSpeedNominal} m/s</p>`;
                    text += `<p> alors v=${windSpeedNominal} m/s</p>`;
                    v = windSpeedNominal;
                }
                text += `<p>L=${bladeLength} m,  `;
                text += `ρ=${rho} kg/m<sup>3</sup></p>`;
                //text += `<p>Alors</p>`;
                text += (`<p style='border: 1px solid black;'> P<sub>TH</sub> = (1/2)·ρ·S·v³</p>`);
                //text += (`<p>Expression : \\(\\sqrt{A + 2B + \\frac{C}{D}}\\)</p>`);
                text += (`<p>     = (1/2)·ρ·(π·L²)·v³</p>`);
                text += (`<p>     = (1/2)·(${rho})·(π·${L}²)·(${v}³)</p>`);
                text += (`<p style='border: 1px solid black;'> P<sub>TH</sub> = ${power_text}</p>`);
                text += (`<p style='font-weight:bold;text-decoration: underline;'>Puissance maximale</p>`);
                text += (`<p style='border: 1px solid black;'> P<sub>MAX</sub>  = 16/27.P<sub>TH</sub> (Loi de Betz)</p>`);
                text += (`<p>       = 0,593.${power_text}</p>`);
                text += (`<p style='border: 1px solid black;'> P<sub>MAX</sub> = ...</p>`);
            }

            text = formatLine(text, L, v, rho);

            const resultDiv = document.querySelector('.result');
            resultDiv.innerHTML = text;

            // Effet machine à écrire
            let i = 0;
            let buffer = "";
            clearInterval(typingInterval);
            typingInterval = setInterval(function() {
                if (i < text.length) {
                    // Gère les balises HTML
                    if (true && text[i] === '<') {
                        const endTag = text.indexOf('>', i);
                        buffer += text.substring(i, endTag + 1);
                        i = endTag + 1;
                    } else {
                        // Accumule le texte brut dans un buffer
                        buffer += text[i];    
                        i++;

                    }
                    // Affiche le contenu brut TEMPORAIREMENT
                    resultDiv.innerHTML = buffer + "█"; // Curseur clignotant stylisable en CSS
                    //MathJax.typesetPromise(); // Recompile le contenu mathématique
                } else {
                    clearInterval(typingInterval);
                    
                    // Ajoute le résultat final après un délai
                    setTimeout(() => {
                        resultDiv.innerHTML = resultDiv.innerHTML.replace('...', max_power_text).replace('█', '');
						showSceneTexts(power_text, max_power_text);
						
                    }, 100);
                }
            }, 50);
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
                .replaceAll(new RegExp(`${v} m/s`, 'g'), `<span class="highlight-green">${v} m/s</span>`)
                .replaceAll('16/27', '<span class="fraction"><b><span>16</span><span class="denominator">27</span></b></span>')
                .replaceAll('= 0,593', '<b>= 0,593</b>')
                ;
        }

        function showSceneTexts(power_text, max_power_text) {
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
            

            // Create a standard material with 50% gloss
            const pMaxTextMaterial = new THREE.MeshStandardMaterial({
                color: pMaxColor,
                roughness: 0.1
            });
            pMaxTextMesh = createOptimizedText(max_power_text, pMaxTextMaterial);
            // Update positioning of the text
            pMaxTextMesh.position.set(-14, -20, 3);
            scene.add(pMaxTextMesh);
        }

        
		
document.onreadystatechange = function (e) {
	setDraggable('courbe');
	setDraggable('result_fermer');
}