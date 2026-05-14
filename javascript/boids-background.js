(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  if (prefersReducedMotion.matches) return;

  const canvas = document.getElementById("boids-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const boids = [];
  const pointer = { x: 0, y: 0, active: false };

  const config = {
    count: 72,
    maxSpeed: 1.7,
    maxForce: 0.035,
    perception: 86,
    separationDistance: 30,
    separationWeight: 1.55,
    alignmentWeight: 0.82,
    cohesionWeight: 0.62,
    pointerDistance: 115,
    pointerWeight: 1.15,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrame = 0;

  class Boid {
    constructor(x, y) {
      this.position = { x, y };
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * config.maxSpeed;
      this.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      this.acceleration = { x: 0, y: 0 };
      this.size = 3.2 + Math.random() * 1.8;
    }

    applyForce(force) {
      this.acceleration.x += force.x;
      this.acceleration.y += force.y;
    }

    flock(allBoids) {
      const separation = { x: 0, y: 0 };
      const alignment = { x: 0, y: 0 };
      const cohesion = { x: 0, y: 0 };
      let separationCount = 0;
      let neighborCount = 0;

      for (const other of allBoids) {
        if (other === this) continue;
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < config.perception * config.perception) {
          alignment.x += other.velocity.x;
          alignment.y += other.velocity.y;
          cohesion.x += other.position.x;
          cohesion.y += other.position.y;
          neighborCount += 1;
        }

        if (
          distanceSq > 0 &&
          distanceSq < config.separationDistance * config.separationDistance
        ) {
          const distance = Math.sqrt(distanceSq);
          separation.x -= dx / distance;
          separation.y -= dy / distance;
          separationCount += 1;
        }
      }

      if (neighborCount > 0) {
        alignment.x /= neighborCount;
        alignment.y /= neighborCount;
        this.applyForce(
          scale(
            limit(
              subtract(setMagnitude(alignment, config.maxSpeed), this.velocity),
              config.maxForce,
            ),
            config.alignmentWeight,
          ),
        );

        cohesion.x = cohesion.x / neighborCount - this.position.x;
        cohesion.y = cohesion.y / neighborCount - this.position.y;
        this.applyForce(
          scale(
            limit(
              subtract(setMagnitude(cohesion, config.maxSpeed), this.velocity),
              config.maxForce,
            ),
            config.cohesionWeight,
          ),
        );
      }

      if (separationCount > 0) {
        separation.x /= separationCount;
        separation.y /= separationCount;
        this.applyForce(
          scale(
            limit(
              subtract(
                setMagnitude(separation, config.maxSpeed),
                this.velocity,
              ),
              config.maxForce,
            ),
            config.separationWeight,
          ),
        );
      }

      if (pointer.active) {
        const away = {
          x: this.position.x - pointer.x,
          y: this.position.y - pointer.y,
        };
        const distSq = away.x * away.x + away.y * away.y;
        if (distSq < config.pointerDistance * config.pointerDistance) {
          this.applyForce(
            scale(
              limit(
                subtract(setMagnitude(away, config.maxSpeed), this.velocity),
                config.maxForce * 2,
              ),
              config.pointerWeight,
            ),
          );
        }
      }
    }

    update() {
      this.velocity.x += this.acceleration.x;
      this.velocity.y += this.acceleration.y;
      this.velocity = limit(this.velocity, config.maxSpeed);
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.acceleration.x = 0;
      this.acceleration.y = 0;
      this.wrapEdges();
    }

    wrapEdges() {
      const padding = 18;
      if (this.position.x < -padding) this.position.x = width + padding;
      if (this.position.x > width + padding) this.position.x = -padding;
      if (this.position.y < -padding) this.position.y = height + padding;
      if (this.position.y > height + padding) this.position.y = -padding;
    }

    draw() {
      const angle = Math.atan2(this.velocity.y, this.velocity.x);
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(this.size * 2.2, 0);
      ctx.lineTo(-this.size, this.size * 0.9);
      ctx.lineTo(-this.size * 0.65, 0);
      ctx.lineTo(-this.size, -this.size * 0.9);
      ctx.closePath();
      ctx.fillStyle = "rgba(47, 47, 47, 0.16)";
      ctx.fill();
      ctx.restore();
    }
  }

  function magnitude(vector) {
    return Math.hypot(vector.x, vector.y);
  }

  function setMagnitude(vector, target) {
    const mag = magnitude(vector);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: (vector.x / mag) * target, y: (vector.y / mag) * target };
  }

  function limit(vector, max) {
    const mag = magnitude(vector);
    if (mag <= max || mag === 0) return { x: vector.x, y: vector.y };
    return { x: (vector.x / mag) * max, y: (vector.y / mag) * max };
  }

  function subtract(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }

  function scale(vector, scalar) {
    return { x: vector.x * scalar, y: vector.y * scalar };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = Math.min(
      config.count,
      Math.max(32, Math.floor((width * height) / 16000)),
    );
    while (boids.length < targetCount)
      boids.push(new Boid(Math.random() * width, Math.random() * height));
    while (boids.length > targetCount) boids.pop();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const boid of boids) boid.flock(boids);
    for (const boid of boids) {
      boid.update();
      boid.draw();
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function updatePointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  prefersReducedMotion.addEventListener("change", (event) => {
    if (event.matches) cancelAnimationFrame(animationFrame);
    else animate();
  });

  resize();
  animate();
})();
