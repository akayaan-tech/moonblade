function canvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  texture.refresh();
  return texture;
}

function outlined(ctx, fill, stroke = '#142124', lineWidth = 4) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fill();
  ctx.stroke();
}

export function ensureTextures(scene) {
  canvasTexture(scene, 'grass-tile', 192, 192, (c, w, h) => {
    c.fillStyle = '#284532';
    c.fillRect(0, 0, w, h);
    const grad = c.createRadialGradient(88, 80, 4, 92, 90, 142);
    grad.addColorStop(0, 'rgba(109,139,69,.18)');
    grad.addColorStop(1, 'rgba(9,25,22,.19)');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    let seed = 7123;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 72; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const len = 2 + rand() * 6;
      c.strokeStyle = i % 4 ? 'rgba(153,180,99,.12)' : 'rgba(9,25,21,.18)';
      c.lineWidth = 1 + rand();
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + (rand() - 0.5) * 5, y - len * 0.5, x + (rand() - 0.5) * 8, y - len);
      c.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = rand() * w;
      const y = rand() * h;
      c.fillStyle = i % 2 ? 'rgba(16,34,28,.16)' : 'rgba(174,165,89,.12)';
      c.beginPath();
      c.ellipse(x, y, 3 + rand() * 5, 2 + rand() * 3, rand() * 3.14, 0, Math.PI * 2);
      c.fill();
    }
  });

  canvasTexture(scene, 'tuft', 48, 48, (c) => {
    c.save();
    c.translate(24, 27);
    c.fillStyle = 'rgba(7,20,17,.24)';
    c.beginPath(); c.ellipse(0, 7, 13, 5, 0, 0, Math.PI * 2); c.fill();
    const blades = [[-9, -3, -12, -14], [-5, -2, -5, -18], [0, 0, 1, -15], [4, -1, 10, -19], [8, -3, 14, -13]];
    for (let i = 0; i < blades.length; i++) {
      const [x, y, tx, ty] = blades[i];
      c.strokeStyle = ['#81975b', '#a1aa69', '#718e55', '#8aa263', '#596f48'][i];
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 3, ty + 6, tx, ty); c.stroke();
    }
    c.restore();
  });

  canvasTexture(scene, 'flower', 42, 42, (c) => {
    c.fillStyle = 'rgba(7,20,17,.23)'; c.beginPath(); c.ellipse(21, 29, 12, 5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#69954f'; c.lineWidth = 3; c.beginPath(); c.moveTo(21, 27); c.lineTo(22, 12); c.stroke();
    c.fillStyle = '#d88dbe';
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; c.beginPath(); c.arc(22 + Math.cos(a) * 6, 11 + Math.sin(a) * 6, 3.8, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ffe291'; c.beginPath(); c.arc(22, 11, 3, 0, Math.PI * 2); c.fill();
  });

  canvasTexture(scene, 'player', 112, 128, (c) => {
    c.save();
    c.shadowColor = 'rgba(4,10,13,.55)'; c.shadowBlur = 9;
    c.fillStyle = 'rgba(3,9,13,.38)'; c.beginPath(); c.ellipse(56, 115, 27, 8, 0, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
    // Boots and legs
    c.beginPath(); c.moveTo(35, 89); c.lineTo(52, 92); c.lineTo(48, 112); c.quadraticCurveTo(46, 120, 36, 120); c.lineTo(28, 117); c.lineTo(31, 108); c.closePath(); outlined(c, '#182129', '#090e13', 4);
    c.beginPath(); c.moveTo(60, 92); c.lineTo(77, 88); c.lineTo(82, 106); c.lineTo(88, 115); c.quadraticCurveTo(80, 123, 67, 119); c.lineTo(59, 112); c.closePath(); outlined(c, '#202a32', '#090e13', 4);
    c.fillStyle = '#070c12'; c.beginPath(); c.ellipse(36, 117, 12, 6, -0.14, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(79, 117, 12, 6, 0.12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#70808b'; c.lineWidth = 2; c.beginPath(); c.moveTo(33, 116); c.lineTo(41, 117); c.moveTo(74, 118); c.lineTo(83, 118); c.stroke();
    // Torso
    c.beginPath(); c.moveTo(35, 53); c.quadraticCurveTo(56, 45, 77, 54); c.lineTo(83, 88); c.quadraticCurveTo(57, 101, 29, 89); c.closePath(); outlined(c, '#17212a', '#090e13', 4);
    c.fillStyle = '#33414b'; c.beginPath(); c.moveTo(47, 57); c.lineTo(55, 60); c.lineTo(48, 90); c.lineTo(39, 88); c.closePath(); c.fill();
    c.fillStyle = '#080e14'; c.beginPath(); c.moveTo(60, 59); c.lineTo(68, 56); c.lineTo(77, 87); c.lineTo(68, 90); c.closePath(); c.fill();
    c.strokeStyle = '#60717c'; c.lineWidth = 2; c.beginPath(); c.moveTo(46, 67); c.lineTo(64, 74); c.stroke();
    // Arms, folded in front
    c.beginPath(); c.moveTo(32, 59); c.quadraticCurveTo(23, 61, 26, 73); c.lineTo(43, 81); c.lineTo(53, 74); c.lineTo(43, 67); c.closePath(); outlined(c, '#222d35', '#080e13', 4);
    c.beginPath(); c.moveTo(77, 59); c.quadraticCurveTo(87, 62, 84, 73); c.lineTo(66, 81); c.lineTo(55, 74); c.lineTo(66, 66); c.closePath(); outlined(c, '#202b34', '#080e13', 4);
    c.fillStyle = '#e8c4a6'; c.beginPath(); c.ellipse(46, 75, 8, 4, 0.25, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(66, 75, 8, 4, -0.2, 0, Math.PI * 2); c.fill();
    // Neck and face
    c.fillStyle = '#d8b393'; c.fillRect(48, 44, 16, 15);
    c.beginPath(); c.ellipse(56, 37, 21, 24, 0, 0, Math.PI * 2); outlined(c, '#e5c4a4', '#12161b', 3.2);
    // Ear accents
    c.fillStyle = '#dfb999'; c.beginPath(); c.ellipse(35, 39, 4, 7, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(77, 39, 4, 7, 0, 0, Math.PI * 2); c.fill();
    // Fringe and white spiky hair
    c.beginPath(); c.moveTo(36, 34); c.lineTo(28, 24); c.lineTo(38, 26); c.lineTo(32, 13); c.lineTo(47, 22); c.lineTo(49, 7); c.lineTo(57, 20); c.lineTo(69, 6); c.lineTo(68, 23); c.lineTo(84, 17); c.lineTo(76, 32); c.lineTo(72, 40); c.lineTo(66, 31); c.lineTo(60, 39); c.lineTo(54, 29); c.lineTo(46, 38); c.lineTo(42, 30); c.closePath(); outlined(c, '#f2f5ef', '#9cabb2', 2.7);
    c.strokeStyle = '#c2d1d2'; c.lineWidth = 2; c.beginPath(); c.moveTo(44, 20); c.lineTo(52, 27); c.moveTo(67, 17); c.lineTo(64, 27); c.moveTo(36, 26); c.lineTo(45, 29); c.stroke();
    // Brows and eyes
    c.strokeStyle = '#333139'; c.lineWidth = 2.7; c.beginPath(); c.moveTo(42, 38); c.lineTo(50, 36); c.moveTo(62, 36); c.lineTo(70, 38); c.stroke();
    c.fillStyle = '#f8f5ec'; c.beginPath(); c.ellipse(46, 42, 4.2, 2.5, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(66, 42, 4.2, 2.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#152b3c'; c.beginPath(); c.arc(47, 42, 1.8, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(65, 42, 1.8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#9f6c5e'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(53, 48); c.lineTo(56, 49); c.moveTo(52, 54); c.quadraticCurveTo(57, 57, 62, 53); c.stroke();
    c.restore();
  });

  canvasTexture(scene, 'blade', 80, 80, (c) => {
    c.save(); c.shadowColor = '#ffbd39'; c.shadowBlur = 20;
    c.beginPath(); c.moveTo(56, 8); c.bezierCurveTo(29, 11, 15, 33, 24, 53); c.bezierCurveTo(31, 70, 51, 75, 66, 61); c.bezierCurveTo(49, 64, 38, 54, 38, 40); c.bezierCurveTo(38, 27, 45, 17, 56, 8); c.closePath();
    const grad = c.createLinearGradient(22, 14, 66, 68); grad.addColorStop(0, '#fff2ad'); grad.addColorStop(0.4, '#ffcc54'); grad.addColorStop(1, '#d87926'); c.fillStyle = grad; c.fill();
    c.shadowBlur = 0; c.strokeStyle = '#fff4bf'; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(49, 18); c.quadraticCurveTo(32, 34, 35, 48); c.stroke();
    c.restore();
  });

  canvasTexture(scene, 'slime', 80, 80, (c) => {
    c.fillStyle = 'rgba(0,0,0,.24)'; c.beginPath(); c.ellipse(40, 67, 24, 7, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(17, 57); c.quadraticCurveTo(11, 43, 18, 33); c.lineTo(24, 17); c.lineTo(33, 26); c.quadraticCurveTo(42, 8, 49, 22); c.lineTo(61, 14); c.lineTo(62, 31); c.quadraticCurveTo(73, 43, 64, 58); c.quadraticCurveTo(42, 69, 17, 57); c.closePath();
    const g = c.createRadialGradient(33, 29, 3, 42, 44, 39); g.addColorStop(0, '#adffe0'); g.addColorStop(.36, '#58d9ac'); g.addColorStop(1, '#1c806f'); outlined(c, g, '#123b39', 4);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(29, 32, 7, 3.4, -.55, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#effff1'; c.beginPath(); c.ellipse(33, 44, 5.5, 7, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(49, 44, 5.5, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#142126'; c.beginPath(); c.ellipse(34, 46, 2.3, 4, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(48, 46, 2.3, 4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#164e48'; c.lineWidth = 2; c.beginPath(); c.moveTo(38, 56); c.quadraticCurveTo(42, 60, 47, 55); c.stroke();
  });

  canvasTexture(scene, 'sun', 96, 96, (c) => {
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(48, 78, 28, 8, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(48, 46); c.shadowColor = '#ffb830'; c.shadowBlur = 14;
    c.beginPath();
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; const r = i % 2 ? 34 : 43; const x = Math.cos(a) * r; const y = Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); const g = c.createRadialGradient(-9, -13, 2, 0, 0, 43); g.addColorStop(0, '#fff7a8'); g.addColorStop(.53, '#ffd54d'); g.addColorStop(1, '#ea892e'); outlined(c, g, '#70452a', 4);
    c.shadowBlur = 0;
    c.fillStyle = '#d46b2a'; c.beginPath(); c.ellipse(-13, 3, 4, 2.5, -.35, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(13, 3, 4, 2.5, .35, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#452d28'; c.beginPath(); c.ellipse(-8, -3, 3.1, 5, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(8, -3, 3.1, 5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#68412a'; c.lineWidth = 2.3; c.beginPath(); c.moveTo(-5, 13); c.quadraticCurveTo(0, 9, 5, 13); c.stroke();
    c.restore();
  });

  canvasTexture(scene, 'ranged', 80, 80, (c) => {
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(40, 66, 20, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(40, 11); c.lineTo(63, 33); c.lineTo(61, 53); c.lineTo(40, 66); c.lineTo(19, 53); c.lineTo(17, 33); c.closePath(); const g = c.createLinearGradient(22, 20, 58, 61); g.addColorStop(0, '#e8baff'); g.addColorStop(.5, '#9868cd'); g.addColorStop(1, '#3e387c'); outlined(c, g, '#251e50', 4);
    c.strokeStyle = '#ccecff'; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 15); c.lineTo(40, 27); c.stroke(); c.fillStyle = '#ff7bb9'; c.beginPath(); c.arc(40, 14, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff6ec'; c.beginPath(); c.ellipse(33, 39, 4, 5, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(48, 39, 4, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#28234c'; c.beginPath(); c.arc(34, 40, 2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(47, 40, 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#302653'; c.lineWidth = 2; c.beginPath(); c.moveTo(36, 52); c.quadraticCurveTo(41, 55, 45, 51); c.stroke();
  });

  canvasTexture(scene, 'elite', 100, 100, (c) => {
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(50, 79, 27, 8, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(50, 11); c.lineTo(59, 26); c.lineTo(79, 22); c.lineTo(72, 41); c.lineTo(84, 56); c.lineTo(64, 60); c.lineTo(55, 76); c.lineTo(42, 63); c.lineTo(22, 68); c.lineTo(27, 48); c.lineTo(15, 34); c.lineTo(36, 30); c.closePath(); const g = c.createRadialGradient(39, 34, 4, 51, 48, 40); g.addColorStop(0, '#ffb5e2'); g.addColorStop(.45, '#a051d2'); g.addColorStop(1, '#38235f'); outlined(c, g, '#221a38', 4);
    c.fillStyle = '#fff0fa'; c.beginPath(); c.ellipse(41, 44, 4.5, 6, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(60, 44, 4.5, 6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#311e4c'; c.beginPath(); c.arc(42, 45, 2.5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(59, 45, 2.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f5d1ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(43, 58); c.lineTo(58, 58); c.stroke();
    c.fillStyle = '#ffde70'; c.beginPath(); c.arc(50, 28, 5, 0, Math.PI * 2); c.fill();
  });

  canvasTexture(scene, 'boss', 160, 160, (c) => {
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(80, 132, 50, 13, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(80, 78); c.shadowColor = '#e6475f'; c.shadowBlur = 19;
    c.beginPath();
    for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; const r = i % 2 ? 52 : 66; const x = Math.cos(a) * r; const y = Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); const g = c.createRadialGradient(-15, -22, 3, 0, 0, 68); g.addColorStop(0, '#ffc4ad'); g.addColorStop(.25, '#c05067'); g.addColorStop(.7, '#4b2b46'); g.addColorStop(1, '#161c30'); outlined(c, g, '#130f21', 7);
    c.shadowBlur = 0;
    c.fillStyle = '#211b2e'; c.beginPath(); c.moveTo(45, 55); c.lineTo(60, 29); c.lineTo(70, 57); c.closePath(); c.fill(); c.beginPath(); c.moveTo(115, 55); c.lineTo(100, 29); c.lineTo(90, 57); c.closePath(); c.fill();
    c.fillStyle = '#ffe29a'; c.shadowColor = '#ff9a4d'; c.shadowBlur = 10; c.beginPath(); c.ellipse(-22, -4, 8, 5, -.1, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(22, -4, 8, 5, .1, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ff704d'; c.beginPath(); c.ellipse(-22, -4, 3, 4, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(22, -4, 3, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#190f1a'; c.beginPath(); c.moveTo(-18, 20); c.lineTo(-9, 16); c.lineTo(-3, 23); c.lineTo(4, 16); c.lineTo(17, 21); c.lineTo(11, 33); c.lineTo(-10, 33); c.closePath(); c.fill();
    c.fillStyle = '#fff0c7'; c.beginPath(); c.moveTo(-8, 21); c.lineTo(-4, 28); c.lineTo(0, 21); c.closePath(); c.fill(); c.beginPath(); c.moveTo(5, 21); c.lineTo(8, 28); c.lineTo(11, 21); c.closePath(); c.fill();
    c.strokeStyle = '#f6a4a3'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -48); c.lineTo(0, -25); c.stroke(); c.fillStyle = '#ffdc87'; c.beginPath(); c.arc(0, -49, 6, 0, Math.PI * 2); c.fill();
    c.restore();
  });

  canvasTexture(scene, 'xp-orb', 48, 48, (c) => {
    c.save(); c.shadowColor = '#ffdc73'; c.shadowBlur = 15;
    c.beginPath(); c.moveTo(32, 6); c.bezierCurveTo(15, 7, 8, 21, 13, 32); c.bezierCurveTo(17, 42, 29, 43, 38, 35); c.bezierCurveTo(27, 38, 20, 29, 22, 20); c.bezierCurveTo(23, 14, 27, 9, 32, 6); c.closePath(); const g = c.createLinearGradient(10, 8, 38, 40); g.addColorStop(0, '#fff2ae'); g.addColorStop(.55, '#ffd34e'); g.addColorStop(1, '#efa136'); c.fillStyle = g; c.fill(); c.strokeStyle = '#fff0a3'; c.lineWidth = 1.5; c.stroke(); c.restore();
  });

  canvasTexture(scene, 'coin', 42, 42, (c) => {
    c.save(); c.shadowColor = '#ffb534'; c.shadowBlur = 11;
    const g = c.createRadialGradient(14, 11, 1, 21, 21, 22); g.addColorStop(0, '#fff5b7'); g.addColorStop(.4, '#ffd05b'); g.addColorStop(1, '#d47e2d');
    c.fillStyle = g; c.strokeStyle = '#fff0a1'; c.lineWidth = 2; c.beginPath(); c.arc(21, 21, 15, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = '#a96735'; c.lineWidth = 1.5; c.beginPath(); c.arc(21, 21, 10, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffe9a0'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✦', 21, 21); c.restore();
  });

  canvasTexture(scene, 'health-orb', 42, 42, (c) => {
    c.save(); c.shadowColor = '#ff7898'; c.shadowBlur = 13;
    const g = c.createRadialGradient(12, 11, 1, 21, 21, 20); g.addColorStop(0, '#fff0e7'); g.addColorStop(.4, '#ff819b'); g.addColorStop(1, '#c83e69');
    c.fillStyle = g; c.strokeStyle = '#ffd4dc'; c.lineWidth = 2; c.beginPath(); c.arc(21, 21, 15, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#fff0e9'; c.beginPath(); c.moveTo(21, 30); c.bezierCurveTo(2, 19, 12, 9, 21, 17); c.bezierCurveTo(30, 9, 40, 19, 21, 30); c.fill(); c.restore();
  });

  canvasTexture(scene, 'projectile', 28, 28, (c) => {
    const g = c.createRadialGradient(14, 14, 1, 14, 14, 14); g.addColorStop(0, '#fff5cb'); g.addColorStop(.35, '#ff9266'); g.addColorStop(1, 'rgba(225,38,65,0)');
    c.fillStyle = g; c.beginPath(); c.arc(14, 14, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd7a1'; c.beginPath(); c.arc(14, 14, 4.5, 0, Math.PI * 2); c.fill();
  });

  canvasTexture(scene, 'monitor-stack', 112, 104, (c) => {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(56, 92, 45, 9, 0, 0, Math.PI * 2); c.fill();
    const monitor = (x, y, w, h, hue, label) => {
      c.fillStyle = '#152126'; c.strokeStyle = '#071013'; c.lineWidth = 3; c.beginPath(); c.roundRect(x, y, w, h, 5); c.fill(); c.stroke();
      const screen = c.createLinearGradient(x, y, x + w, y + h); screen.addColorStop(0, hue); screen.addColorStop(1, '#132c32');
      c.fillStyle = screen; c.strokeStyle = '#60706a'; c.lineWidth = 2; c.beginPath(); c.roundRect(x + 5, y + 5, w - 10, h - 13, 3); c.fill(); c.stroke();
      c.fillStyle = '#d0ddd0'; c.font = `bold ${Math.floor(h * .36)}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w / 2, y + h / 2 - 1);
      c.fillStyle = '#80918a'; c.beginPath(); c.arc(x + w - 8, y + h - 5, 1.6, 0, Math.PI * 2); c.fill();
    };
    monitor(23, 8, 68, 48, '#31545a', '?');
    monitor(8, 46, 55, 39, '#4a4235', '07');
    monitor(55, 47, 48, 40, '#35494d', '⌘');
    c.fillStyle = '#171d20'; c.beginPath(); c.moveTo(18, 85); c.lineTo(94, 85); c.lineTo(100, 91); c.lineTo(13, 91); c.closePath(); c.fill();
  });

  canvasTexture(scene, 'rock', 70, 60, (c) => {
    c.fillStyle = 'rgba(0,0,0,.31)'; c.beginPath(); c.ellipse(36, 48, 29, 8, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(9, 41); c.lineTo(13, 23); c.lineTo(29, 11); c.lineTo(49, 16); c.lineTo(62, 30); c.lineTo(56, 45); c.lineTo(34, 49); c.closePath(); const g = c.createLinearGradient(19, 15, 54, 49); g.addColorStop(0, '#a09d81'); g.addColorStop(.45, '#6b7866'); g.addColorStop(1, '#354f47'); outlined(c, g, '#283a36', 3);
    c.fillStyle = 'rgba(218,220,176,.32)'; c.beginPath(); c.moveTo(15, 26); c.lineTo(29, 14); c.lineTo(45, 19); c.lineTo(30, 23); c.closePath(); c.fill();
  });
}
