// Simple Pong implementation: left paddle is player (mouse + arrows), right is AI.
// Save as script.js and open index.html to play.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');

const W = canvas.width;
const H = canvas.height;

// Game objects
const paddleWidth = 12;
const paddleHeight = 100;

const player = {
  x: 10,
  y: (H - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 6,
  dy: 0
};

const computer = {
  x: W - paddleWidth - 10,
  y: (H - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 4
};

const ball = {
  x: W / 2,
  y: H / 2,
  r: 8,
  speed: 5,
  vx: 0,
  vy: 0
};

let playerScore = 0;
let computerScore = 0;

let keys = { ArrowUp: false, ArrowDown: false };
let lastMouseY = null;

// Helpers
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function resetBall(direction = null) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = 5;
  // random small angle
  const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // -22.5deg .. +22.5deg
  const dir = direction || (Math.random() < 0.5 ? -1 : 1);
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

function drawRect(x, y, w, h, color = '#fff') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color = '#fff') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawNet() {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function update() {
  // Player movement by keys
  if (keys.ArrowUp) player.y -= player.speed;
  if (keys.ArrowDown) player.y += player.speed;

  // If mouse moved recently, it sets player.y directly via event handler.
  // Clamp paddles
  player.y = clamp(player.y, 0, H - player.height);

  // Simple computer AI: move towards ball with limited speed
  const cpCenter = computer.y + computer.height / 2;
  const diff = ball.y - cpCenter;
  if (Math.abs(diff) > 10) {
    computer.y += Math.sign(diff) * computer.speed;
  } else {
    // small smoothing
    computer.y += diff * 0.06;
  }
  computer.y = clamp(computer.y, 0, H - computer.height);

  // Ball movement
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom collision
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }

  // Paddle collisions (AABB vs circle simplified)
  // Left paddle
  if (ball.x - ball.r <= player.x + player.width &&
      ball.x - ball.r >= player.x &&
      ball.y >= player.y &&
      ball.y <= player.y + player.height) {

    // place ball outside paddle to avoid sticking
    ball.x = player.x + player.width + ball.r;
    reflectFromPaddle(player);
  }

  // Right paddle
  if (ball.x + ball.r >= computer.x &&
      ball.x + ball.r <= computer.x + computer.width &&
      ball.y >= computer.y &&
      ball.y <= computer.y + computer.height) {

    ball.x = computer.x - ball.r;
    reflectFromPaddle(computer);
  }

  // Score: ball out of left or right bounds
  if (ball.x < -ball.r) {
    // computer scores
    computerScore++;
    updateScores();
    resetBall(1); // send to right (computer) so player serves to right
  } else if (ball.x > W + ball.r) {
    // player scores
    playerScore++;
    updateScores();
    resetBall(-1);
  }
}

function reflectFromPaddle(paddle) {
  // Determine hit position relative to paddle center (-1 .. 1)
  const relativeIntersectY = (ball.y - (paddle.y + paddle.height / 2));
  const normalized = relativeIntersectY / (paddle.height / 2);
  const maxBounceAngle = Math.PI / 3; // 60 degrees

  const bounceAngle = normalized * maxBounceAngle;
  const speedIncrease = 0.3; // small speed up on hit
  const speed = Math.min(12, Math.hypot(ball.vx, ball.vy) + speedIncrease);

  // Determine direction: if paddle is player (left) then ball goes right (positive vx)
  const dir = paddle === player ? 1 : -1;
  ball.vx = dir * speed * Math.cos(bounceAngle);
  ball.vy = speed * Math.sin(bounceAngle);
}

function render() {
  ctx.clearRect(0, 0, W, H);

  // background gradient already via CSS, but fill slightly to ensure clear
  // draw net
  drawNet();

  // paddles
  drawRect(player.x, player.y, player.width, player.height, '#e6eef8');
  drawRect(computer.x, computer.y, computer.width, computer.height, '#e6eef8');

  // ball
  drawCircle(ball.x, ball.y, ball.r, '#f2c94c');
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function updateScores() {
  playerScoreEl.textContent = String(playerScore);
  computerScoreEl.textContent = String(computerScore);
}

// Input handling
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  lastMouseY = y;
  player.y = clamp(y - player.height / 2, 0, H - player.height);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'Up') keys.ArrowUp = true;
  if (e.key === 'ArrowDown' || e.key === 'Down') keys.ArrowDown = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'Up') keys.ArrowUp = false;
  if (e.key === 'ArrowDown' || e.key === 'Down') keys.ArrowDown = false;
});

// Initialize
resetBall();
updateScores();
requestAnimationFrame(gameLoop);