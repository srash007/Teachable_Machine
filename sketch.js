// Variables globales
let modelURL = 'https://teachablemachine.withgoogle.com/models/deInFz4X4/';
let classifier;
let video;
let label = "Attente...";
let confidence = 0;
let modelReady = false;
let actionLog = []; // Pour stocker le journal des actions
let capturedImage = null; // Pour stocker l'image capturée

function setup() {
  createCanvas(320, 260);
  background(0);
  
  // Mettre à jour l'interface utilisateur
  updateStatus("Chargement de la caméra...");
  updateDetectedObject("Aucun", 0);
  
  // Ajouter une action au journal
  logAction("Initialisation du système");
  
  // Vérifier si ml5 est disponible
  if (typeof ml5 === 'undefined') {
    console.error("ERREUR: ml5 n'est pas défini!");
    updateStatus("ERREUR: ml5 n'est pas disponible");
    logAction("ERREUR: Bibliothèque ml5.js non trouvée");
    return; // Arrêter l'exécution
  }
  
  // Créer la capture vidéo
  video = createCapture(VIDEO, videoReady);
  video.size(320, 240);
  video.hide();
  
  // Désactiver le bouton de capture jusqu'à ce que le modèle soit prêt
  const captureButton = document.getElementById('btn-capture');
  if (captureButton) {
    captureButton.disabled = true;
  }
}

function videoReady() {
  console.log("Vidéo prête!");
  updateStatus("Caméra prête! Chargement du modèle...");
  logAction("Caméra initialisée avec succès");
  
  // Chargement du modèle avec un petit délai
  setTimeout(loadTeachableModel, 1000);
}

function loadTeachableModel() {
  try {
    console.log("Chargement du modèle...");
    logAction("Tentative de chargement du modèle Teachable Machine");
    
    // Assurez-vous que l'URL se termine correctement
    let modelPath = modelURL;
    if (!modelPath.endsWith('/')) {
      modelPath += '/';
    }
    
    // Afficher des informations de débogage
    console.log("URL complète du modèle:", modelPath + 'model.json');
    logAction("URL du modèle: " + modelPath + 'model.json');
    
    // Vérifier que ml5 est toujours disponible
    if (typeof ml5 === 'undefined' || typeof ml5.imageClassifier !== 'function') {
      throw new Error("ml5.js ou ml5.imageClassifier n'est pas disponible");
    }
    
    // Charger le modèle avec ml5.imageClassifier
    classifier = ml5.imageClassifier(modelPath + 'model.json', modelLoaded);
  } catch (error) {
    console.error("Erreur lors du chargement du modèle:", error);
    updateStatus("Erreur: " + error.message);
    logAction("ERREUR: Échec du chargement du modèle - " + error.message);
  }
}

function modelLoaded() {
  console.log("Modèle chargé!");
  modelReady = true;
  updateStatus("Modèle chargé! Prêt pour la détection");
  logAction("Modèle Teachable Machine chargé avec succès");
  
  // Activer le bouton de capture une fois que le modèle est prêt
  const captureButton = document.getElementById('btn-capture');
  if (captureButton) {
    captureButton.disabled = false;
  }
}

// Nouvelle fonction pour capturer et classifier à la demande
function captureAndClassify() {
  if (!classifier || !modelReady) {
    console.warn("Le classifier n'est pas prêt");
    logAction("Tentative de classification échouée - classifier non prêt");
    return;
  }
  
  // Capturer l'image actuelle
  capturedImage = createImage(video.width, video.height);
  capturedImage.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
  
  logAction("Image capturée pour analyse");
  updateStatus("Classification en cours...");
  
  // Classifier l'image capturée
  classifier.classify(capturedImage, gotResult);
}

function gotResult(error, results) {
  if (error) {
    console.error(error);
    updateStatus("Erreur de classification: " + error.message);
    logAction("ERREUR: Échec de classification - " + error.message);
    return;
  }
  
  if (results && results.length > 0) {
    label = results[0].label;
    confidence = results[0].confidence.toFixed(2);
    
    console.log("Résultat:", label, "Confiance:", confidence);
    updateDetectedObject(label, confidence * 100);
    logAction("Objet détecté: " + label + " (confiance: " + (confidence * 100).toFixed(0) + "%)");
    updateStatus("Classification terminée");
  }
}

function draw() {
  background(0);
  
  // Afficher l'image capturée si elle existe, sinon afficher la vidéo
  if (capturedImage) {
    image(capturedImage, 0, 0);
    
    // Afficher un cadre autour de l'image pour indiquer qu'il s'agit d'une capture
    noFill();
    stroke(255, 0, 0);
    strokeWeight(3);
    rect(0, 0, capturedImage.width, capturedImage.height);
    strokeWeight(1);
  } else if (video && video.loadedmetadata) {
    image(video, 0, 0);
  }
  
  // Afficher le label
  fill(255);
  textSize(24);
  textAlign(CENTER);
  text(label, width/2, height - 16);
  
  // Afficher un message spécifique si le label est "gourde"
  if (label === "gourde") {
    fill(0, 255, 0);
    text("Il y a de l'eau à l'intérieur", width/2, height/2);
  }
}

// Fonctions pour mettre à jour l'interface utilisateur
function updateStatus(message) {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    
    // Mise à jour visuelle du statut
    const statusBox = document.querySelector('.status-box');
    if (statusBox) {
      statusBox.classList.remove('error', 'success');
      
      if (message.includes('Erreur')) {
        statusBox.classList.add('error');
      } else if (message.includes('succès') || message.includes('prêt') || message.includes('terminée')) {
        statusBox.classList.add('success');
      }
    }
  }
  
  // Ajouter un message console pour le débogage
  console.log("Statut:", message);
}

function updateDetectedObject(object, confidenceValue) {
  const objectElement = document.getElementById('detected-object');
  const confidenceBarElement = document.getElementById('confidence-bar');
  const confidenceValueElement = document.getElementById('confidence-value');
  
  if (objectElement) {
    objectElement.textContent = object;
  }
  
  if (confidenceBarElement) {
    confidenceBarElement.style.width = confidenceValue + '%';
  }
  
  if (confidenceValueElement) {
    confidenceValueElement.textContent = confidenceValue.toFixed(0) + '%';
  }
  
  // Mettre à jour les classes CSS en fonction de l'objet détecté
  const detectionInfo = document.querySelector('.detection-info');
  if (detectionInfo) {
    // Réinitialiser les classes
    detectionInfo.classList.remove('water-detected', 'fire-detected', 'plant-detected');
    
    // Ajouter la classe appropriée en fonction de l'objet
    if (object === "gourde") {
      detectionInfo.classList.add('water-detected');
    } else if (object === "feu") {
      detectionInfo.classList.add('fire-detected');
    } else if (object === "plante") {
      detectionInfo.classList.add('plant-detected');
    }
  }
}

// Fonction pour enregistrer une action dans le journal
function logAction(message) {
  // Ajouter au tableau local
  actionLog.push({
    time: new Date().toLocaleTimeString(),
    message: message
  });
  
  // Mettre à jour l'élément DOM
  const logElement = document.getElementById('action-log-content');
  if (logElement) {
    // Créer une nouvelle entrée de journal
    const entry = document.createElement('div');
    entry.className = 'action-entry';
    entry.innerHTML = `<strong>[${actionLog[actionLog.length-1].time}]</strong> ${message}`;
    
    // Ajouter au début du journal (les événements les plus récents en haut)
    logElement.insertBefore(entry, logElement.firstChild);
    
    // Limiter le nombre d'entrées affichées pour des raisons de performance
    if (logElement.children.length > 50) {
      logElement.removeChild(logElement.lastChild);
    }
  }
  
  // Log dans la console également pour le débogage
  console.log(`[ACTION] ${message}`);
}
