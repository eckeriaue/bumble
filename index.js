"use strict"


window.addEventListener("load",function() {

  let idAnim

  const initSpeed = 1
  const rMin = 15
  const rMax = 55
  let canv, ctx
  let maxx, maxy 
  let particles
  let click
  let initDir
  let noiseInitDir
  let initHue
  let noiseInitHue
  let mouseX = -100, mouseY = -100 


  const mrandom = Math.random
  const mfloor = Math.floor
  const mround = Math.round
  const mceil = Math.ceil
  const mabs = Math.abs
  const mmin = Math.min
  const mmax = Math.max

  const mPI = Math.PI
  const mPIS2 = Math.PI / 2
  const m2PI = Math.PI * 2
  const msin = Math.sin
  const mcos = Math.cos
  const matan2 = Math.atan2

  const mhypot = Math.hypot
  const msqrt = Math.sqrt

  const rac3   = msqrt(3)
  const rac3s2 = rac3 / 2
  const mPIS3 = Math.PI / 3


  function alea (min, max) {

    if (typeof max == 'undefined') return min * mrandom()
    return min + (max - min) * mrandom()
  }


  function intAlea (min, max) {

    if (typeof max == 'undefined') {
      max = min
      min = 0
    }
    return mfloor(min + (max - min) * mrandom())
  } 

  function NoiseGen(rndFunc, period, nbHarmonics, attenHarmonics, lowValue = 0, highValue = 1) {

  let arP0 = [] 
  let arP1 = [] 
  let amplitudes = [] 
  let increments = [] 
  let phases = []
  let globAmplitude = 0
  if (!rndFunc) rndFunc = Math.random 
  if (nbHarmonics < 1) nbHarmonics = 1

  for (let kh = 1; kh <= nbHarmonics; ++kh) {
    arP0[kh] = rndFunc()
    arP1[kh] = rndFunc()
    amplitudes[kh] = (kh == 1) ? 1 : (amplitudes[kh - 1] * attenHarmonics)
    globAmplitude += amplitudes[kh]
    increments[kh] = kh / period
    phases[kh] = rndFunc()
  } // for kh

  amplitudes.forEach ((value, kh) => amplitudes[kh] = value / globAmplitude * (highValue - lowValue))

  return function () {
    let pf, pfl
    let signal = 0
    for (let kh = nbHarmonics; kh >= 1; --kh) {
      pf = phases[kh] += increments[kh]
      if (phases[kh] >= 1) {
        pf = phases[kh] -= 1
        arP0[kh] = arP1[kh]
        arP1[kh] = rndFunc()
      }
      pfl = pf * pf * (3 - 2 * pf) 
      signal += (arP0[kh] * (1 - pfl) + arP1[kh] * pfl) * amplitudes[kh]
    }
    return signal + lowValue
  }
  }

  function intermediate (p0, p1, alpha) {

    return [(1 - alpha) * p0[0] + alpha * p1[0],
            (1 - alpha) * p0[1] + alpha * p1[1]]
  } 

  function distance (p0, p1) {


    return mhypot (p0[0] - p1[0], p0[1] - p1[1])

  } 


  function randomElement(array) {
    return array[intAlea(array.length)]
  }


  function removeElement(array, element) {
    let idx = array.indexOf(element)
    if (idx == -1) throw ('Bug ! indexOf -1 in removeElement')
    array.splice(idx, 1)
  } // removeElement


//-----------------------------------------------------------------------------
function clonePoint(p) {
  return [p[0],p[1]]
}

//-----------------------------------------------------------------------------
function Particle () {

  let hue = (initHue + alea(-40,40)) % 360

  this.x = maxx / 2
  this.y = maxy / 2
  this.dir = initDir + alea(-mPI / 10, mPI / 10)

  this.speed = initSpeed * alea(0.8, 1.4)

  this.genddir = NoiseGen(null, 100, 2, 0.8, -0.03, 0.03)

  this.genR = NoiseGen(null, 100, 1, 0, rMin, rMax)
  this.r0 = this.genR()
  this.r = 0.1

  this.color1 = `hsl(${hue},100%,50%)`
  this.color2 = `hsl(${hue},100%,80%)`
  this.state = 0 // growth

} // Particle


Particle.prototype.move = function () {

  this.dir = (this.dir + this.genddir()) % m2PI
  this.speed += 0.01

  this.x += this.speed * mcos(this.dir)
  this.y += this.speed * msin(this.dir)

  if (this.y < -this.r || this.y > maxy + this.r || this.x < -this.r || this.x > maxx + this.r) return false

  if (this.state != 2) { // if not yet exploding, test mouse distance
    let dx = mouseX - this.x
    let dy = mouseY - this.y
    if (mhypot (dx, dy) <= this.r) {
      this.state = 2
      this.r1 = 0
    }
  }

  switch (this.state) {
    case 0 : this.r += 0.2
             if (this.r > this.r0 ) this.state = 1
             break
    case 1 : this.r = this.genR()
             break
    case 2 : this.r += 1
             this.r1 += 4 // innermost circle grows faster
             if (this.r1 > this.r) return false // the end
    }

  return true
} // Particle.move


Particle.prototype.draw = function () {

if (this.state != 2) {
  ctx.beginPath()
  ctx.arc(this.x, this.y,this.r,0,m2PI)
  ctx.fillStyle = this.color1
  ctx.fill()

/* amazing 3D effect */
  ctx.beginPath()
  ctx.arc(this.x + this.r / 3.5, this.y - this.r / 3.5 ,this.r / 2,0,m2PI)
  ctx.fillStyle = this.color2
  ctx.fill()

} else {

  ctx.strokeStyle = this.color1
  ctx.beginPath()
  ctx.arc(this.x, this.y,this.r,0,m2PI)
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.strokeStyle = this.color1
  ctx.beginPath()
  ctx.arc(this.x, this.y,this.r1,0,m2PI)
  ctx.lineWidth = 2
  ctx.stroke()
}

} // Particle.draw


function startOver() {


  maxx = window.innerWidth
  maxy = window.innerHeight

  if (maxx < 10) return false

  canv.style.left = ((window.innerWidth ) - maxx) / 2 + 'px'
  canv.style.top = ((window.innerHeight ) - maxy) / 2 + 'px'

  ctx.canvas.width = maxx
  ctx.canvas.height = maxy
  ctx.lineJoin = 'round'   // placed here because reset when canvas resized

  noiseInitDir = NoiseGen(null, 200,0,0,-0.03,0.03)
  noiseInitHue = NoiseGen(null, 500,1,0.8,-2,2)
  particles = []

  initDir = alea(m2PI)
  initHue = alea(360)

  return true 

} // startOver

function mouseMove(event) {

  mouseX = event.clientX
  mouseY = event.clientY
}


function animate(tStamp) {
  if (idAnim) window.cancelAnimationFrame(idAnim)
  idAnim = undefined

  if (click && startOver()) click = false
  if (particles) {
    initDir += noiseInitDir()
    initDir %= m2PI
    initHue += noiseInitHue()
    initHue %= 360
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, maxx, maxy)
    if (particles.length < 50) {
      particles.push(new Particle())
    }
    particles.forEach((part,k) => {
      if (part.move() == false ) {
        removeElement(particles, part)
      } else part.draw()
    })
  }
  idAnim = window.requestAnimationFrame(animate)

} // animate

  {
    canv = document.createElement('canvas')
    canv.style.position="absolute"
    document.body.appendChild(canv)
    ctx = canv.getContext('2d')
  } // canvas creation

  window.addEventListener('mousemove',mouseMove)

  animate()
  click = true // to run startOver

}) // window load listener
