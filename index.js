// Configuração do Canvas
const canvas = document.getElementById('ocean');
const ctx = canvas.getContext('2d');

// Constantes - Perspectiva de cima: horizonte mais alto
const HORIZON_RATIO = 0.30; // Horizonte aos 30% da tela (mar mais baixo)
const BEACH_RATIO = 0.25; // Praia ocupa 25% da parte inferior
let WATER_LINE;

// Ajustar canvas para tela
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    WATER_LINE = canvas.height * (1 - BEACH_RATIO);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Estado do jogo
let trash = [];
let pollution = 0;
let personX = canvas.width * 0.8;
let personDirection = -1;
let personSpeed = 0.5;
let waves = [];
let particles = [];
let crabX = 100; // Posição do caranguejo
let crabDirection = 1;
let crabLegPhase = 0;
let deadFish = []; // Peixes mortos
let trashBinCount = 0; // Contador de lixo coletado
let showInstructions = true; // Mostrar instruções iniciais
let instructionOpacity = 0; // Opacidade das instruções (0 a 1)
let instructionFading = false; // Se está desvanecendo

// Inicializar ondas com perspectiva
function initWaves() {
    waves = [];
    const horizonY = canvas.height * HORIZON_RATIO;
    const waterY = WATER_LINE;
    for (let i = 0; i < 30; i++) {
        waves.push({
            x: Math.random() * canvas.width,
            y: horizonY + Math.random() * (waterY - horizonY),
            radius: Math.random() * 15 + 5,
            speed: Math.random() * 0.3 + 0.1,
            offset: Math.random() * Math.PI * 2
        });
    }
}
initWaves();

// Classe para o lixo - ULTRA SIMPLES
class Trash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 15 + 10;
        this.rotation = 0;
        this.vy = 0;
        this.type = Math.floor(Math.random() * 4);
        this.opacity = 1;
        this.collected = false;
        this.inWater = false;
        this.markedForRemoval = false;
        this.baseY = 0;
    }

    update() {
        if (this.markedForRemoval) return;
        
        if (this.collected) {
            this.opacity -= 0.05;
            if (this.opacity <= 0) {
                this.markedForRemoval = true;
            }
            return;
        }

        // CAIR
        if (this.y < WATER_LINE - this.size) {
            this.vy += 0.15;
            this.y += this.vy;
        } 
        // BOIAR
        else {
            if (!this.inWater) {
                this.inWater = true;
                this.baseY = WATER_LINE - this.size;
                pollution = Math.min(100, pollution + 10); // Aumentado de 5 para 10
            }
            this.y = this.baseY;
            this.x += 0.2;
            
            // Impedir que saia pelas bordas
            if (this.x < this.size) {
                this.x = this.size;
            }
            if (this.x > canvas.width - this.size) {
                this.x = canvas.width - this.size;
            }
        }

        // Coletar - área de coleta aumentada
        if (!this.collected && this.y >= WATER_LINE - 30 && Math.abs(this.x - personX) < 60) {
            this.collected = true;
            trashBinCount++; // Aumentar contador de lixo coletado
            // NÃO diminui poluição ao coletar - mar não limpa mais
            createCollectionParticles(this.x, this.y);
        }
    }

    draw() {
        if (this.markedForRemoval) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);

        // Desenhar garrafas PET realistas
        switch (this.type) {
            case 0: // Garrafa PET azul clara
                // Corpo da garrafa
                ctx.fillStyle = 'rgba(135, 206, 235, 0.7)';
                ctx.fillRect(-this.size * 0.3, -this.size, this.size * 0.6, this.size * 1.2);
                // Tampa
                ctx.fillStyle = '#0288D1';
                ctx.fillRect(-this.size * 0.25, -this.size * 1.15, this.size * 0.5, this.size * 0.2);
                // Rótulo
                ctx.fillStyle = 'rgba(0, 100, 200, 0.5)';
                ctx.fillRect(-this.size * 0.3, -this.size * 0.5, this.size * 0.6, this.size * 0.3);
                // Brilho
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(-this.size * 0.25, -this.size * 0.9, this.size * 0.15, this.size * 0.6);
                break;
                
            case 1: // Garrafa PET verde (refrigerante)
                // Corpo
                ctx.fillStyle = 'rgba(100, 200, 100, 0.6)';
                ctx.fillRect(-this.size * 0.35, -this.size * 1.1, this.size * 0.7, this.size * 1.3);
                // Tampa vermelha
                ctx.fillStyle = '#D32F2F';
                ctx.fillRect(-this.size * 0.3, -this.size * 1.25, this.size * 0.6, this.size * 0.2);
                // Rótulo
                ctx.fillStyle = 'rgba(200, 50, 50, 0.6)';
                ctx.fillRect(-this.size * 0.35, -this.size * 0.6, this.size * 0.7, this.size * 0.4);
                // Brilho
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-this.size * 0.3, -this.size, this.size * 0.15, this.size * 0.7);
                break;
                
            case 2: // Garrafa PET transparente/branca
                // Corpo
                ctx.fillStyle = 'rgba(240, 240, 240, 0.8)';
                ctx.fillRect(-this.size * 0.3, -this.size * 0.95, this.size * 0.6, this.size * 1.15);
                // Tampa branca
                ctx.fillStyle = '#FAFAFA';
                ctx.fillRect(-this.size * 0.25, -this.size * 1.1, this.size * 0.5, this.size * 0.18);
                // Rótulo azul claro
                ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
                ctx.fillRect(-this.size * 0.3, -this.size * 0.5, this.size * 0.6, this.size * 0.35);
                // Brilho
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fillRect(-this.size * 0.25, -this.size * 0.85, this.size * 0.1, this.size * 0.5);
                break;
                
            case 3: // Garrafa PET laranja (suco)
                // Corpo
                ctx.fillStyle = 'rgba(255, 160, 50, 0.6)';
                ctx.fillRect(-this.size * 0.32, -this.size, this.size * 0.64, this.size * 1.2);
                // Tampa laranja escura
                ctx.fillStyle = '#FF6F00';
                ctx.fillRect(-this.size * 0.28, -this.size * 1.15, this.size * 0.56, this.size * 0.18);
                // Rótulo
                ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
                ctx.fillRect(-this.size * 0.32, -this.size * 0.55, this.size * 0.64, this.size * 0.35);
                // Brilho
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(-this.size * 0.27, -this.size * 0.9, this.size * 0.12, this.size * 0.6);
                break;
        }

        ctx.restore();
    }
}

// Partículas de coleta
function createCollectionParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            size: Math.random() * 4 + 2,
            color: `hsl(${120 + Math.random() * 60}, 80%, 60%)`
        });
    }
}

// Desenhar oceano
function drawOcean() {
    const horizonY = canvas.height * HORIZON_RATIO;
    const waterY = WATER_LINE;
    
    // Gradiente do céu com perspectiva
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, horizonY);

    // Sol no canto superior direito - menor e mais suave
    const sunX = canvas.width - 80;
    const sunY = 80;
    const sunRadius = 25;
    
    // Brilho do sol mais suave
    ctx.globalAlpha = 0.3;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    sunGlow.addColorStop(0, 'rgba(255, 255, 150, 0.3)');
    sunGlow.addColorStop(0.5, 'rgba(255, 220, 100, 0.15)');
    sunGlow.addColorStop(1, 'rgba(255, 220, 100, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sol principal com opacidade reduzida
    ctx.globalAlpha = 0.7;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, '#FFFBF0');
    sunGradient.addColorStop(0.6, '#FFE55C');
    sunGradient.addColorStop(1, '#FFB347');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Reflexo do sol na água (depois desenharemos)

    // Nuvens distantes no horizonte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 4; i++) {
        const cloudX = (Date.now() * 0.005 + i * 250) % (canvas.width + 100);
        const cloudY = horizonY * 0.5 + i * 15;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 20, cloudY, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 40, cloudY, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mar com perspectiva - vista de cima
    const waterGradient = ctx.createLinearGradient(0, horizonY, 0, waterY);
    const pollutionFactor = pollution / 100;
    
    // Cores do mar limpo (vista de cima)
    const cleanHorizon = { r: 20, g: 100, b: 180 };
    const cleanMid = { r: 30, g: 144, b: 255 };
    const cleanNear = { r: 64, g: 164, b: 223 };
    
    // Cores do mar poluído
    const dirtyHorizon = { r: 60, g: 75, b: 65 };
    const dirtyMid = { r: 85, g: 100, b: 85 };
    const dirtyNear = { r: 110, g: 125, b: 105 };
    
    const horizonColor = {
        r: cleanHorizon.r + (dirtyHorizon.r - cleanHorizon.r) * pollutionFactor,
        g: cleanHorizon.g + (dirtyHorizon.g - cleanHorizon.g) * pollutionFactor,
        b: cleanHorizon.b + (dirtyHorizon.b - cleanHorizon.b) * pollutionFactor
    };
    
    const midColor = {
        r: cleanMid.r + (dirtyMid.r - cleanMid.r) * pollutionFactor,
        g: cleanMid.g + (dirtyMid.g - cleanMid.g) * pollutionFactor,
        b: cleanMid.b + (dirtyMid.b - cleanMid.b) * pollutionFactor
    };
    
    const nearColor = {
        r: cleanNear.r + (dirtyNear.r - cleanNear.r) * pollutionFactor,
        g: cleanNear.g + (dirtyNear.g - cleanNear.g) * pollutionFactor,
        b: cleanNear.b + (dirtyNear.b - cleanNear.b) * pollutionFactor
    };
    
    waterGradient.addColorStop(0, `rgb(${horizonColor.r}, ${horizonColor.g}, ${horizonColor.b})`);
    waterGradient.addColorStop(0.5, `rgb(${midColor.r}, ${midColor.g}, ${midColor.b})`);
    waterGradient.addColorStop(1, `rgb(${nearColor.r}, ${nearColor.g}, ${nearColor.b})`);
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, horizonY, canvas.width, waterY - horizonY);

    const time = Date.now() * 0.001;

    // Reflexos de luz no mar
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 5; i++) {
        const lightX = canvas.width * (0.2 + i * 0.15) + Math.sin(time + i) * 30;
        const lightY = horizonY + (waterY - horizonY) * (0.3 + i * 0.15);
        const lightGradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX, lightY, 80 + i * 20
        );
        lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = lightGradient;
        ctx.fillRect(lightX - 100, lightY - 50, 200, 100);
    }
    ctx.globalAlpha = 1;

    // Ondas com perspectiva - menores no horizonte, maiores perto
    ctx.globalAlpha = 0.25;
    waves.forEach((wave, index) => {
        wave.x += wave.speed;
        if (wave.x > canvas.width + 50) wave.x = -50;
        
        // Escala baseada na posição Y (perspectiva)
        const normalizedY = (wave.y - horizonY) / (waterY - horizonY);
        const scale = 0.3 + normalizedY * 0.7;
        const waveY = wave.y + Math.sin(time + index) * 3 * scale;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(wave.x, waveY, wave.radius * scale, wave.radius * scale * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Linha de transição azul onde o mar encontra a areia
    const transitionGradient = ctx.createLinearGradient(0, waterY - 5, 0, waterY + 15);
    transitionGradient.addColorStop(0, `rgba(${nearColor.r}, ${nearColor.g}, ${nearColor.b}, 0.9)`);
    transitionGradient.addColorStop(0.5, `rgba(${nearColor.r + 20}, ${nearColor.g + 20}, ${nearColor.b}, 0.7)`);
    transitionGradient.addColorStop(1, `rgba(${nearColor.r + 40}, ${nearColor.g + 40}, ${nearColor.b}, 0.3)`);
    ctx.fillStyle = transitionGradient;
    ctx.fillRect(0, waterY - 5, canvas.width, 20);
}

// Desenhar ondas sobre a areia
function drawWavesOnBeach() {
    const waterY = WATER_LINE;
    const time = Date.now() * 0.001;
    
    // Calcular cor da onda baseada na poluição
    const pollutionFactor = pollution / 100;
    
    // 3 ondas com diferentes velocidades e alcances - cores mudam com poluição
    const wavesData = [
        { speed: 2.0, offset: 0, maxReach: 60, cleanColor: { r: 30, g: 144, b: 255 }, dirtyColor: { r: 80, g: 100, b: 80 } },
        { speed: 1.5, offset: 2, maxReach: 45, cleanColor: { r: 50, g: 160, b: 255 }, dirtyColor: { r: 90, g: 110, b: 85 } },
        { speed: 1.0, offset: 4, maxReach: 30, cleanColor: { r: 70, g: 180, b: 255 }, dirtyColor: { r: 100, g: 120, b: 90 } }
    ];
    
    wavesData.forEach((waveData, index) => {
        const wavePhase = time * waveData.speed + waveData.offset;
        const waveProgress = (Math.sin(wavePhase) + 1) / 2; // 0 a 1
        const currentReach = waveProgress * waveData.maxReach;
        
        // Interpolar cor baseada na poluição
        const c = {
            r: Math.round(waveData.cleanColor.r + (waveData.dirtyColor.r - waveData.cleanColor.r) * pollutionFactor),
            g: Math.round(waveData.cleanColor.g + (waveData.dirtyColor.g - waveData.cleanColor.g) * pollutionFactor),
            b: Math.round(waveData.cleanColor.b + (waveData.dirtyColor.b - waveData.cleanColor.b) * pollutionFactor)
        };
        
        // Desenhar a onda avançando
        ctx.beginPath();
        ctx.moveTo(0, waterY);
        
        for (let x = 0; x <= canvas.width; x += 5) {
            const localWave = Math.sin(x * 0.015 + wavePhase * 2) * 8;
            const y = waterY + currentReach + localWave * waveProgress;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, waterY);
        ctx.closePath();
        
        // Gradiente da onda com cor poluída
        const waveGradient = ctx.createLinearGradient(0, waterY, 0, waterY + currentReach + 10);
        waveGradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.6 + waveProgress * 0.2})`);
        waveGradient.addColorStop(0.5, `rgba(${c.r + 20}, ${c.g + 20}, ${c.b}, ${0.4 + waveProgress * 0.2})`);
        waveGradient.addColorStop(1, `rgba(${c.r + 40}, ${c.g + 40}, ${c.b + 20}, 0)`);
        ctx.fillStyle = waveGradient;
        ctx.fill();
    });
    
    // Areia molhada onde a água passou
    const maxWetArea = 70;
    const wetGradient = ctx.createLinearGradient(0, waterY, 0, waterY + maxWetArea);
    wetGradient.addColorStop(0, 'rgba(160, 130, 90, 0.4)');
    wetGradient.addColorStop(0.5, 'rgba(160, 130, 90, 0.2)');
    wetGradient.addColorStop(1, 'rgba(160, 130, 90, 0)');
    ctx.fillStyle = wetGradient;
    ctx.fillRect(0, waterY, canvas.width, maxWetArea);
}

// Desenhar terra
function drawEarth() {
    const earthY = WATER_LINE;
    const beachHeight = canvas.height - earthY;
    
    // Gradiente principal da areia - tons mais realistas
    const beachGradient = ctx.createLinearGradient(0, earthY, 0, canvas.height);
    beachGradient.addColorStop(0, '#F5E6D3');
    beachGradient.addColorStop(0.3, '#E8D4B8');
    beachGradient.addColorStop(0.7, '#D4C4A0');
    beachGradient.addColorStop(1, '#C9B896');
    ctx.fillStyle = beachGradient;
    
    // Desenhar areia com borda ondulada
    ctx.beginPath();
    ctx.moveTo(0, earthY);
    for (let x = 0; x < canvas.width; x += 8) {
        const y = earthY + Math.sin(x * 0.06) * 3 + Math.sin(x * 0.02) * 2;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Sombra suave na transição com a água
    const shadowGradient = ctx.createLinearGradient(0, earthY, 0, earthY + 25);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, earthY, canvas.width, 25);
    
    // Algumas linhas sutis (marcas na areia)
    ctx.strokeStyle = 'rgba(180, 160, 130, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const startY = earthY + (beachHeight / 10) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(0, startY);
        for (let x = 0; x < canvas.width; x += 15) {
            const y = startY + Math.sin(x * 0.03 + i) * 2;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

// Desenhar pessoa
function drawPerson() {
    // Movimento da pessoa
    personX += personSpeed * personDirection;
    if (personX > canvas.width - 50 || personX < 50) {
        personDirection *= -1;
    }

    const personY = WATER_LINE - 10;
    const bounce = Math.sin(Date.now() * 0.005) * 2;

    ctx.save();
    ctx.translate(personX, personY + bounce);
    
    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 35, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (personDirection < 0) {
        ctx.scale(-1, 1);
    }

    // Pernas com calça detalhada
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    
    const legSwing = Math.sin(Date.now() * 0.008) * 10;
    
    // Perna esquerda
    ctx.beginPath();
    ctx.moveTo(-5, 15);
    ctx.lineTo(-7 + legSwing * 0.5, 30);
    ctx.stroke();
    
    // Sapato esquerdo
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.ellipse(-7 + legSwing * 0.5, 32, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Perna direita
    ctx.beginPath();
    ctx.moveTo(5, 15);
    ctx.lineTo(7 - legSwing * 0.5, 30);
    ctx.stroke();
    
    // Sapato direito
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.ellipse(7 - legSwing * 0.5, 32, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo com camisa detalhada
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Gola da camisa
    ctx.fillStyle = '#1976D2';
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.lineTo(0, -15);
    ctx.lineTo(8, -18);
    ctx.lineTo(8, -10);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();
    
    // Botões da camisa
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, -5 + i * 8, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Braço esquerdo segurando sacola
    ctx.strokeStyle = '#FFCC99';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    // Ombro ao cotovelo
    ctx.beginPath();
    ctx.moveTo(-13, -8);
    ctx.lineTo(-20, 2);
    ctx.stroke();
    
    // Cotovelo à mão
    ctx.beginPath();
    ctx.moveTo(-20, 2);
    ctx.lineTo(-18, 15);
    ctx.stroke();
    
    // Mão esquerda
    ctx.fillStyle = '#FFCC99';
    ctx.beginPath();
    ctx.ellipse(-18, 15, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sacola de coleta na mão esquerda
    const bagSwing = Math.sin(Date.now() * 0.008) * 3;
    ctx.fillStyle = '#8BC34A';
    ctx.strokeStyle = '#689F38';
    ctx.lineWidth = 2.5;
    
    // Corpo da sacola
    ctx.beginPath();
    ctx.moveTo(-18, 18 + bagSwing);
    ctx.lineTo(-28, 20 + bagSwing);
    ctx.lineTo(-28, 38 + bagSwing);
    ctx.quadraticCurveTo(-23, 42 + bagSwing, -18, 38 + bagSwing);
    ctx.quadraticCurveTo(-13, 42 + bagSwing, -8, 38 + bagSwing);
    ctx.lineTo(-8, 20 + bagSwing);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Alça da sacola
    ctx.strokeStyle = '#689F38';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-18, 20 + bagSwing, 8, Math.PI, Math.PI * 2);
    ctx.stroke();
    
    // Símbolo de reciclagem na sacola
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'transparent';
    
    // Círculo base do símbolo
    ctx.beginPath();
    ctx.arc(-18, 28 + bagSwing, 6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Setas de reciclagem
    for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
        const x = -18 + Math.cos(angle) * 5;
        const y = 28 + bagSwing + Math.sin(angle) * 5;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        const arrowAngle = angle + Math.PI / 3;
        ctx.lineTo(x + Math.cos(arrowAngle) * 4, y + Math.sin(arrowAngle) * 4);
        ctx.stroke();
    }

    // Braço direito coletando
    ctx.strokeStyle = '#FFCC99';
    ctx.lineWidth = 6;
    
    const armSwing = Math.sin(Date.now() * 0.01) * 5;
    ctx.beginPath();
    ctx.moveTo(13, -5);
    ctx.lineTo(22, 5 + armSwing);
    ctx.stroke();
    
    // Mão direita
    ctx.fillStyle = '#FFCC99';
    ctx.beginPath();
    ctx.ellipse(22, 5 + armSwing, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Dedos na mão direita
    ctx.fillStyle = '#E6B88A';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(22 + i * 2 - 2, 3 + armSwing, 1.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cabeça com pescoço
    ctx.fillStyle = '#FFCC99';
    
    // Pescoço
    ctx.fillRect(-4, -18, 8, 5);
    
    // Cabeça
    ctx.beginPath();
    ctx.arc(0, -26, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Orelhas
    ctx.beginPath();
    ctx.arc(-11, -26, 3, 0, Math.PI * 2);
    ctx.arc(11, -26, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Cabelo simples e clean
    ctx.fillStyle = '#5D4037';
    
    // Cabelo arredondado cobrindo o topo da cabeça
    ctx.beginPath();
    ctx.arc(0, -30, 13, Math.PI, Math.PI * 2);
    ctx.fill();
    
    // Laterais do cabelo
    ctx.beginPath();
    ctx.moveTo(-13, -30);
    ctx.lineTo(-13, -25);
    ctx.quadraticCurveTo(-12, -22, -11, -22);
    ctx.lineTo(-11, -30);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(13, -30);
    ctx.lineTo(13, -25);
    ctx.quadraticCurveTo(12, -22, 11, -22);
    ctx.lineTo(11, -30);
    ctx.closePath();
    ctx.fill();
    
    // Sobrancelhas
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, -29);
    ctx.lineTo(-3, -30);
    ctx.moveTo(3, -30);
    ctx.lineTo(7, -29);
    ctx.stroke();
    
    // Olhos mais realistas
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(-5, -26, 3, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -26, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Íris
    ctx.fillStyle = '#4E342E';
    ctx.beginPath();
    ctx.arc(-5, -26, 2, 0, Math.PI * 2);
    ctx.arc(5, -26, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-5, -26, 1, 0, Math.PI * 2);
    ctx.arc(5, -26, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho nos olhos
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-4.5, -26.5, 0.5, 0, Math.PI * 2);
    ctx.arc(5.5, -26.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Nariz
    ctx.strokeStyle = '#E6B88A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(-1, -21);
    ctx.stroke();
    
    // Expressão facial baseada na poluição
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    if (pollution > 50) {
        // Muito triste - boca para baixo pronunciada
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0.3, Math.PI - 0.3, true);
        ctx.stroke();
        
        // Sobrancelhas tristes (inclinadas para baixo no meio)
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-8, -28);
        ctx.lineTo(-3, -30);
        ctx.moveTo(3, -30);
        ctx.lineTo(8, -28);
        ctx.stroke();
        
        // Lágrima
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.ellipse(-7, -23, 1.5, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (pollution > 20) {
        // Levemente triste - boca reta/neutro
        ctx.beginPath();
        ctx.moveTo(-5, -20);
        ctx.lineTo(5, -20);
        ctx.stroke();
        
        // Sobrancelhas levemente preocupadas
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -29.5);
        ctx.lineTo(-3, -30);
        ctx.moveTo(3, -30);
        ctx.lineTo(7, -29.5);
        ctx.stroke();
        
    } else {
        // Feliz - sorriso
        ctx.beginPath();
        ctx.arc(0, -22, 6, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    ctx.restore();
}

// Desenhar caranguejo
function drawCrab() {
    // Movimento do caranguejo
    crabX += 0.4 * crabDirection;
    crabLegPhase += 0.15;
    
    // Inverter direção nas bordas
    if (crabX > canvas.width - 50 || crabX < 50) {
        crabDirection *= -1;
    }
    
    const crabY = canvas.height - 35;
    const size = 18;
    
    ctx.save();
    ctx.translate(crabX, crabY);
    
    // Espelhar se andando para a esquerda
    if (crabDirection < 0) {
        ctx.scale(-1, 1);
    }
    
    // Pernas traseiras (4 pares) - mais finas e articuladas
    ctx.strokeStyle = '#C1121F';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 4; i++) {
        const legBaseX = -size * 0.8 + (i * size * 0.5);
        const legWave = Math.sin(crabLegPhase + i * 0.8) * 4;
        
        // Segmento 1 da perna
        ctx.beginPath();
        ctx.moveTo(legBaseX, -size * 0.2);
        const midX = legBaseX + (i < 2 ? -8 : 8);
        const midY = size * 0.3 + legWave;
        ctx.lineTo(midX, midY);
        
        // Segmento 2 da perna
        ctx.lineTo(midX + (i < 2 ? -6 : 6), size * 0.7 + legWave * 0.5);
        ctx.stroke();
    }
    
    // Corpo principal - mais fino e achatado
    ctx.fillStyle = '#E63946';
    
    // Corpo oval largo e achatado (carapaça)
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.3, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno da carapaça
    ctx.strokeStyle = '#C1121F';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pequenas saliências nas laterais (espinhos)
    ctx.fillStyle = '#D62828';
    for (let i = 0; i < 3; i++) {
        const angle = Math.PI * 0.3 + (i * Math.PI * 0.2);
        // Lado esquerdo
        const spX1 = Math.cos(angle) * size * 1.25;
        const spY1 = Math.sin(angle) * size * 0.55;
        ctx.beginPath();
        ctx.arc(spX1, spY1, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Lado direito (espelhado)
        ctx.beginPath();
        ctx.arc(-spX1, spY1, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Pedúnculos dos olhos (hastes)
    ctx.fillStyle = '#D62828';
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, -size * 0.5, size * 0.12, size * 0.25, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.4, -size * 0.5, size * 0.12, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Olhos nas pontas das hastes
    ctx.fillStyle = '#2D2D2D';
    ctx.beginPath();
    ctx.arc(-size * 0.4, -size * 0.7, size * 0.18, 0, Math.PI * 2);
    ctx.arc(size * 0.4, -size * 0.7, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    
    // Brilho nos olhos
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-size * 0.35, -size * 0.75, size * 0.08, 0, Math.PI * 2);
    ctx.arc(size * 0.35, -size * 0.75, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Pinças grandes e realistas
    const clawWave = Math.sin(crabLegPhase * 0.5) * 0.15;
    
    // Braço da pinça esquerda
    ctx.fillStyle = '#D62828';
    ctx.save();
    ctx.translate(-size * 0.9, -size * 0.1);
    ctx.rotate(-0.3 + clawWave);
    
    // Braço
    ctx.fillRect(-size * 0.6, -size * 0.15, size * 0.7, size * 0.3);
    
    // Pinça base
    ctx.beginPath();
    ctx.ellipse(-size * 0.7, 0, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Garra superior
    ctx.fillStyle = '#C1121F';
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, -size * 0.2);
    ctx.lineTo(-size * 1.3, -size * 0.4);
    ctx.lineTo(-size * 1.2, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Garra inferior
    ctx.beginPath();
    ctx.moveTo(-size * 0.9, size * 0.2);
    ctx.lineTo(-size * 1.3, size * 0.3);
    ctx.lineTo(-size * 1.2, size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Braço da pinça direita
    ctx.save();
    ctx.translate(size * 0.9, -size * 0.1);
    ctx.rotate(0.3 - clawWave);
    
    ctx.fillStyle = '#D62828';
    ctx.fillRect(-size * 0.1, -size * 0.15, size * 0.7, size * 0.3);
    
    // Pinça base
    ctx.beginPath();
    ctx.ellipse(size * 0.7, 0, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Garra superior
    ctx.fillStyle = '#C1121F';
    ctx.beginPath();
    ctx.moveTo(size * 0.9, -size * 0.2);
    ctx.lineTo(size * 1.3, -size * 0.4);
    ctx.lineTo(size * 1.2, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Garra inferior
    ctx.beginPath();
    ctx.moveTo(size * 0.9, size * 0.2);
    ctx.lineTo(size * 1.3, size * 0.3);
    ctx.lineTo(size * 1.2, size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    ctx.restore();
}

// Desenhar partículas
function drawParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) return false;
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        return true;
    });
}

// Desenhar lixeira de plástico
function drawTrashBin() {
    const binX = 80; // Canto esquerdo
    const binY = canvas.height - 90;
    const binWidth = 50;
    const binHeight = 70;
    
    ctx.save();
    
    // Corpo da lixeira (plástico azul)
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(binX - binWidth / 2, binY, binWidth, binHeight);
    
    // Tampa da lixeira
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(binX - binWidth / 2 - 3, binY - 8, binWidth + 6, 10);
    
    // Borda arredondada da tampa
    ctx.beginPath();
    ctx.ellipse(binX, binY - 8, binWidth / 2 + 3, 5, 0, Math.PI, 0, true);
    ctx.fill();
    
    // Desenhar garrafas dentro da lixeira
    const maxBottles = 15; // Capacidade máxima
    const bottlesToDraw = Math.min(trashBinCount, maxBottles);
    const fillLevel = bottlesToDraw / maxBottles;
    
    // Desenhar garrafas empilhadas
    ctx.save();
    ctx.beginPath();
    ctx.rect(binX - binWidth / 2 + 2, binY + 2, binWidth - 4, binHeight - 4);
    ctx.clip();
    
    for (let i = 0; i < bottlesToDraw; i++) {
        const bottleX = binX - binWidth / 2 + 10 + (i % 3) * 10;
        const bottleY = binY + binHeight - 10 - Math.floor(i / 3) * 15;
        const bottleSize = 12;
        
        // Garrafa PET pequena
        ctx.fillStyle = ['#4FC3F7', '#81C784', '#FFB74D'][i % 3];
        ctx.fillRect(bottleX - bottleSize / 2, bottleY - bottleSize, bottleSize / 2, bottleSize * 1.2);
        
        // Tampa
        ctx.fillStyle = ['#0288D1', '#4CAF50', '#FF9800'][i % 3];
        ctx.fillRect(bottleX - bottleSize / 2, bottleY - bottleSize - 2, bottleSize / 2, 2);
    }
    
    ctx.restore();
    
    // Garrafas transbordando (se ultrapassar a capacidade)
    if (trashBinCount > maxBottles) {
        const overflowCount = Math.min(trashBinCount - maxBottles, 8);
        
        for (let i = 0; i < overflowCount; i++) {
            const bottleX = binX - 15 + (i % 4) * 10;
            const bottleY = binY - 15 - Math.floor(i / 4) * 18;
            const bottleSize = 14;
            
            // Garrafas caindo para fora
            ctx.fillStyle = ['#4FC3F7', '#81C784', '#FFB74D', '#EF5350'][i % 4];
            ctx.save();
            ctx.translate(bottleX, bottleY);
            ctx.rotate((i * 0.3));
            ctx.fillRect(-bottleSize / 2, -bottleSize, bottleSize / 2, bottleSize * 1.3);
            // Tampa
            ctx.fillStyle = ['#0288D1', '#4CAF50', '#FF9800', '#D32F2F'][i % 4];
            ctx.fillRect(-bottleSize / 2, -bottleSize - 2, bottleSize / 2, 2);
            ctx.restore();
        }
    }
    
    // Brilho no plástico
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(binX - binWidth / 2 + 5, binY + 5, 8, binHeight - 15);
    
    // Sombra da lixeira
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(binX, binY + binHeight + 2, binWidth / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Adicionar lixo
function addTrash(x, y) {
    trash.push(new Trash(x, y));
}

// Adicionar peixe morto quando poluição é alta
function spawnDeadFish() {
    if (pollution > 40 && deadFish.length < 3 && Math.random() < 0.02) { // Máximo 3 peixes
        const horizonY = canvas.height * HORIZON_RATIO;
        deadFish.push({
            x: Math.random() * canvas.width,
            y: horizonY + Math.random() * (WATER_LINE - horizonY),
            size: Math.random() * 15 + 10,
            rotation: Math.random() * Math.PI * 2,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: Math.random() * 0.02 + 0.01,
            driftSpeed: Math.random() * 0.1 + 0.05
        });
    }
}

// Desenhar peixes mortos
function drawDeadFish() {
    const horizonY = canvas.height * HORIZON_RATIO;
    
    deadFish.forEach(fish => {
        // Movimento de deriva reduzido
        fish.x += fish.driftSpeed * 0.3; // Reduzido para 30%
        fish.floatOffset += fish.floatSpeed * 0.2; // Reduzido para 20% - mais lento
        
        // Movimento vertical muito suave
        const floatMovement = Math.sin(fish.floatOffset) * 0.2; // Amplitude reduzida
        fish.y += floatMovement;
        
        // Limitar para não subir acima do horizonte
        if (fish.y < horizonY + fish.size) {
            fish.y = horizonY + fish.size;
        }
        
        // Limitar para não descer abaixo da linha d'água
        if (fish.y > WATER_LINE - fish.size) {
            fish.y = WATER_LINE - fish.size;
        }
        
        fish.rotation += 0.002; // Rotação mais lenta
        
        // Remover se sair da tela
        if (fish.x > canvas.width + 50) {
            fish.x = -50;
        }
        
        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.rotate(fish.rotation);
        ctx.globalAlpha = 0.8;
        
        // Corpo do peixe morto
        ctx.fillStyle = '#B0B0B0';
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cauda
        ctx.beginPath();
        ctx.moveTo(fish.size * 0.7, 0);
        ctx.lineTo(fish.size * 1.2, -fish.size * 0.3);
        ctx.lineTo(fish.size * 1.2, fish.size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Olho X (morto)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-fish.size * 0.5, -fish.size * 0.1);
        ctx.lineTo(-fish.size * 0.3, fish.size * 0.1);
        ctx.moveTo(-fish.size * 0.5, fish.size * 0.1);
        ctx.lineTo(-fish.size * 0.3, -fish.size * 0.1);
        ctx.stroke();
        
        ctx.restore();
    });
}

// Desenhar instruções
function drawInstructions() {
    if (!showInstructions && instructionOpacity <= 0) return;
    
    // Fade in (aparecer)
    if (showInstructions && instructionOpacity < 1) {
        instructionOpacity += 0.02; // Velocidade do fade in
        if (instructionOpacity > 1) instructionOpacity = 1;
    }
    
    // Fade out (desaparecer)
    if (!showInstructions && instructionOpacity > 0) {
        instructionOpacity -= 0.03; // Velocidade do fade out
        if (instructionOpacity < 0) instructionOpacity = 0;
    }
    
    const text = 'Clique na tela para jogar lixo';
    const fontSize = Math.min(32, canvas.width / 15);
    ctx.font = `bold ${fontSize}px 'Montserrat', 'Segoe UI', Arial, sans-serif`;
    
    // Desenhar texto com opacidade
    ctx.fillStyle = `rgba(255, 255, 255, ${instructionOpacity * 0.95})`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${instructionOpacity * 0.7})`;
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sombra suave
    ctx.shadowColor = `rgba(0, 0, 0, ${instructionOpacity * 0.5})`;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // Desenhar contorno do texto
    ctx.strokeText(text, canvas.width / 2, 60);
    // Desenhar texto preenchido
    ctx.fillText(text, canvas.width / 2, 60);
    
    // Resetar sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Toque na tela para adicionar lixo
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Só permite jogar lixo na área do mar (acima da linha da água)
    if (y < WATER_LINE) {
        addTrash(x, y);
        showInstructions = false; // Esconder instruções após primeiro clique
    }
});

// Toque mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Só permite jogar lixo na área do mar (acima da linha da água)
    if (y < WATER_LINE) {
        addTrash(x, y);
        showInstructions = false; // Esconder instruções após primeiro toque
    }
});

// Loop de animação - SIMPLIFICADO
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawOcean();
    drawEarth();
    drawCrab(); // Caranguejo na areia
    drawTrashBin(); // Lixeira de plástico
    drawWavesOnBeach();
    
    // Spawnar e desenhar peixes mortos quando há poluição
    if (pollution > 40) {
        spawnDeadFish();
        drawDeadFish();
    }
    
    // Atualizar todo o lixo primeiro
    trash.forEach(t => t.update());
    
    // Desenhar o lixo que não foi marcado para remoção
    trash.forEach(t => t.draw());
    
    // Limpar lixo marcado para remoção
    trash = trash.filter(t => !t.markedForRemoval);
    
    drawPerson();
    drawParticles();
    
    // Desenhar instruções por último (acima de tudo)
    drawInstructions();
    
    requestAnimationFrame(animate);
}

// Iniciar
animate();

// Quiz functionality
let quizScore = 0;
let questionsAnswered = 0;
const totalQuestions = 5;

document.querySelectorAll('.option').forEach(button => {
    button.addEventListener('click', function() {
        const card = this.closest('.question-card');
        const options = card.querySelectorAll('.option');
        const feedback = card.querySelector('.feedback');
        const isCorrect = this.dataset.correct === 'true';
        
        // Desabilitar todos os botões da pergunta
        options.forEach(opt => opt.disabled = true);
        
        // Marcar resposta correta e incorreta
        if (isCorrect) {
            this.classList.add('correct');
            feedback.textContent = '✓ Correto! Muito bem!';
            feedback.className = 'feedback show correct';
            quizScore++;
        } else {
            this.classList.add('wrong');
            // Mostrar qual era a correta
            options.forEach(opt => {
                if (opt.dataset.correct === 'true') {
                    opt.classList.add('correct');
                }
            });
            feedback.textContent = '✗ Incorreto. Veja a resposta correta destacada.';
            feedback.className = 'feedback show wrong';
        }
        
        questionsAnswered++;
        
        // Mostrar resultado final quando todas as perguntas forem respondidas
        if (questionsAnswered === totalQuestions) {
            setTimeout(showResult, 1000);
        }
    });
});

function showResult() {
    const resultSection = document.querySelector('.quiz-result');
    const scoreSpan = document.getElementById('score');
    const messageP = document.getElementById('result-message');
    
    scoreSpan.textContent = quizScore;
    
    if (quizScore === 5) {
        messageP.textContent = '🎉 Perfeito! Você é um expert em plásticos sustentáveis!';
    } else if (quizScore >= 3) {
        messageP.textContent = '👏 Muito bom! Você entende bem sobre o assunto!';
    } else {
        messageP.textContent = '📚 Continue aprendendo! Revise a tabela acima.';
    }
    
    resultSection.classList.add('show');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('reset-quiz').addEventListener('click', function() {
    // Resetar pontuação
    quizScore = 0;
    questionsAnswered = 0;
    
    // Resetar todas as perguntas
    document.querySelectorAll('.question-card').forEach(card => {
        const options = card.querySelectorAll('.option');
        const feedback = card.querySelector('.feedback');
        
        options.forEach(opt => {
            opt.disabled = false;
            opt.classList.remove('correct', 'wrong');
        });
        
        feedback.className = 'feedback';
        feedback.textContent = '';
    });
    
    // Esconder resultado
    document.querySelector('.quiz-result').classList.remove('show');
    
    // Scroll para o início do quiz
    document.getElementById('quiz-section').scrollIntoView({ behavior: 'smooth' });
});
