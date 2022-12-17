const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global variables
const cellSize = 100;
const cellGap = 3;
let enemiesInterval = 600;
let numberOfResources = 300;
let frame = 0;
let gameOver = false;
let score = 0;
let chosenDefender = 1;
const gameGrid = [];
const defenders = [];
const defenderTypes = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];
const floatingMessages = [];
const winningScore = 30;

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

// Projectiles
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
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
defenderTypes.push(defender1);
defenderTypes.push(defender2);

class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 503;
        this.spriteHeight = 513;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.fps = 14;
        this.chosenDefender = chosenDefender;
    }
    draw() {
        // Debugging
        //ctx.fillStyle = 'blue';
        //ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 22);
        if (this.chosenDefender === 1) {
            ctx.drawImage(defender1, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x + 5, this.y + 17, this.spriteWidth * 0.16, this.spriteHeight * 0.16);
        } else if (this.chosenDefender === 2) {
            ctx.drawImage(defender2, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x + 5, this.y + 17, this.spriteWidth * 0.16, this.spriteHeight * 0.16);
        }
    }
    update() {
        if (frame % this.fps === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
        if (this.shooting) {
            this.timer++;
            if (this.timer % 100 === 0) {
                projectiles.push(new Projectile(this.x + 50, this.y + 50));
            }
        } else {
            this.timer = 0;
        }
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
                defenders[i].health -= 0.2;
            }
            if (defenders[i] && defenders[i].health <= 0) {
                defenders.splice(i, 1);
                i--;
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
    ctx.fillText('100', 22, 23);
    ctx.drawImage(defender1, 0, 0, 503, 513, 7, 22, 503 * 0.15, 513 * 0.15);
    ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
    ctx.fillStyle = card2Border;
    ctx.strokeStyle = card2Border;
    ctx.font = '22px Orbitron';
    ctx.fillText('200', 98, 23);
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
        this.speed = Math.random() * 0.2 + 0.5;
        this.movement = this.speed;
        this.health = 60;
        this.maxHealth = this.health;
        this.spriteWidth = 608;
        this.spriteHeight = 592;
        this.image = enemy1;
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
        this.speed = Math.random() * 0.2 + 0.28;
        this.movement = this.speed;
        this.health = 120;
        this.maxHealth = this.health;
        this.spriteWidth = 948;
        this.spriteHeight = 823;
        this.image = enemy3;
        this.maxFrame = 12;
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
        this.speed = Math.random() * 0.2 + 0.18;
        this.movement = this.speed;
        this.health = 180;
        this.maxHealth = this.health;
        this.spriteWidth = 1216;
        this.spriteHeight = 789;
        this.image = enemy2;
        this.maxFrame = 20;
    }
    draw() {
        super.draw();
        ctx.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x - 5, this.y + 15, this.spriteWidth * 0.12, this.spriteHeight * 0.12);
    }
}

function handleEnemies() {
    let enemyType = Math.random();
    let carrottProbability = 0.45;
    let grassMonsterProbability = 0.75;
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].draw();
        enemies[i].update();
        if (enemies[i].x < cellSize) {
            gameOver = true;
        }
        if (enemies[i].health <= 0) {
            let gainedResources = enemies[i].maxHealth * 0.15;
            floatingMessages.push(new FloatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));
            floatingMessages.push(new FloatingMessage('+' + gainedResources, 470, 85, 30, 'gold'));
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        if (enemiesInterval > 400) {
            carrottProbability = 0.45;
            grassMonsterProbability = 0.75;
        } else if (enemiesInterval <= 400) {
            carrottProbability = 0.35;
            grassMonsterProbability = 0.65;
        }
        if (enemyType < carrottProbability) enemies.push(new Carrott(verticalPosition));
        else if (enemyType < grassMonsterProbability) enemies.push(new GrassMonster(verticalPosition));
        else enemies.push(new Bug(verticalPosition));
        enemyPositions.push(verticalPosition);
        // Game difficulty
        if (enemiesInterval > 400) enemiesInterval -= 40;
        else if (enemiesInterval > 120) enemiesInterval -= 60;
    }
}

// Resources
const amounts = [20, 30, 40];
class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize * 1.5) + cellSize;
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black'
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}

function handleResources() {
    if (frame % 500 === 0 && score < winningScore) {
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++) {
        resources[i].draw();
        if (resources[i] && mouse.x && mouse.y && collisionDetection(resources[i], mouse)) {
            numberOfResources += resources[i].amount;
            floatingMessages.push(new FloatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
            floatingMessages.push(new FloatingMessage('+' + resources[i].amount, 470, 85, 30, 'gold'));
            resources.splice(i, 1);
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
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('OH NO!', canvas.width * 0.5 - 90, 250);
        ctx.font = '45px Orbitron';
        ctx.fillText('YOU HAVE BEEN EATEN ALIVE!', 45, 350);
    }
    if (score >= winningScore && enemies.length === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('CONGRATS!', canvas.width * 0.5 - 180, 260)
        ctx.font = '33px Orbitron';
        ctx.fillText('YOU HAVE DEFENDED THE NEIGHBOURHOOD!', 20, 350)
    }
}

// Placing defenders
canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize || gridPositionX <= cellSize * 2) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) return;
    };
    let defenderCost = 100;
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    } else {
        floatingMessages.push(new FloatingMessage('You need more resources!', mouse.x, mouse.y, 20, 'blue'));
    }
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlbar.width, controlbar.height);
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
animate();

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

window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});