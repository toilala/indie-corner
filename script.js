(function () {
  'use strict';

  let currentGame = 'dodge';
  let animId = null;
  let isRunning = false;

  function initNavigation() {
    const mobileBtn = document.getElementById('mobileBtn');
    const navMenu = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-link');

    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener('click', function () {
        const isOpen = navMenu.classList.toggle('open');
        mobileBtn.classList.toggle('open', isOpen);
      });

      document.addEventListener('click', function (e) {
        if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target)) {
          navMenu.classList.remove('open');
          mobileBtn.classList.remove('open');
        }
      });
    }

    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(function (link) {
      const target = link.getAttribute('href');
      if (target === current || (current === '' && target === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function initArcade() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('scoreVal');
    const highVal = document.getElementById('highVal');
    const startBtn = document.getElementById('startBtn');
    const gameName = document.getElementById('gameName');
    const gameTip = document.getElementById('gameTip');
    const tabs = document.querySelectorAll('.game-tab');

    let score = 0;
    let highScores = {
      dodge: parseInt(localStorage.getItem('indie_high_dodge') || '0', 10),
      brick: parseInt(localStorage.getItem('indie_high_brick') || '0', 10),
      snake: parseInt(localStorage.getItem('indie_high_snake') || '0', 10)
    };

    function updateScoreDisplay() {
      if (scoreVal) scoreVal.textContent = score;
      if (highVal) highVal.textContent = highScores[currentGame] || 0;
    }

    function setCanvasDimensions() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = 280;
    }
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);

    const dodgeGame = {
      player: { x: 150, y: 240, w: 46, h: 12, speed: 6, left: false, right: false },
      items: [],
      timer: 0,
      init: function () {
        this.player.x = (canvas.width - this.player.w) / 2;
        this.player.y = canvas.height - this.player.h - 10;
        this.items = [];
        this.timer = 0;
      },
      update: function () {
        if (this.player.left && this.player.x > 0) this.player.x -= this.player.speed;
        if (this.player.right && this.player.x + this.player.w < canvas.width) this.player.x += this.player.speed;

        this.timer++;
        if (this.timer % 35 === 0) {
          this.items.push({
            x: Math.random() * (canvas.width - 16),
            y: -12,
            size: 13,
            speed: 2.2 + Math.random() * 2,
            isHazard: Math.random() < 0.35
          });
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
          const it = this.items[i];
          it.y += it.speed;

          if (
            it.y + it.size >= this.player.y &&
            it.y <= this.player.y + this.player.h &&
            it.x + it.size >= this.player.x &&
            it.x <= this.player.x + this.player.w
          ) {
            if (it.isHazard) {
              stopGame();
              return;
            } else {
              score += 10;
              updateScoreDisplay();
              this.items.splice(i, 1);
              continue;
            }
          }

          if (it.y > canvas.height) {
            this.items.splice(i, 1);
          }
        }
      },
      draw: function () {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

        this.items.forEach(function (it) {
          if (it.isHazard) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(it.x + it.size / 2, it.y + it.size / 2, it.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(it.x, it.y, it.size, it.size);
          }
        });
      }
    };

    const brickGame = {
      paddle: { x: 150, y: 250, w: 60, h: 10, speed: 6, left: false, right: false },
      ball: { x: 150, y: 200, r: 5, dx: 3, dy: -3 },
      bricks: [],
      rows: 3,
      cols: 8,
      init: function () {
        this.paddle.x = (canvas.width - this.paddle.w) / 2;
        this.paddle.y = canvas.height - this.paddle.h - 10;
        this.ball.x = canvas.width / 2;
        this.ball.y = canvas.height - 40;
        this.ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -3;
        this.bricks = [];
        const bw = (canvas.width - 40) / this.cols;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            this.bricks.push({ x: 20 + c * bw, y: 30 + r * 20, w: bw - 6, h: 14, alive: true });
          }
        }
      },
      update: function () {
        if (this.paddle.left && this.paddle.x > 0) this.paddle.x -= this.paddle.speed;
        if (this.paddle.right && this.paddle.x + this.paddle.w < canvas.width) this.paddle.x += this.paddle.speed;

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > canvas.width) {
          this.ball.dx = -this.ball.dx;
        }
        if (this.ball.y - this.ball.r < 0) {
          this.ball.dy = -this.ball.dy;
        }

        if (
          this.ball.y + this.ball.r >= this.paddle.y &&
          this.ball.x >= this.paddle.x &&
          this.ball.x <= this.paddle.x + this.paddle.w
        ) {
          this.ball.dy = -Math.abs(this.ball.dy);
        }

        let remaining = 0;
        for (let i = 0; i < this.bricks.length; i++) {
          const b = this.bricks[i];
          if (b.alive) {
            remaining++;
            if (
              this.ball.x > b.x &&
              this.ball.x < b.x + b.w &&
              this.ball.y - this.ball.r < b.y + b.h &&
              this.ball.y + this.ball.r > b.y
            ) {
              b.alive = false;
              this.ball.dy = -this.ball.dy;
              score += 15;
              updateScoreDisplay();
              break;
            }
          }
        }

        if (remaining === 0) {
          this.init();
        }

        if (this.ball.y > canvas.height) {
          stopGame();
        }
      },
      draw: function () {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < this.bricks.length; i++) {
          const b = this.bricks[i];
          if (b.alive) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(b.x, b.y, b.w, b.h);
          }
        }
      }
    };

    const snakeGame = {
      grid: 16,
      snake: [],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 8, y: 8 },
      tickCount: 0,
      init: function () {
        const startX = Math.floor(canvas.width / (2 * this.grid));
        const startY = Math.floor(canvas.height / (2 * this.grid));
        this.snake = [
          { x: startX, y: startY },
          { x: startX - 1, y: startY },
          { x: startX - 2, y: startY }
        ];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.tickCount = 0;
        this.spawnFood();
      },
      spawnFood: function () {
        const maxCols = Math.floor(canvas.width / this.grid);
        const maxRows = Math.floor(canvas.height / this.grid);
        this.food = {
          x: Math.floor(Math.random() * (maxCols - 2)) + 1,
          y: Math.floor(Math.random() * (maxRows - 2)) + 1
        };
      },
      update: function () {
        this.tickCount++;
        if (this.tickCount % 6 !== 0) return;

        this.dir = this.nextDir;
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

        const maxCols = Math.floor(canvas.width / this.grid);
        const maxRows = Math.floor(canvas.height / this.grid);

        if (head.x < 0 || head.x >= maxCols || head.y < 0 || head.y >= maxRows) {
          stopGame();
          return;
        }

        for (let i = 0; i < this.snake.length; i++) {
          if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
            stopGame();
            return;
          }
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
          score += 20;
          updateScoreDisplay();
          this.spawnFood();
        } else {
          this.snake.pop();
        }
      },
      draw: function () {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(this.food.x * this.grid, this.food.y * this.grid, this.grid - 2, this.grid - 2);

        for (let i = 0; i < this.snake.length; i++) {
          ctx.fillStyle = i === 0 ? '#f59e0b' : '#38bdf8';
          ctx.fillRect(this.snake[i].x * this.grid, this.snake[i].y * this.grid, this.grid - 2, this.grid - 2);
        }
      }
    };

    function getCurrentHandler() {
      if (currentGame === 'dodge') return dodgeGame;
      if (currentGame === 'brick') return brickGame;
      return snakeGame;
    }

    function renderScreen() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const handler = getCurrentHandler();
      handler.draw();

      if (!isRunning) {
        ctx.fillStyle = 'rgba(11, 14, 20, 0.82)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f3f8';
        ctx.font = '600 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS START TO PLAY', canvas.width / 2, canvas.height / 2 - 8);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#9aa5b8';
        ctx.fillText('Use Arrow Keys or Mouse/Touch', canvas.width / 2, canvas.height / 2 + 16);
      }
    }

    function gameLoop() {
      if (!isRunning) return;
      const handler = getCurrentHandler();
      handler.update();
      renderScreen();
      animId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
      score = 0;
      updateScoreDisplay();
      setCanvasDimensions();
      getCurrentHandler().init();
      isRunning = true;
      if (startBtn) startBtn.textContent = 'Restart';
      gameLoop();
    }

    function stopGame() {
      isRunning = false;
      cancelAnimationFrame(animId);
      if (score > (highScores[currentGame] || 0)) {
        highScores[currentGame] = score;
        localStorage.setItem('indie_high_' + currentGame, score);
        updateScoreDisplay();
      }
      if (startBtn) startBtn.textContent = 'Play Again';
      renderScreen();
    }

    window.addEventListener('keydown', function (e) {
      if (currentGame === 'dodge') {
        if (e.key === 'ArrowLeft' || e.key === 'a') dodgeGame.player.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') dodgeGame.player.right = true;
      } else if (currentGame === 'brick') {
        if (e.key === 'ArrowLeft' || e.key === 'a') brickGame.paddle.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') brickGame.paddle.right = true;
      } else if (currentGame === 'snake') {
        if ((e.key === 'ArrowUp' || e.key === 'w') && snakeGame.dir.y === 0) snakeGame.nextDir = { x: 0, y: -1 };
        if ((e.key === 'ArrowDown' || e.key === 's') && snakeGame.dir.y === 0) snakeGame.nextDir = { x: 0, y: 1 };
        if ((e.key === 'ArrowLeft' || e.key === 'a') && snakeGame.dir.x === 0) snakeGame.nextDir = { x: -1, y: 0 };
        if ((e.key === 'ArrowRight' || e.key === 'd') && snakeGame.dir.x === 0) snakeGame.nextDir = { x: 1, y: 0 };
      }
    });

    window.addEventListener('keyup', function (e) {
      if (currentGame === 'dodge') {
        if (e.key === 'ArrowLeft' || e.key === 'a') dodgeGame.player.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') dodgeGame.player.right = false;
      } else if (currentGame === 'brick') {
        if (e.key === 'ArrowLeft' || e.key === 'a') brickGame.paddle.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') brickGame.paddle.right = false;
      }
    });

    canvas.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (currentGame === 'dodge') {
        dodgeGame.player.x = Math.max(0, Math.min(canvas.width - dodgeGame.player.w, x - dodgeGame.player.w / 2));
      } else if (currentGame === 'brick') {
        brickGame.paddle.x = Math.max(0, Math.min(canvas.width - brickGame.paddle.w, x - brickGame.paddle.w / 2));
      }
    });

    canvas.addEventListener('touchmove', function (e) {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      if (currentGame === 'dodge') {
        dodgeGame.player.x = Math.max(0, Math.min(canvas.width - dodgeGame.player.w, x - dodgeGame.player.w / 2));
      } else if (currentGame === 'brick') {
        brickGame.paddle.x = Math.max(0, Math.min(canvas.width - brickGame.paddle.w, x - brickGame.paddle.w / 2));
      }
      e.preventDefault();
    }, { passive: false });

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        currentGame = tab.getAttribute('data-game');
        if (gameName) gameName.textContent = tab.textContent;

        if (gameTip) {
          if (currentGame === 'dodge') {
            gameTip.textContent = 'Controls: Left / Right keys or mouse. Collect blue squares (+10), avoid red rocks.';
          } else if (currentGame === 'brick') {
            gameTip.textContent = 'Controls: Move paddle to bounce the ball and destroy the blue bricks (+15).';
          } else {
            gameTip.textContent = 'Controls: Arrow keys (Up, Down, Left, Right). Eat red apples (+20) and grow.';
          }
        }

        stopGame();
        score = 0;
        updateScoreDisplay();
        getCurrentHandler().init();
        renderScreen();
      });
    });

    if (startBtn) startBtn.addEventListener('click', startGame);

    dodgeGame.init();
    updateScoreDisplay();
    renderScreen();
  }

  function initContactForm() {
    const form = document.getElementById('contactForm');
    const msg = document.getElementById('message');
    const charCounter = document.getElementById('charCounter');
    const alertBox = document.getElementById('alertBox');

    if (msg && charCounter) {
      msg.addEventListener('input', function () {
        charCounter.textContent = msg.value.length + ' / 300';
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        let isValid = true;

        function validate(field, condition) {
          const row = field.closest('.form-field');
          if (!condition) {
            row.classList.add('has-error');
            isValid = false;
          } else {
            row.classList.remove('has-error');
          }
        }

        validate(nameInput, nameInput.value.trim().length >= 2);
        validate(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()));
        validate(msg, msg.value.trim().length >= 8);

        if (isValid) {
          if (alertBox) {
            alertBox.textContent = 'Message sent! Thanks ' + nameInput.value.trim() + ', we will get back to you soon.';
            alertBox.classList.add('show');
          }
          form.reset();
          if (charCounter) charCounter.textContent = '0 / 300';
          setTimeout(function () {
            if (alertBox) alertBox.classList.remove('show');
          }, 4500);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initArcade();
    initContactForm();
  });
})();
