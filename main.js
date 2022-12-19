const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global variables
const startButton = document.getElementById('startButton');
const cellSize = 100;
const cellGap = 3;
let enemiesInterval = 550;
let numberOfResources = 300;
let frame = 0;
let gameOver = false;
let score = 0;
let chosenDefender = 1;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];
const floatingMessages = [];
const pathArray = [];
const winningScore = 500;

// Audio files
const bgMusic = new Audio();
bgMusic.src = 'assets/sound/bg_music01.mp3';
bgMusic.loop = true;
const winningMusic = new Audio();
winningMusic.src = 'assets/sound/victory.mp3';
winningMusic.loop = true;
const losingMusic = new Audio();
losingMusic.src = 'assets/sound/lose_music.ogg';
losingMusic.loop = true;
const losingScream = new Audio();
losingScream.src = 'assets/sound/lose_scream.wav';
const coinPickup = new Audio();
coinPickup.src = 'assets/sound/coin01.ogg';
const enemyEating = new Audio();
enemyEating.src = 'assets/sound/crunch_bug.ogg';
enemyEating.loop = true;
const death1 = new Audio();
death1.src = 'assets/sound/death01.ogg';
const death2 = new Audio();
death2.src = 'assets/sound/death02.ogg';
const death3 = new Audio();
death3.src = 'assets/sound/death03.ogg';
const shootProjectileStrong = new Audio();
shootProjectileStrong.src = 'assets/sound/projectile_strong.mp3';
const shootProjectileWeak = new Audio();
shootProjectileWeak.src = 'assets/sound/projectile_weak.mp3';

// Mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
    clicked: false,
}
canvas.addEventListener('mousedown', function () {
    mouse.clicked = true;
});
canvas.addEventListener('mouseup', function () {
    mouse.clicked = false;
});

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', e => {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', e => {
    mouse.x = undefined;
    mouse.y = undefined;
});

// Game board
const controlbar = {
    width: canvas.width,
    height: cellSize,
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if (mouse.x && mouse.y && collisionDetection(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = cellSize * 2; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
};
createGrid();

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
};

// Background
const mill = new Image();
mill.src = 'assets/img/bg/ROUND-BASE.png';
const sail = new Image();
sail.src = 'assets/img/bg/ROTATINGSAIL-OUTLINED.png';
const path = new Image();
path.src = 'assets/img/bg/brick_lane.png';

class Mill {
    constructor() {
        this.x = 0;
        this.y = 175;
        this.image = mill;
        this.width = 883;
        this.height = 1080;
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width * 0.22, this.height * 0.22);
    }
}

class Sail {
    constructor() {
        this.x = -5;
        this.y = 150;
        this.spriteWidth = 1150;
        this.spriteHeight = 1150;
        this.frame = 0;
        this.minFrame = 0;
        this.maxFrame = 8;
        this.fps = 30;
        this.image = sail;
    }
    update() {
        if (frame % this.fps === 0) {
            if (this.frame < this.maxFrame) {
                this.frame++;
            } else this.frame = this.minFrame;
        }
    }
    draw() {
        ctx.drawImage(this.image, this.spriteWidth * this.frame, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth * 0.175, this.spriteHeight * 0.175);
    }
}

class Path {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 1492;
        this.height = 236;
        this.image = path;
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width * 0.5, this.height * 0.25);
    }
}

function createPaths() {
    for (let y = 145; y < canvas.height; y += cellSize) {
        pathArray.push(new Path(200, y));
    };
}
createPaths();

const millObj = new Mill();
const sailObj = new Sail();

function handleBackground() {
    millObj.draw();
    sailObj.update();
    sailObj.draw();
    for (let j = 0; j < pathArray.length; j++) {
        pathArray[j].draw();
    };
}

// Projectiles
const projectileWeak = new Image();
projectileWeak.src = 'assets/img/others/projectile1.png';
const projectileStrong = new Image();
projectileStrong.src = 'assets/img/others/projectile2.png';

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class WeakerProjectile extends Projectile {
    constructor(x, y) {
        super(x, y);
        this.power = 15;
        this.speed = 6;
        this.image = projectileWeak;
    }
}

class StrongerProjectile extends Projectile {
    constructor(x, y) {
        super(x, y);
        this.power = 50;
        this.speed = 4;
        this.width = 30;
        this.height = 30;
        this.image = projectileStrong;
    }
}

function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();
        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j] && projectiles[i] && collisionDetection(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// Defenders
const defender1 = new Image();
defender1.src = 'assets/img/defenders/afro_mushroom.png';
const defender2 = new Image();
defender2.src = 'assets/img/defenders/bug_cute.png';

class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hpTextX = x + 15;
        this.hpTextY = y + 22;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.shooting = false;
        this.shootNow = false;
        this.shootingFrame = 3;
        this.fps = 18;
        this.chosenDefender = chosenDefender;
        this.deathSound = death3;
    }
    draw() {
        // Debugging
        // ctx.fillStyle = 'blue';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.hpTextX, this.hpTextY);
    }
    update() {
        if (frame % this.fps === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
            if (this.frameX === this.shootingFrame) this.shootNow = true;
        }
        if (this.shooting && this.shootNow) {
            if (this.chosenDefender === 1) {
                projectiles.push(new WeakerProjectile(this.x + 40, this.y + 77));
                shootProjectileWeak.currentTime = 0;
                shootProjectileWeak.play();
            } else if (this.chosenDefender === 2) {
                projectiles.push(new StrongerProjectile(this.x + 70, this.y + 50));
                shootProjectileStrong.currentTime = 0;
                shootProjectileStrong.play();
            }
            this.shootNow = false;
        }
    }
}

class AfroShroom extends Defender {
    constructor(x, y) {
        super(x, y);
        this.spriteWidth = 503;
        this.spriteHeight = 513;
        this.cost = 85;
        this.image = defender1;
        this.fps = 19;
    }
    draw() {
        super.draw();
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x + 5, this.y + 17, this.spriteWidth * 0.16, this.spriteHeight * 0.16);
    }
}

class CuteBug extends Defender {
    constructor(x, y) {
        super(x, y);
        this.spriteWidth = 255;
        this.spriteHeight = 209;
        this.maxFrame = 14;
        this.cost = 150;
        this.image = defender2;
        this.fps = 15;
    }
    draw() {
        super.draw();
        ctx.drawImage(defender2, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x - 16, this.y + 10, this.spriteWidth * 0.45, this.spriteHeight * 0.45);
    }
}

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();
        if (enemyPositions.indexOf(defenders[i].y) !== -1) {
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && collisionDetection(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= enemies[j].damage;
                enemyEating.play();
            }
            if (defenders[i] && defenders[i].health <= 0) {
                enemyEating.pause();
                enemyEating.currentTime = 0;
                defenders[i].deathSound.play();
                defenders.splice(i, 1);
                i--;
                enemies.forEach(enemy => {
                    if (enemy.y === enemies[j].y) {
                        enemy.movement = enemy.speed;
                    }
                });
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
};

// Creating defender choosing cards
const card1 = {
    x: 10,
    y: 5,
    width: 70,
    height: 90,
};

const card2 = {
    x: 90,
    y: 5,
    width: 70,
    height: 90,
};

function chooseDefender() {
    let card1Border = 'black';
    let card2Border = 'black';
    if (collisionDetection(mouse, card1) && mouse.clicked) {
        chosenDefender = 1;
    } else if (collisionDetection(mouse, card2) && mouse.clicked) {
        chosenDefender = 2;
    }
    if (chosenDefender === 1) {
        card1Border = 'gold';
        card2Border = 'black';
    } else if (chosenDefender === 2) {
        card1Border = 'black';
        card2Border = 'gold';
    } else {
        card1Border = 'black';
        card2Border = 'black';
    }

    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
    ctx.fillStyle = card1Border;
    ctx.strokeStyle = card1Border;
    ctx.font = '22px Orbitron';
    ctx.fillText('85', 22, 23);
    ctx.drawImage(defender1, 0, 0, 503, 513, 7, 22, 503 * 0.15, 513 * 0.15);
    ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
    ctx.fillStyle = card2Border;
    ctx.strokeStyle = card2Border;
    ctx.font = '22px Orbitron';
    ctx.fillText('150', 98, 23);
    ctx.drawImage(defender2, 0, 0, 255, 209, 85, 32, 255 * 0.3, 209 * 0.3);
    ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
}

// Floating messages
class FloatingMessage {
    constructor(value, x, y, size, color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }
    update() {
        this.y -= 0.3;
        this.lifeSpan += 1;
        if (this.opacity > 0.03) this.opacity -= 0.03;
    }
    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Orbitron';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

function handleFloatingMessages() {
    for (let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if (floatingMessages[i].lifeSpan >= 50) {
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}

// Enemies
const enemy1 = new Image();
enemy1.src = 'assets/img/enemies/angry_carrott.png';
const enemy2 = new Image();
enemy2.src = 'assets/img/enemies/bug_walking.png';
const enemy3 = new Image();
enemy3.src = 'assets/img/enemies/grass_monster_walking.png';

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.hpTextX = canvas.width + 15;
        this.hpTextY = verticalPosition + 23;
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 5;
        this.deathSound = death2;
    }
    update() {
        this.x -= this.movement;
        this.hpTextX -= this.movement;
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw() {
        // Debugging
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.hpTextX, this.hpTextY);
    }
}

// Easy
class Carrott extends Enemy {
    constructor(verticalPosition) {
        super(verticalPosition);
        this.speed = Math.random() * 0.2 + 0.6;
        this.movement = this.speed;
        this.health = 75;
        this.maxHealth = this.health;
        this.spriteWidth = 608;
        this.spriteHeight = 592;
        this.image = enemy1;
        this.damage = 0.1;
        this.deathSound = death1;
    }
    draw() {
        super.draw();
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x + 10, this.y + 20, this.spriteWidth * 0.14, this.spriteHeight * 0.14);
    }
}

// Medium
class GrassMonster extends Enemy {
    constructor(verticalPosition) {
        super(verticalPosition);
        this.speed = Math.random() * 0.2 + 0.24;
        this.movement = this.speed;
        this.health = 150;
        this.maxHealth = this.health;
        this.spriteWidth = 948;
        this.spriteHeight = 823;
        this.image = enemy3;
        this.maxFrame = 12;
        this.damage = 0.2;
    }
    draw() {
        super.draw();
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x - 5, this.y + 10, this.spriteWidth * 0.11, this.spriteHeight * 0.11);
    }
}

// Tough
class Bug extends Enemy {
    constructor(verticalPosition) {
        super(verticalPosition);
        this.speed = Math.random() * 0.2 + 0.08;
        this.movement = this.speed;
        this.health = 350;
        this.maxHealth = this.health;
        this.spriteWidth = 1216;
        this.spriteHeight = 789;
        this.image = enemy2;
        this.maxFrame = 20;
        this.damage = 0.5;
    }
    draw() {
        super.draw();
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x - 5, this.y + 15, this.spriteWidth * 0.12, this.spriteHeight * 0.12);
    }
}

function handleEnemies() {
    let enemyType = Math.random();
    let carrottProbability = 0.55;
    let grassMonsterProbability = 0.85;
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].draw();
        enemies[i].update();
        if (enemies[i].x < cellSize) {
            gameOver = true;
            losingScream.play();
            bgMusic.pause();
            bgMusic.currentTime = 0;
            enemyEating.pause();
            enemyEating.currentTime = 0;
        }
        if (enemies[i].health <= 0) {
            let gainedResources = Math.floor(enemies[i].maxHealth * 0.15);
            floatingMessages.push(new FloatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));
            floatingMessages.push(new FloatingMessage('+' + gainedResources, 470, 85, 30, 'gold'));
            numberOfResources += gainedResources;
            score += gainedResources;
            enemyEating.pause();
            enemyEating.currentTime = 0;
            enemies[i].deathSound.play();
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        if (enemiesInterval > 400) {
            carrottProbability = 0.55;
            grassMonsterProbability = 0.85;
        } else if (enemiesInterval <= 300) {
            carrottProbability = 0.35;
            grassMonsterProbability = 0.65;
        }
        if (enemyType < carrottProbability) enemies.push(new Carrott(verticalPosition));
        else if (enemyType < grassMonsterProbability) enemies.push(new GrassMonster(verticalPosition));
        else enemies.push(new Bug(verticalPosition));
        enemyPositions.push(verticalPosition);
        // Game difficulty
        if (enemiesInterval > 400) enemiesInterval -= 30;
        else if (enemiesInterval > 120) enemiesInterval -= 40;
    }
}

// Resources
const amounts = [20, 30, 40, 50];
const coin = new Image();
coin.src = 'assets/img/others/coin.png';

class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize * 2.5) + cellSize * 2;
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = 151 * 0.45;
        this.height = 151 * 0.45;
        this.spriteWidth = 151;
        this.spriteHeight = 151;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
        this.image = coin;
        this.frame = 0;
        this.minFrame = 0;
        this.maxFrame = 5;
        this.fps = 18;
    }
    draw() {
        // Debugging
        // ctx.fillStyle = 'yellow';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.spriteWidth * this.frame, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'black'
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount, this.x + 18, this.y + 4);
    }
    update() {
        if (frame % this.fps === 0) {
            if (this.frame < this.maxFrame) this.frame++;
            else this.frame = this.minFrame;
        }
    }
}

function handleResources() {
    if (frame % 450 === 0 && score < winningScore) {
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++) {
        resources[i].update();
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collisionDetection(resources[i], mouse)) {
            numberOfResources += resources[i].amount;
            floatingMessages.push(new FloatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
            floatingMessages.push(new FloatingMessage('+' + resources[i].amount, 470, 85, 30, 'gold'));
            resources.splice(i, 1);
            coinPickup.play();
            i--;
        }
    }
}

// Utilities
function handleGameStatus() {
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText('Score: ' + score, 180, 40);
    ctx.fillText('Resources: ' + numberOfResources, 180, 80);
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        startButton.style.display = 'block';
        startButton.innerHTML = 'RESTART GAME';
        ctx.fillStyle = 'red';
        ctx.font = '60px Orbitron';
        ctx.fillText('OH NO!', canvas.width * 0.5 - 125, 250);
        ctx.font = '45px Orbitron';
        ctx.fillText('YOU HAVE BEEN EATEN ALIVE!', 45, 380);
    }
    if (score >= winningScore && enemies.length === 0) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        enemyEating.pause();
        enemyEating.currentTime = 0;
        startButton.style.display = 'block';
        startButton.innerHTML = 'RESTART GAME';
        winningMusic.play();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'gold';
        ctx.font = '60px Orbitron';
        ctx.fillText('CONGRATS!', canvas.width * 0.5 - 205, 260);
        ctx.font = '33px Orbitron';
        ctx.fillText('YOU HAVE DEFENDED THE NEIGHBOURHOOD!', 20, 380);
        gameOver = true;
    } else if (gameOver && score < winningScore) {
        losingMusic.play();
    }
}

// Start game
startButton.addEventListener('click', function () {
    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animate();
        bgMusic.currentTime = 0;
        bgMusic.play();
        startButton.style.display = 'none';
    } else if (gameOver) {
        startButton.innerHTML = 'START GAME';
        startButton.style.display = 'none';
        winningMusic.pause();
        winningMusic.currentTime = 0;
        losingMusic.pause();
        losingMusic.currentTime = 0;
        bgMusic.currentTime = 0;
        bgMusic.play();
        // Restart functions
        restartGame();
        animate();
    }
});

// Placing defenders
canvas.addEventListener('click', function () {
    let defenderCost = chosenDefender === 1 ? 85 : 150;
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize || gridPositionX <= cellSize * 2) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
    };
    if (numberOfResources >= defenderCost) {
        if (chosenDefender === 1) {
            defenders.push(new AfroShroom(gridPositionX, gridPositionY));
            numberOfResources -= defenderCost;
        } else if (chosenDefender === 2) {
            defenders.push(new CuteBug(gridPositionX, gridPositionY));
            numberOfResources -= defenderCost;
        }
    } else {
        floatingMessages.push(new FloatingMessage('You need more resources!', mouse.x, mouse.y, 20, 'blue'));
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlbar.width, controlbar.height);
    handleBackground();
    handleGameGrid();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    chooseDefender();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);
};

function collisionDetection(first, second) {
    if (
        !(
            first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y
        )
    ) {
        return true;
    };
};

function restartGame() {
    defenders.length = 0;
    enemies.length = 0;
    enemyPositions.length = 0;
    projectiles.length = 0;
    resources.length = 0;
    floatingMessages.length = 0;
    gameOver = false;
    enemiesInterval = 550;
    numberOfResources = 300;
    frame = 0;
    score = 0;
    chosenDefender = 1;
};

window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});

window.addEventListener('load', function () {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});