const G = 100;
let mass = 1;
let radius = 10;
let col;

let bodies = [];
let save = [];
let settingsButtons = [];

let paused = false;
let placing = false;
let mode = 0;
let collisions = true;

let simSampleRate = 10;
let simSpeed = 1;

let hideSettings = false;
let hideStats = true;

let settingsAnimTimer;
let statsAnimTimer;

let camX = 0;
let camY = 0;
let camSpeed = 5;
let scaleFactor = 1;

let pX = 0;
let pY = 0;

let iV = 0;
let iVA = 0;

let pulseTimers = [];
let pulseX = 0;
let pulseY = 0;

let whirlX = 0;
let whirlY = 0;

let statsDX = 0;

let selected = 0;
let follow = 0;
let following = false;

let page = 0;
let pageUp;
let pageDown;

function setup() {
  let sketch = createCanvas(1400, 800);
  sketch.parent("mycanvas");
  col = color(255, 255, 255);

  settingsButtons.push(new Button(30, 30, 220, 40, "SET MASS", setMass));
  settingsButtons.push(new Button(30, 90, 220, 40, "SET RADIUS", setRadius));
  settingsButtons.push(new Button(30, 150, 220, 40, "SET COLOUR", setColour));
  settingsButtons.push(new Button(30, 210, 220, 40, "MODE: CREATE", toggleMode));
  settingsButtons.push(new Button(30, 270, 220, 40, "COLLISIONS: ON", toggleCollisions));
  settingsButtons.push(new Button(30, 330, 220, 40, "SIM ACCURACY", setSampleRate));
  settingsButtons.push(new Button(30, 460, 220, 40, "SIM SPEED", setSimSpeed));

  settingsAnimTimer = new Timer(10);
  statsAnimTimer = new Timer(10);

  for (let i = 0; i < 3; i++) {
    pulseTimers.push(new Timer(40));
  }

  pageUp = new Button(1250, 760, 60, 20, ">", nextPage);
  pageDown = new Button(1090, 760, 60, 20, "<", previousPage);
}

function draw() {
  background(0);

  settingsAnimTimer.update();
  statsAnimTimer.update();

  for (let i = 0; i < pulseTimers.length; i++) {
    pulseTimers[i].update();
    if (i > 0 && pulseTimers[i - 1].t === 10) {
      pulseTimers[i].start();
    }

    if (!pulseTimers[i].done()) {
      stroke(255, 255, 255, 255 * (1 - pulseTimers[i].t/40));
      strokeWeight(10);
      noFill();
      circle(pulseX, pulseY, 10 * pulseTimers[i].t);
    }
  }

  let settingsDY = hideSettings ? settingsAnimation1() : settingsAnimation2();
  statsDX = hideStats ? statsAnimation1() : statsAnimation2();

  if (!placing) {
    if (keyIsDown(65)) {
      camX -= camSpeed * scaleFactor;
      following = false;
    } else if (keyIsDown(68)) {
      camX += camSpeed * scaleFactor;
      following = false;
    }
    if (keyIsDown(87)) {
      camY += camSpeed * scaleFactor;
      following = false;
    } else if (keyIsDown(83)) {
      camY -= camSpeed * scaleFactor;
      following = false;
    }
  } else {
    iVA = getAngle(mouseX - pX, mouseY - pY);
  }

  if (following) {
    camX = bodies[follow].p.x - (700 * scaleFactor);
    camY = -bodies[follow].p.y + (400 * scaleFactor);
  }

  updateBodies();

  for (let i = 0; i < bodies.length; i++) { bodies[i].drawBody(); }
  
  if (paused) {
    fill("white");
    textSize(30);
    textAlign(RIGHT, TOP);
    text("PAUSED", 1380, 20);
  }
  
  if (mode === 0) {
    col.setAlpha(80);
    fill(col);
    if (!placing) { circle(mouseX, mouseY, radius * 2 / scaleFactor); }
    else { 
      circle(pX, pY, radius * 2 / scaleFactor);
      stroke("red");
      strokeWeight(5);
      line(pX, pY, pX + radius * 1.1 / scaleFactor * cos(iVA), pY + radius * 1.1 / scaleFactor * sin(iVA));
      textSize(14);
      textAlign(LEFT, BOTTOM);
      fill("white");
      noStroke();
      text((iV * 60).toFixed(3) + "m/s", pX + radius / scaleFactor + 10, pY + radius / scaleFactor - 10);
    }
    col.setAlpha(255);
  }
  
  fill(128, 128, 128, 80);
  noStroke();
  rect(10, 10 - settingsDY, 350, 550, 20);
  rect(1000 + statsDX, 65, 500, 800, 20);
  
  for (let i = 0; i < settingsButtons.length; i++) { 
    settingsButtons[i].ly = -settingsDY;
    settingsButtons[i].drawButton();
  }
  for (let i = 0; i < 4 && 4 * page + i < bodies.length; i++) {
    bodies[4 * page + i].stat.drawStat(85 + i * 170);
  }

  pageUp.lx = statsDX;
  pageDown.lx = statsDX;
  
  pageUp.drawButton();
  pageDown.drawButton();
  
  fill("white");
  noStroke();
  textSize(14);
  textAlign(LEFT, CENTER);
  text(mass + "kg", 270, 50 - settingsDY);
  text(radius + "m", 270, 110 - settingsDY);
  textAlign(LEFT, TOP);
  text("Current sim accuracy: " + simSampleRate + " samples/frame\nWARNING: Above 100 samples/frame, large\nsimulations may experience performance issues.", 30, 390 - settingsDY);
  text("Current sim speed: " + simSpeed, 30, 520 - settingsDY);
}

function mousePressed() {
  if (!placing) {
    if (!hideSettings) {
      for (let i = 0; i < settingsButtons.length; i++) {
        if (settingsButtons[i].mouseOver()) { settingsButtons[i].onClick(); return; }
      }
    }

    if (!hideStats) {
      if (pageUp.mouseOver()) {
        pageUp.onClick();
        return;
      } 
      if (pageDown.mouseOver()) {
        pageDown.onClick();
        return;
      }
      
      for (let i = 0; i < 4 && 4 * page + i < bodies.length; i++) {
        let index = 4 * page + i;
        for (let b = 0; b < 3; b++) {
          if (bodies[index].stat.buttons[b].mouseOver()) {
            selected = i;
            if (b === 1) follow = index;
            bodies[index].stat.buttons[b].onClick();
            return;
          }
        }
      }
    }
  }

  if (mode === 0) {
    if (placing) {
      bodies.push(new Body(mass, radius, col, new Vect(pX * scaleFactor + camX, pY * scaleFactor - camY), new Vect(iV * cos(iVA), iV * sin(iVA))));
      placing = false;
    } else {
      pX = mouseX;
      pY = mouseY;
      iV = 0;
      placing = true;
    }
  } else if (mode === 1) {
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].mouseOver()) {
        if (i === follow) following = false;
        bodies.splice(i, 1);
        break;
      }
    }
  } else if (mode === 2) {
    for (let i = 0; i < bodies.length; i++) {
      if (bodies[i].mouseOver()) {
        explosion(i);
        break;
      }
    }
  } else if (mode === 3) {
    pulseX = mouseX;
    pulseY = mouseY;
    let mX = pulseX * scaleFactor + camX;
    let mY = pulseY * scaleFactor - camY;
    for (let i = 0; i < bodies.length; i++) {
      let b = bodies[i];
      let mag = 10000 * sqr(scaleFactor) / (b.m * (sqr(b.p.x - mX) + sqr(b.p.y - mY)));
      let ang = getAngle(b.p.x - mX, b.p.y - mY);

      bodies[i].v.add(new Vect(mag * cos(ang), mag * sin(ang)));
    }
    
    pulseTimers[0].start();
    pulseTimers[1].cut();
    pulseTimers[2].cut();
  }
}

function mouseWheel(event) {
  if (!placing) {
    let dS = event.delta * scaleFactor / 1000;
    scaleFactor += dS;
    camX -= 700 * dS;
    camY += 400 * dS;
  } else {
    iV -= iV === 0 ? -1/600 : event.delta * sqrt(iV) / 5000;
    if (iV < 0) {
      iV = 0;
    }
  }
}

function keyPressed() {
  if (key === 'p') {
    paused = !paused;
    if (!paused) {
      updateBodies();
    }
  }

  if (key === 'h' && settingsAnimTimer.done()) {
    hideSettings = !hideSettings;
    settingsAnimTimer.start();
  }

  if (key === 'l' && statsAnimTimer.done()) {
    hideStats = !hideStats;
    statsAnimTimer.start();
  }

  if (key === ' ') {
    save = [];
    for (let i = 0; i < bodies.length; i++) {
      b = bodies[i];
      save.push(new Body(b.m, b.r, b.col, new Vect(b.p.x, b.p.y), new Vect(b.v.x, b.v.y), new Vect(b.a.x, b.a.y)));
    }
  }

  if (key === 'r') {
    bodies = [];
    for (let i = 0; i < save.length; i++) {
      b = save[i];
      bodies.push(new Body(b.m, b.r, b.col, new Vect(b.p.x, b.p.y), new Vect(b.v.x, b.v.y), new Vect(b.a.x, b.a.y)));
    }
  }
}

function sqr(x) {
  return x * x;
}

function calculateAccVector(b) {
  let acc = new Vect(0, 0);
  
  for (let i = 0; i < bodies.length; i++) {
    if (i === b) continue;
    
    let aX = bodies[i].p.x - bodies[b].p.x;
    let aY = bodies[i].p.y - bodies[b].p.y;

    let mag = (G / sqr(simSampleRate)) / (sqr(aX) + sqr(aY));

    if (isNaN(mag)) { mag = 9999999; }
    
    let ang = getAngle(aX, aY);

    acc.add(new Vect(bodies[i].m * mag * cos(ang), bodies[i].m * mag * sin(ang)));
  }

  return acc;
}

function getAngle(x, y) {
  if (x === 0) return 0;
  
  let angle = atan(abs(y/x));
  if (y < 0) {
    if (x < 0) {
      angle = PI + angle;
    } else {
      angle = 2 * PI - angle;
    }
  } else {
    if (x < 0) {
      angle = PI - angle;
    }
  }
  
  return angle;
}

function updateBodies() {
  let mX = mouseX * scaleFactor + camX;
  let mY = mouseY * scaleFactor - camY;
  for (let s = 0; s < simSampleRate * simSpeed; s++) {
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].a = calculateAccVector(i);
    }
    if (collisions) {
      for (let i = 0; i < bodies.length - 1; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          collision(i, j);
        }
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      if (mouseIsPressed && mode === 4) {
        let b = bodies[i];
        let mag = sqrt(sqr(b.p.x - mX) + sqr(b.p.y - mY)) / 10000000;
        let ang = (getAngle(b.p.x - mX, b.p.y - mY) - 3*Math.PI/4) % (2 * Math.PI);
        let acc = new Vect(mag * cos(ang), mag * sin(ang));
        acc.add(b.a);

        bodies[i].a = acc;
      }
      bodies[i].update();
    }
  }
}

function collision(i1, i2) {
  let a = bodies[i1];
  let b = bodies[i2];

  if (!a.collisionTimer.done() || !b.collisionTimer.done()) { return; }
  
  let minR = a.r < b.r ? a.r : b.r;

  if (dist(a.p.x, a.p.y, b.p.x, b.p.y) < a.r + b.r - minR/2) {
    let sum = new Vect(0, 0);
    sum.add(a.v);
    sum.add(b.v);
    let ang = getAngle(sum.x, sum.y);
    let mag = ((a.v.mag() * a.m) + (b.v.mag() * b.m)) / (a.m + b.m);
    
    let r = Math.cbrt(sqr(a.r) * a.r + sqr(b.r) * b.r);

    let n = a.name + "-" + b.name;

    bodies.splice(i1, 1);
    if (i2 < i1) { bodies.splice(i2, 1); } else { bodies.splice(i2 - 1, 1); }

    let body = new Body(a.m + b.m, r, color(255, 255, 255), a.r > b.r ? new Vect(a.p.x, a.p.y) : new Vect(b.p.x, b.p.y), new Vect(mag * cos(ang), mag * sin(ang)));
    body.name = n;
    bodies.push(body);
  }
}

function explosion(ind) {
  let b = bodies[ind];
  let m = b.m / 20;
  let r = b.r;
  let c = color(255, 255, 255);
  let pos = new Vect(b.p.x, b.p.y);
  let vel = new Vect(b.v.x, b.v.y);

  bodies.splice(ind, 1);

  for (let i = 0; i < 20; i++) {
    let rands = [];
    for (let j = 0; j < 4; j++) {
      rands.push(1 - 2 * Math.random());
    }
    let particle = new Body(m, r / 3, c, new Vect(pos.x + 20 * cos((Math.PI * i + rands[0]) / 10) * sqrt(m), pos.y + 20 * sin((Math.PI * i + rands[0]) / 10) * sqrt(m)), new Vect(vel.x + sqrt(r/100) * (cos((Math.PI * i + rands[1]) / 10) + rands[2]) / sqrt(m), vel.y + sqrt(r/100) * (sin((Math.PI * i + rands[1]) / 10) + rands[3]) / sqrt(m)));
    particle.collisionTimer.start();
    particle.name += " (particle)";
    bodies.push(particle);
  }
}

// -------------------- CLASS DECLARATIONS --------------------

class Vect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
  }

  scale(c) {
    this.x *= c;
    this.y *= c;
  }

  mag() {
    return sqrt(sqr(this.x) + sqr(this.y));
  }
}

class Body {
  constructor(m, r, col, p, v = new Vect(0, 0), a = new Vect(0, 0)) {
    this.m = m;
    this.r = r;
    this.col = col;
    this.p = p;
    this.aP = new Vect(0, 0);
    this.v = v;
    this.a = a;
    
    this.collisionTimer = new Timer(30);
    this.collisionTimer.start();
    this.name = "body" + (bodies.length + 1).toString();
    this.stat = new Stat(this);
  }

  update() {
    if (!paused) {
      this.v.add(this.a);
      this.p.add(this.v);
      this.collisionTimer.update();
    }
    this.aP = new Vect((this.p.x - camX) / scaleFactor, (this.p.y + camY) / scaleFactor);
  }

  drawBody() {
    fill(this.col);
    if (this.mouseOver() && (mode === 1 || mode === 2)) {
      stroke("red");
      strokeWeight(5);
    } else { noStroke(); }
    circle(this.aP.x, this.aP.y, this.r * 2 / scaleFactor);
  }

  mouseOver() {
    return dist(this.p.x - (this.aP.x - mouseX) * scaleFactor, this.p.y - (this.aP.y - mouseY) * scaleFactor, this.p.x, this.p.y) <= this.r;
  }
}

class Button {
  constructor(x, y, w, h, text, func = function() {console.log("Empty function");}) {
    this.x = x;
    this.y = y;
    this.lx = 0;
    this.ly = 0;
    this.w = w;
    this.h = h;
    this.text = text;
    this.func = func;
    this.textSize = 24;
  }

  mouseOver() {
    return mouseX > this.x + this.lx && mouseX < this.x + this.lx + this.w && mouseY > this.y + this.ly && mouseY < this.y + this.ly + this.h;
  }
  
  onClick() {
    this.func();
  }

  drawButton() {
    fill("white");
    stroke("black");
    strokeWeight(2);
    rect(this.x + this.lx, this.y + this.ly, this.w, this.h);
    fill("black");
    noStroke();
    textSize(this.textSize);
    textAlign(CENTER, CENTER);
    text(this.text, this.x + this.lx + this.w/2, this.y + this.ly + this.h/2);
  }
}

class Timer {
  #end;
  
  constructor(t) {
    this.t = t;
    this.#end = t;
  }

  update() {
    if (this.t < this.#end) {
      this.t++;
    }
  }

  start() {
    this.t = 0;
  }

  cut() {
    this.t = this.#end;
  }

  done() {
    return this.t === this.#end;
  }
}

class Stat {
  constructor(b) {
    this.body = b;
    this.buttons = [
      new Button(1030, 0, 50, 20, "RENAME", renameBody),
      new Button(1030, 0, 50, 20, "FOLLOW", followBody),
      new Button(1030, 0, 50, 20, "DELETE", deleteBody)
    ];

    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].textSize = 10;
    }
  }

  drawStat(y) {
    fill(128, 128, 128, 200);
    noStroke();
    rect(1020 + statsDX, y, 360, 150);
    textSize(18);
    textAlign(LEFT, TOP);
    fill("black");
    text(this.body.name, 1020 + statsDX + 10, y + 10);

    for (let i = 0; i < 3; i++) {
      this.buttons[i].lx = statsDX;
      this.buttons[i].ly = y + 50 + 35 * i;
      this.buttons[i].drawButton();
    }

    textSize(10);
    textAlign(RIGHT, TOP);
    text("pos: (" + this.body.p.x.toFixed(3) + ", " + this.body.p.y.toFixed(3) + ")", 1370 + statsDX, y + 50);
    text("vel: (" + (this.body.v.x * 60 * simSampleRate).toFixed(3) + ", " + (this.body.v.y * 60 * simSampleRate).toFixed(3) + ")", 1370 + statsDX, y + 80);
    text("acc: (" + (this.body.a.x * 60 * sqr(sqr(simSampleRate))).toFixed(3) + ", " + (this.body.a.y * 60 * sqr(simSampleRate)).toFixed(3) + ")", 1370 + statsDX, y + 110);
  }
}

// -------------------- BUTTON FUNCTIONS --------------------

function setMass() {
  let input = parseFloat(window.prompt("Enter the mass:"));

  if (Number.isNaN(input) || input < 0) {
    window.alert("Please input a positive number.");
  } else { mass = input; }
}

function setRadius() {
  let input = parseFloat(window.prompt("Enter the radius:"));

  if (Number.isNaN(input) || input < 0) {
    window.alert("Please input a positive number.");
  } else { radius = input; }
}

function setColour() {
  let r = parseFloat(window.prompt("Enter an r value:"));
  if (Number.isNaN(r) || r < 0 || r > 255) { window.alert("Please input a number between 0 and 255"); return; }
  let g = parseFloat(window.prompt("Enter a g value:"));
  if (Number.isNaN(g) || g < 0 || g > 255) { window.alert("Please input a number between 0 and 255"); return; }
  let b = parseFloat(window.prompt("Enter a b value:"));
  if (Number.isNaN(b) || b < 0 || b > 255) { window.alert("Please input a number between 0 and 255"); return; }

  col = color(r, g, b);
}

function toggleMode() {
  mode++; mode %= 6;
  if (mode === 0) { settingsButtons[3].text = "MODE: CREATE"; }
  else if (mode === 1) { settingsButtons[3].text = "MODE: DELETE"; }
  else if (mode === 2) { settingsButtons[3].text = "MODE: EXPLODE"; }
  else if (mode === 3) { settingsButtons[3].text = "MODE: PULSE"; }
  else if (mode === 4) { settingsButtons[3].text = "MODE: SWIRL"; }
  else if (mode === 5) { settingsButtons[3].text = "MODE: OBSERVE"; }
}

function toggleCollisions() {
  collisions = !collisions;
  if (collisions) { settingsButtons[4].text = "COLLISIONS: ON"; }
  else { settingsButtons[4].text = "COLLISIONS: OFF"; }
}

function setSampleRate() {
  if (paused) {
    let ini = simSampleRate;
    let input = parseInt(window.prompt("Enter the sample rate (the number of simulation samples taken per frame):"));
    if (Number.isNaN(input) || input < 0) {
      window.alert("Please input a positive number.");
    } else { 
      simSampleRate = input;
      let ratio = ini / simSampleRate;
      for (let i = 0; i < bodies.length; i++) {
        bodies[i].v = new Vect(bodies[i].v.x * ratio, bodies[i].v.y * ratio);
      }
    }
  } else {
    window.alert("You cannot alter the simulation accuracy while the simluation is running. Please pause the simulation and try again.");
  }
}

function setSimSpeed() {
  let input = parseFloat(window.prompt("Enter the sim speed:"));

  if (Number.isNaN(input) || input < 0) {
    window.alert("Please input a positive number.");
  } else if (input < 1 / simSampleRate) {
    window.alert("The sim speed times the sample rate cannot be less than 1.");
  } else { simSpeed = input; }
}

function renameBody() {
  let n = window.prompt("Enter a name:");
  bodies[selected].name = n;
}

function deleteBody() {
  if (selected === follow) following = false;
  bodies.splice(selected, 1);
}

function followBody() {
  following = true;
}

function nextPage() {
  page++;
}

function previousPage() {
  if (page > 0) page--;
}

// -------------------- ANIMATION FUNCTIONS --------------------

function settingsAnimation1() {
  let time = settingsAnimTimer.t;
  return 5.6 * sqr(time);
}

function settingsAnimation2() {
  let time = settingsAnimTimer.t;
  return 5.6 * sqr(10 - time);
}

function statsAnimation1() {
  let time = statsAnimTimer.t;
  return 4 * time * (20 - time);
}

function statsAnimation2() {
  let time = statsAnimTimer.t;
  return 4 * time * (time - 20) + 400;
}