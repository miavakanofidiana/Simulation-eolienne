const multiplicateurTooltipText = "<b>Multiplicateur</b><br>Il augmente la vitesse de l'<b>Arbre lent</b> de 1000 à 2000 tours/minute.<br><img class='leg' src='images/multiplicateur.jpg'><br><i>Source: </i>";
const matTooltipText = "<b>Mât</b><br>Le mât élève l'éolienne pour capter des vents plus puissants en altitude d’environ 85 à 110 mètres de haut.<br><img class='leg' src='images/parc_eolien.jpg'><br><i>Source: </i>";
const transformateurTooltipText = "<b>Transformateur</b><br>Ceci tranforme le courant électrique en haute tension jusqu'à 30 000 V pour être injecté sur le réseau électrique.<br><img class='leg' src='images/transformateur.jpg'><br><i>Source: </i>";
const palesTooltipText = "<b>Pales</b><br>Les pales convertissent l'<em>énergie cinétique</em> du vent en <em>énergie mécanique.</em>Celles-ci tournent à une vitesse d’environ 10 à 25 tours/minute.";
const alternateurTooltipText = "<b>Alternateur</b><br>L'alternateur convertit l'<em>énergie mécanique</em> du multiplicateur en <em>énergie électrique.</em> Il fonctionne sur le principe de la dynamo.<br><img class='leg' src='images/DYNAMO-ALTERNATEUR PRINCIPE ANIME 1.gif'><br><i>Source: </i>";
const windTooltipText = "<br>Particules d'air.";
const arbreLentTooltipText = "<br>Arbre lent.";
const pylonTooltipText = "Pylône.<br><img class='leg' src='images/pylone.jpg'><br><i>Source: </i>";


// Créez un élément HTML pour le tooltip
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.padding = '8px';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = '#fff';
tooltip.style.borderRadius = '4px';
tooltip.style.textAlign = 'center';
tooltip.style.marginRight = '10%';
tooltip.style.overflow = "auto";
//tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none'; // Par défaut, on le cache

document.body.appendChild(tooltip);

function showTooltip(x, y, text) {
    // Définir le texte du tooltip
    tooltip.innerHTML = "";
    const text_div = document.createElement('div');
    text_div.innerHTML = text;
    text_div.style.marginLeft = "15px";

    
    const closeX = document.createElement('span');
    closeX.style.position = 'absolute';
    closeX.style.padding = '1px';
    closeX.style.textAlign = 'center';
    closeX.style.display = 'block';
    closeX.style.cursor = "pointer";
    closeX.style.color = "red";
    closeX.style.left = "10px";
    closeX.style.top = "0px";

    closeX.innerHTML = "x Fermer";
    closeX.addEventListener("click", function() {
        tooltip.style.display = 'none';
    });

    tooltip.appendChild(closeX);
    tooltip.appendChild(text_div);

    // Positionner le tooltip
    tooltip.style.left = `${x + 10}px`; // Décalage pour ne pas recouvrir le curseur
    tooltip.style.top = `${y + 10}px`;
    tooltip.style.display = 'block';
}