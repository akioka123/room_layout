// Utility to convert mm to canvas pixels (simple scaling factor)
const SCALE = 0.1; // 1 mm = 0.1 px (adjustable)
let room = { width: 5900, depth: 2200, height: 2500 };
let objects = [];
let roomFeatures = []; // 部屋の情報（窓、ドア、クローゼットなど）
// Drag‑and‑drop state
let dragging = null; // {obj, offsetX, offsetY}
let draggingFeature = null; // {feature, offset}
// Edit state
let editingObject = null; // 編集中のオブジェクト

/* -------------------------------------------------
   描画関数
------------------------------------------------- */
function drawViews() {
  drawTop();
  drawFront();
  drawSide();
  updateCaptions(); // 各ビューのキャプションを更新
}

/* -------------------------------------------------
   部屋情報描画関数
------------------------------------------------- */
function drawRoomFeature(ctx, feature, offset) {
  const roomW = room.width * SCALE;
  const roomD = room.depth * SCALE;
  const wallLength = feature.wall === 'top' || feature.wall === 'bottom' ? room.width : room.depth;
  const position = Math.max(0, Math.min(wallLength - feature.width, feature.position));
  const width = feature.width * SCALE;
  const pos = position * SCALE;
  
  let x, y, drawWidth, drawDepth;
  let btnX, btnY; // 削除ボタンの位置
  
  ctx.save();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  
  switch (feature.wall) {
    case 'top':
      // 上の壁
      x = pos;
      y = -offset;
      drawWidth = width;
      drawDepth = offset;
      btnX = x + width - 14;
      btnY = y;
      break;
    case 'right':
      // 右の壁
      x = roomW;
      y = pos;
      drawWidth = offset;
      drawDepth = width;
      btnX = x;
      btnY = y + width - 14;
      break;
    case 'bottom':
      // 下の壁
      x = pos;
      y = roomD;
      drawWidth = width;
      drawDepth = offset;
      btnX = x + width - 14;
      btnY = y + offset - 14;
      break;
    case 'left':
      // 左の壁
      x = -offset;
      y = pos;
      drawWidth = offset;
      drawDepth = width;
      btnX = x;
      btnY = y + width - 14;
      break;
  }
  
  // 種類に応じた描画
  if (feature.type === 'window') {
    // 窓: 二重線
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    if (feature.wall === 'top' || feature.wall === 'bottom') {
      // 水平線
      ctx.beginPath();
      ctx.moveTo(x, y + drawDepth / 2);
      ctx.lineTo(x + drawWidth, y + drawDepth / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + drawDepth / 2 - 3);
      ctx.lineTo(x + drawWidth, y + drawDepth / 2 - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + drawDepth / 2 + 3);
      ctx.lineTo(x + drawWidth, y + drawDepth / 2 + 3);
      ctx.stroke();
    } else {
      // 垂直線
      ctx.beginPath();
      ctx.moveTo(x + drawWidth / 2, y);
      ctx.lineTo(x + drawWidth / 2, y + drawDepth);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + drawWidth / 2 - 3, y);
      ctx.lineTo(x + drawWidth / 2 - 3, y + drawDepth);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + drawWidth / 2 + 3, y);
      ctx.lineTo(x + drawWidth / 2 + 3, y + drawDepth);
      ctx.stroke();
    }
  } else if (feature.type === 'door') {
    // ドア: 円弧
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    if (feature.wall === 'top' || feature.wall === 'bottom') {
      // 水平方向のドア
      ctx.beginPath();
      ctx.moveTo(x, y + drawDepth / 2);
      ctx.lineTo(x + drawWidth / 2, y + drawDepth / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + drawWidth / 2, y + drawDepth / 2, drawWidth / 2, 0, Math.PI);
      ctx.stroke();
    } else {
      // 垂直方向のドア
      ctx.beginPath();
      ctx.moveTo(x + drawWidth / 2, y);
      ctx.lineTo(x + drawWidth / 2, y + drawDepth / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + drawWidth / 2, y + drawDepth / 2, drawDepth / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  } else if (feature.type === 'closet') {
    // クローゼット: 矩形とハッチング
    ctx.strokeStyle = '#654321';
    ctx.fillStyle = 'rgba(101, 67, 33, 0.2)';
    ctx.fillRect(x, y, drawWidth, drawDepth);
    ctx.strokeRect(x, y, drawWidth, drawDepth);
    // ハッチング
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    const hatchSpacing = 5;
    if (feature.wall === 'top' || feature.wall === 'bottom') {
      for (let i = x; i < x + drawWidth; i += hatchSpacing) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + drawDepth);
        ctx.stroke();
      }
    } else {
      for (let i = y; i < y + drawDepth; i += hatchSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, i);
        ctx.lineTo(x + drawWidth, i);
        ctx.stroke();
      }
    }
  }
  
  // 削除ボタン (×) を描画
  const btnSize = 14;
  ctx.fillStyle = 'red';
  ctx.fillRect(btnX, btnY, btnSize, btnSize);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('×', btnX + btnSize / 2, btnY + btnSize / 2);
  
  ctx.restore();
}

/* -------------------------------------------------
   オブジェクト回転関数
------------------------------------------------- */
function rotateObject90(obj) {
  // オブジェクトの中心座標を計算
  const centerX = obj.x + obj.w / 2;
  const centerY = obj.y + obj.d / 2;
  
  // 幅と奥行きを入れ替え
  const tempW = obj.w;
  obj.w = obj.d;
  obj.d = tempW;
  
  // 中心を基準に新しい位置を計算
  obj.x = centerX - obj.w / 2;
  obj.y = centerY - obj.d / 2;
  
  // 部屋の境界内に収める
  obj.x = Math.max(0, Math.min(room.width - obj.w, obj.x));
  obj.y = Math.max(0, Math.min(room.depth - obj.d, obj.y));
}

function drawTop() {
  const canvas = document.getElementById('topView');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 描画位置をオフセット（部屋の外側が見えるように）
  const featureOffset = 30; // 部屋の外側へのオフセット（px）
  const roomW = room.width * SCALE;
  const roomD = room.depth * SCALE;
  
  // 部屋の描画領域全体（部屋 + 周囲の余白）のサイズ
  const totalW = roomW + featureOffset * 2;
  const totalD = roomD + featureOffset * 2;
  
  // canvasの中央に配置するためのオフセット
  const centerX = (canvas.width - totalW) / 2;
  const centerY = (canvas.height - totalD) / 2;
  
  ctx.save();
  ctx.translate(centerX + featureOffset, centerY + featureOffset);
  
  // 部屋枠
  ctx.strokeStyle = '#000';
  ctx.strokeRect(0, 0, roomW, roomD);
  
  // 部屋の情報（窓、ドア、クローゼットなど）を描画
  roomFeatures.forEach(feature => {
    drawRoomFeature(ctx, feature, featureOffset);
  });
  
  // オブジェクト（色を使用）
  objects.forEach(o => {
    ctx.fillStyle = o.color || 'rgba(0,150,255,0.5)';
    ctx.fillRect(o.x * SCALE, o.y * SCALE, o.w * SCALE, o.d * SCALE);

    // オブジェクトの中心座標を計算
    const centerX = (o.x + o.w / 2) * SCALE;
    const centerY = (o.y + o.d / 2) * SCALE;
    
    ctx.fillStyle = '#000'; // 文字色
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 名前を描画
    if (o.name) {
      ctx.font = '12px sans-serif';
      ctx.fillText(o.name, centerX, centerY - 8);
    }
    
    // サイズ情報を描画（名前の下、または名前がない場合は中心）
    ctx.font = '10px sans-serif';
    const sizeText = `${o.w}mm × ${o.d}mm`;
    const sizeY = o.name ? centerY + 8 : centerY;
    ctx.fillText(sizeText, centerX, sizeY);
  });
  
  ctx.restore();
}

function drawFront() {
  const canvas = document.getElementById('frontView');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeRect(0, 0, room.width * SCALE, room.height * SCALE);
  objects.forEach(o => {
    ctx.fillStyle = o.color || 'rgba(0,150,255,0.5)';
    ctx.fillRect(o.x * SCALE, (room.height - o.h - o.z) * SCALE, o.w * SCALE, o.h * SCALE);
  });
}

function drawSide() {
  const canvas = document.getElementById('sideView');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeRect(0, 0, room.depth * SCALE, room.height * SCALE);
  objects.forEach(o => {
    ctx.fillStyle = o.color || 'rgba(0,150,255,0.5)';
    ctx.fillRect(o.y * SCALE, (room.height - o.h - o.z) * SCALE, o.d * SCALE, o.h * SCALE);
  });
}

/* -------------------------------------------------
   UI ハンドラ（部屋サイズ）
------------------------------------------------- */
document.getElementById('roomWidth').addEventListener('change', e => {
  room.width = +e.target.value;
  drawViews();
});
document.getElementById('roomDepth').addEventListener('change', e => {
  room.depth = +e.target.value;
  drawViews();
});
document.getElementById('roomHeight').addEventListener('change', e => {
  room.height = +e.target.value;
  drawViews();
});

/* -------------------------------------------------
   オブジェクト追加 UI
------------------------------------------------- */
document.getElementById('addObjectBtn').addEventListener('click', () => {
  document.getElementById('objectForm').classList.remove('hidden');
});

document.getElementById('confirmAddBtn').addEventListener('click', () => {
  const name = document.getElementById('objName').value;
  const w = +document.getElementById('objW').value;
  const d = +document.getElementById('objD').value;
  const h = +document.getElementById('objH').value;
  const x = +document.getElementById('objX').value;
  const y = +document.getElementById('objY').value;
  const z = +document.getElementById('objZ').value;
  const color = document.getElementById('objColor').value;
  const stackable = document.getElementById('objStackable').checked;
  objects.push({ name, w, d, h, x, y, z, color, stackable });
  drawViews();

  document.getElementById('objectForm').classList.add('hidden');
});

document.getElementById('cancelAddBtn').addEventListener('click', () => {
  document.getElementById('objectForm').classList.add('hidden');
});

/* -------------------------------------------------
   オブジェクト編集 UI
------------------------------------------------- */
function openEditPanel(obj) {
  editingObject = obj;
  
  // フォームに現在の値を設定
  document.getElementById('editObjName').value = obj.name || '';
  document.getElementById('editObjW').value = obj.w;
  document.getElementById('editObjD').value = obj.d;
  document.getElementById('editObjH').value = obj.h;
  document.getElementById('editObjX').value = obj.x;
  document.getElementById('editObjY').value = obj.y;
  document.getElementById('editObjZ').value = obj.z || 0;
  document.getElementById('editObjColor').value = obj.color || 'rgba(0,150,255,0.5)';
  document.getElementById('editObjStackable').checked = obj.stackable !== undefined ? obj.stackable : true;
  
  // パネルを表示
  document.getElementById('editObjectForm').classList.remove('hidden');
}

function closeEditPanel() {
  editingObject = null;
  document.getElementById('editObjectForm').classList.add('hidden');
}

function updateObject() {
  if (!editingObject) return;
  
  const name = document.getElementById('editObjName').value;
  const w = +document.getElementById('editObjW').value;
  const d = +document.getElementById('editObjD').value;
  const h = +document.getElementById('editObjH').value;
  const x = +document.getElementById('editObjX').value;
  const y = +document.getElementById('editObjY').value;
  const z = +document.getElementById('editObjZ').value;
  const color = document.getElementById('editObjColor').value;
  const stackable = document.getElementById('editObjStackable').checked;
  
  // 部屋の境界内に収める
  const newX = Math.max(0, Math.min(room.width - w, x));
  const newY = Math.max(0, Math.min(room.depth - d, y));
  const newZ = Math.max(0, Math.min(room.height - h, z));
  
  // サイズが部屋を超えないようにする
  const validW = Math.min(w, room.width - newX);
  const validD = Math.min(d, room.depth - newY);
  const validH = Math.min(h, room.height - newZ);
  
  // 重なりチェック（stackableがfalseの場合）
  if (!stackable) {
    const tempObj = { ...editingObject, w: validW, d: validD, stackable: false };
    if (checkOverlap(tempObj, newX, newY, true)) {
      alert('他のオブジェクトと重なっています。重ねられるオプションを有効にするか、位置を変更してください。');
      return;
    }
  }
  
  // オブジェクトを更新
  editingObject.name = name;
  editingObject.w = validW;
  editingObject.d = validD;
  editingObject.h = validH;
  editingObject.x = newX;
  editingObject.y = newY;
  editingObject.z = newZ;
  editingObject.color = color;
  editingObject.stackable = stackable;
  
  drawViews();
  closeEditPanel();
}

function deleteEditingObject() {
  if (!editingObject) return;
  
  const index = objects.indexOf(editingObject);
  if (index !== -1) {
    objects.splice(index, 1);
    drawViews();
  }
  closeEditPanel();
}

function rotateEditingObject() {
  if (!editingObject) return;
  
  rotateObject90(editingObject);
  drawViews();
  
  // フォームの値を更新
  document.getElementById('editObjW').value = editingObject.w;
  document.getElementById('editObjD').value = editingObject.d;
  document.getElementById('editObjX').value = editingObject.x;
  document.getElementById('editObjY').value = editingObject.y;
}

/* -------------------------------------------------
   部屋情報追加 UI
------------------------------------------------- */
document.getElementById('addFeatureBtn').addEventListener('click', () => {
  document.getElementById('featureForm').classList.remove('hidden');
});

document.getElementById('confirmFeatureBtn').addEventListener('click', () => {
  const type = document.getElementById('featureType').value;
  const wall = document.getElementById('featureWall').value;
  const position = +document.getElementById('featurePosition').value;
  const width = +document.getElementById('featureWidth').value;
  
  // 壁面の長さを取得
  const wallLength = wall === 'top' || wall === 'bottom' ? room.width : room.depth;
  
  // 位置と幅の検証
  const validPosition = Math.max(0, Math.min(wallLength - width, position));
  const validWidth = Math.min(width, wallLength - validPosition);
  
  if (validWidth > 0) {
    roomFeatures.push({ 
      type, 
      wall, 
      position: validPosition, 
      width: validWidth 
    });
    drawViews();
  }
  
  document.getElementById('featureForm').classList.add('hidden');
});

document.getElementById('cancelFeatureBtn').addEventListener('click', () => {
  document.getElementById('featureForm').classList.add('hidden');
});

/* -------------------------------------------------
   重なりチェック関数
------------------------------------------------- */
function checkOverlap(obj, newX, newY, excludeSelf = true) {
  // 新しい位置での矩形
  const newRect = {
    x: newX,
    y: newY,
    w: obj.w,
    d: obj.d
  };

  for (const other of objects) {
    // 自分自身は除外
    if (excludeSelf && other.name === obj.name) continue;
    
    // stackableがfalseの場合、他のどのオブジェクトとも重なってはいけない
    if (!obj.stackable && !other.stackable) {
      const otherRect = {
        x: other.x,
        y: other.y,
        w: other.w,
        d: other.d
      };

      // 矩形の重なり判定
      if (newRect.x < otherRect.x + otherRect.w &&
          newRect.x + newRect.w > otherRect.x &&
          newRect.y < otherRect.y + otherRect.d &&
          newRect.y + newRect.d > otherRect.y) {
        return true; // 重なっている
      }
    }
  }
  return false; // 重なっていない
}

/* -------------------------------------------------
   Drag‑and‑Drop（上面ビュー）
------------------------------------------------- */
const topCanvas = document.getElementById('topView');
topCanvas.addEventListener('mousedown', e => {
  const rect = topCanvas.getBoundingClientRect();
  const featureOffset = 30; // px
  const roomW = room.width * SCALE;
  const roomD = room.depth * SCALE;
  const totalW = roomW + featureOffset * 2;
  const totalD = roomD + featureOffset * 2;
  const centerX = (topCanvas.width - totalW) / 2;
  const centerY = (topCanvas.height - totalD) / 2;
  
  const mouseXPx = e.clientX - rect.left;
  const mouseYPx = e.clientY - rect.top;
  const mouseX = (mouseXPx - centerX - featureOffset) / SCALE;
  const mouseY = (mouseYPx - centerY - featureOffset) / SCALE;

  // まず、部屋の情報（feature）をチェック
  for (let i = roomFeatures.length - 1; i >= 0; i--) {
    const feature = roomFeatures[i];
    
    // 描画座標（canvas座標系）を計算
    const pos = feature.position * SCALE;
    const w = feature.width * SCALE;
    const totalW = roomW + featureOffset * 2;
    const totalD = roomD + featureOffset * 2;
    const centerX = (topCanvas.width - totalW) / 2;
    const centerY = (topCanvas.height - totalD) / 2;
    
    let x, y, drawWidth, drawDepth;
    let btnX, btnY;
    
    switch (feature.wall) {
      case 'top':
        // 描画座標系（translate後）: x = pos, y = -featureOffset
        // canvas座標系: x = centerX + featureOffset + pos, y = centerY
        x = centerX + featureOffset + pos;
        y = centerY;
        drawWidth = w;
        drawDepth = featureOffset;
        btnX = x + w - 14;
        btnY = y;
        break;
      case 'right':
        // 描画座標系: x = roomW, y = pos
        // canvas座標系: x = centerX + featureOffset + roomW, y = centerY + featureOffset + pos
        x = centerX + featureOffset + roomW;
        y = centerY + featureOffset + pos;
        drawWidth = featureOffset;
        drawDepth = w;
        btnX = x;
        btnY = y + w - 14;
        break;
      case 'bottom':
        // 描画座標系: x = pos, y = roomD
        // canvas座標系: x = centerX + featureOffset + pos, y = centerY + featureOffset + roomD
        x = centerX + featureOffset + pos;
        y = centerY + featureOffset + roomD;
        drawWidth = w;
        drawDepth = featureOffset;
        btnX = x + w - 14;
        btnY = y + featureOffset - 14;
        break;
      case 'left':
        // 描画座標系: x = -featureOffset, y = pos
        // canvas座標系: x = centerX, y = centerY + featureOffset + pos
        x = centerX;
        y = centerY + featureOffset + pos;
        drawWidth = featureOffset;
        drawDepth = w;
        btnX = x;
        btnY = y + w - 14;
        break;
    }
    
    // 削除ボタンの判定
    const btnSize = 14;
    if (mouseXPx >= btnX && mouseXPx <= btnX + btnSize &&
        mouseYPx >= btnY && mouseYPx <= btnY + btnSize) {
      roomFeatures.splice(i, 1);
      drawViews();
      return;
    }
    
    // feature本体のクリック判定
    if (mouseXPx >= x && mouseXPx <= x + drawWidth &&
        mouseYPx >= y && mouseYPx <= y + drawDepth) {
      // ドラッグ開始
      const centerPos = feature.position + feature.width / 2;
      // 左と右の壁面の場合はY座標、上と下の壁面の場合はX座標を使用
      const mousePos = (feature.wall === 'top' || feature.wall === 'bottom') ? mouseX : mouseY;
      draggingFeature = { feature, offset: mousePos - centerPos };
      break;
    }
  }
  
  if (draggingFeature) return; // featureをドラッグしている場合はオブジェクトの処理をスキップ

  // クリックしたオブジェクトを検索（上位優先）
  // オフセットを考慮した座標で判定
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];

    if (mouseX >= o.x && mouseX <= o.x + o.w &&
      mouseY >= o.y && mouseY <= o.y + o.d) {
      // ドラッグ開始
      dragging = { obj: o, offsetX: mouseX - o.x, offsetY: mouseY - o.y };
      break;
    }
  }
});

topCanvas.addEventListener('mousemove', e => {
  const rect = topCanvas.getBoundingClientRect();
  const featureOffset = 30; // px
  const roomW = room.width * SCALE;
  const roomD = room.depth * SCALE;
  const totalW = roomW + featureOffset * 2;
  const totalD = roomD + featureOffset * 2;
  const centerX = (topCanvas.width - totalW) / 2;
  const centerY = (topCanvas.height - totalD) / 2;
  
  const mouseXPx = e.clientX - rect.left;
  const mouseYPx = e.clientY - rect.top;
  const mouseX = (mouseXPx - centerX - featureOffset) / SCALE;
  const mouseY = (mouseYPx - centerY - featureOffset) / SCALE;
  
  // featureのドラッグ処理
  if (draggingFeature) {
    const feature = draggingFeature.feature;
    const wallLength = feature.wall === 'top' || feature.wall === 'bottom' ? room.width : room.depth;
    
    // 現在の壁面に沿って位置のみを更新（壁面は変更しない）
    let newPosition;
    if (feature.wall === 'top' || feature.wall === 'bottom') {
      // 上または下の壁面：X座標（幅方向）に沿って動く
      const centerPos = mouseX - draggingFeature.offset;
      newPosition = Math.max(0, Math.min(wallLength - feature.width, centerPos - feature.width / 2));
    } else {
      // 左または右の壁面：Y座標（奥行き方向）に沿って動く
      const centerPos = mouseY - draggingFeature.offset;
      newPosition = Math.max(0, Math.min(wallLength - feature.width, centerPos - feature.width / 2));
    }
    
    feature.position = newPosition;
    drawViews();
    return;
  }
  
  if (!dragging) return;

  // 部屋境界内に収める
  let newX = Math.max(0, Math.min(room.width - dragging.obj.w, mouseX - dragging.offsetX));
  let newY = Math.max(0, Math.min(room.depth - dragging.obj.d, mouseY - dragging.offsetY));

  // 重なりチェック（stackableがfalseの場合）
  if (!dragging.obj.stackable && checkOverlap(dragging.obj, newX, newY)) {
    // 重なっている場合は移動しない（前の位置を維持）
    return;
  }

  dragging.obj.x = newX;
  dragging.obj.y = newY;
  drawViews();
});

topCanvas.addEventListener('mouseup', () => { 
  dragging = null; 
  draggingFeature = null; 
});
topCanvas.addEventListener('mouseleave', () => { 
  dragging = null; 
  draggingFeature = null; 
});

topCanvas.addEventListener('dblclick', e => {
  const rect = topCanvas.getBoundingClientRect();
  const featureOffset = 30; // px
  const roomW = room.width * SCALE;
  const roomD = room.depth * SCALE;
  const totalW = roomW + featureOffset * 2;
  const totalD = roomD + featureOffset * 2;
  const centerX = (topCanvas.width - totalW) / 2;
  const centerY = (topCanvas.height - totalD) / 2;
  
  const mouseXPx = e.clientX - rect.left;
  const mouseYPx = e.clientY - rect.top;
  const mouseX = (mouseXPx - centerX - featureOffset) / SCALE;
  const mouseY = (mouseYPx - centerY - featureOffset) / SCALE;

  // ダブルクリックしたオブジェクトを検索（上位優先）
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];

    if (mouseX >= o.x && mouseX <= o.x + o.w &&
      mouseY >= o.y && mouseY <= o.y + o.d) {
      // オブジェクトをダブルクリックした場合は編集パネルを開く
      openEditPanel(o);
      break;
    }
  }
});

/* -------------------------------------------------
   キャプション更新
------------------------------------------------- */
function updateCaptions() {
  document.getElementById('topCaption').textContent = `上面ビュー (${room.width}mm × ${room.depth}mm)`;
  document.getElementById('frontCaption').textContent = `正面ビュー (${room.width}mm × ${room.height}mm)`;
  document.getElementById('sideCaption').textContent = `側面ビュー (${room.depth}mm × ${room.height}mm)`;
}

/* -------------------------------------------------
   保存・読み込み機能
------------------------------------------------- */
function saveLayout() {
  const layoutData = {
    room: { ...room },
    objects: objects.map(obj => ({ ...obj })),
    roomFeatures: roomFeatures.map(feature => ({ ...feature })),
    version: '1.0',
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('roomLayout', JSON.stringify(layoutData));
  alert('レイアウトを保存しました！');
}

function loadLayout() {
  const saved = localStorage.getItem('roomLayout');
  if (!saved) {
    alert('保存されたレイアウトが見つかりません。');
    return;
  }
  
  try {
    const layoutData = JSON.parse(saved);
    room = { ...layoutData.room };
    objects = layoutData.objects.map(obj => ({ 
      ...obj,
      stackable: obj.stackable !== undefined ? obj.stackable : true // デフォルト値
    }));
    roomFeatures = layoutData.roomFeatures ? layoutData.roomFeatures.map(feature => ({ ...feature })) : [];
    
    // UIを更新
    document.getElementById('roomWidth').value = room.width;
    document.getElementById('roomDepth').value = room.depth;
    document.getElementById('roomHeight').value = room.height;
    
    drawViews();
    alert('レイアウトを読み込みました！');
  } catch (e) {
    alert('レイアウトの読み込みに失敗しました: ' + e.message);
  }
}

function downloadLayout() {
  const layoutData = {
    room: { ...room },
    objects: objects.map(obj => ({ ...obj })),
    roomFeatures: roomFeatures.map(feature => ({ ...feature })),
    version: '1.0',
    savedAt: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(layoutData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `room_layout_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadLayoutFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const layoutData = JSON.parse(e.target.result);
      room = { ...layoutData.room };
      objects = layoutData.objects.map(obj => ({ 
        ...obj,
        stackable: obj.stackable !== undefined ? obj.stackable : true // デフォルト値
      }));
      roomFeatures = layoutData.roomFeatures ? layoutData.roomFeatures.map(feature => ({ ...feature })) : [];
      
      // UIを更新
      document.getElementById('roomWidth').value = room.width;
      document.getElementById('roomDepth').value = room.depth;
      document.getElementById('roomHeight').value = room.height;
      
      drawViews();
      alert('ファイルからレイアウトを読み込みました！');
    } catch (err) {
      alert('ファイルの読み込みに失敗しました: ' + err.message);
    }
  };
  reader.readAsText(file);
  
  // ファイル入力をリセット（同じファイルを再度選択できるように）
  event.target.value = '';
}

// 保存・読み込みボタンのイベントリスナー
document.getElementById('saveBtn').addEventListener('click', saveLayout);
document.getElementById('loadBtn').addEventListener('click', loadLayout);
document.getElementById('downloadBtn').addEventListener('click', downloadLayout);
document.getElementById('loadFileBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', loadLayoutFromFile);

// 編集パネルのイベントリスナー
document.getElementById('updateObjectBtn').addEventListener('click', updateObject);
document.getElementById('deleteObjectBtn').addEventListener('click', deleteEditingObject);
document.getElementById('rotateObjectBtn').addEventListener('click', rotateEditingObject);
document.getElementById('cancelEditBtn').addEventListener('click', closeEditPanel);

drawViews();