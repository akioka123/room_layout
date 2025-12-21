/**
 * 部屋情報（窓、ドア、クローゼット）の描画を行うクラス
 */
class RoomFeatureRenderer {
  constructor(room, scale) {
    this.room = room;
    this.scale = scale;
    this.featureOffset = 30;
    this.deleteButtonSize = 14;
  }

  /**
   * 部屋情報を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {RoomFeature} feature - 描画する部屋情報
   * @param {number} offset - オフセット（px）
   */
  draw(ctx, feature, offset) {
    const coords = this.calculateCoordinates(feature, offset);
    if (!coords) return;

    ctx.save();
    this.drawFeature(ctx, feature, coords);
    this.drawDeleteButton(ctx, coords.button);
    ctx.restore();
  }

  /**
   * 座標を計算する
   * @param {RoomFeature} feature - 部屋情報
   * @param {number} offset - オフセット（px）
   * @returns {Object|null} 座標情報
   */
  calculateCoordinates(feature, offset) {
    const roomW = this.room.width * this.scale;
    const roomD = this.room.depth * this.scale;
    const wallLength = feature.getWallLength(this.room);
    const position = Math.max(0, Math.min(wallLength - feature.width, feature.position));
    const width = feature.width * this.scale;
    const pos = position * this.scale;

    const wallHandlers = {
      top: () => ({
        x: pos,
        y: -offset,
        width: width,
        height: offset,
        button: { x: pos + width - this.deleteButtonSize, y: -offset }
      }),
      right: () => ({
        x: roomW,
        y: pos,
        width: offset,
        height: width,
        button: { x: roomW, y: pos + width - this.deleteButtonSize }
      }),
      bottom: () => ({
        x: pos,
        y: roomD,
        width: width,
        height: offset,
        button: { x: pos + width - this.deleteButtonSize, y: roomD + offset - this.deleteButtonSize }
      }),
      left: () => ({
        x: -offset,
        y: pos,
        width: offset,
        height: width,
        button: { x: -offset, y: pos + width - this.deleteButtonSize }
      })
    };

    const handler = wallHandlers[feature.wall];
    return handler ? handler() : null;
  }

  /**
   * 部屋情報を描画する（種類別）
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {RoomFeature} feature - 部屋情報
   * @param {Object} coords - 座標情報
   */
  drawFeature(ctx, feature, coords) {
    const typeHandlers = {
      window: () => this.drawWindow(ctx, feature, coords),
      door: () => this.drawDoor(ctx, feature, coords),
      closet: () => this.drawCloset(ctx, feature, coords)
    };

    const handler = typeHandlers[feature.type];
    if (handler) {
      handler();
    }
  }

  /**
   * 窓を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {RoomFeature} feature - 部屋情報
   * @param {Object} coords - 座標情報
   */
  drawWindow(ctx, feature, coords) {
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;

    const isHorizontal = feature.wall === 'top' || feature.wall === 'bottom';
    if (isHorizontal) {
      this.drawHorizontalWindow(ctx, coords);
    } else {
      this.drawVerticalWindow(ctx, coords);
    }
  }

  /**
   * 水平方向の窓を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawHorizontalWindow(ctx, coords) {
    const centerY = coords.y + coords.height / 2;
    ctx.beginPath();
    ctx.moveTo(coords.x, centerY);
    ctx.lineTo(coords.x + coords.width, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, centerY - 3);
    ctx.lineTo(coords.x + coords.width, centerY - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, centerY + 3);
    ctx.lineTo(coords.x + coords.width, centerY + 3);
    ctx.stroke();
  }

  /**
   * 垂直方向の窓を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawVerticalWindow(ctx, coords) {
    const centerX = coords.x + coords.width / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, coords.y);
    ctx.lineTo(centerX, coords.y + coords.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 3, coords.y);
    ctx.lineTo(centerX - 3, coords.y + coords.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 3, coords.y);
    ctx.lineTo(centerX + 3, coords.y + coords.height);
    ctx.stroke();
  }

  /**
   * ドアを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {RoomFeature} feature - 部屋情報
   * @param {Object} coords - 座標情報
   */
  drawDoor(ctx, feature, coords) {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;

    const isHorizontal = feature.wall === 'top' || feature.wall === 'bottom';
    if (isHorizontal) {
      this.drawHorizontalDoor(ctx, coords);
    } else {
      this.drawVerticalDoor(ctx, coords);
    }
  }

  /**
   * 水平方向のドアを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawHorizontalDoor(ctx, coords) {
    const centerX = coords.x + coords.width / 2;
    const centerY = coords.y + coords.height / 2;
    ctx.beginPath();
    ctx.moveTo(coords.x, centerY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, coords.width / 2, 0, Math.PI);
    ctx.stroke();
  }

  /**
   * 垂直方向のドアを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawVerticalDoor(ctx, coords) {
    const centerX = coords.x + coords.width / 2;
    const centerY = coords.y + coords.height / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, coords.y);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, coords.height / 2, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }

  /**
   * クローゼットを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {RoomFeature} feature - 部屋情報
   * @param {Object} coords - 座標情報
   */
  drawCloset(ctx, feature, coords) {
    ctx.strokeStyle = '#654321';
    ctx.fillStyle = 'rgba(101, 67, 33, 0.2)';
    ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
    ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);

    const isHorizontal = feature.wall === 'top' || feature.wall === 'bottom';
    if (isHorizontal) {
      this.drawHorizontalHatching(ctx, coords);
    } else {
      this.drawVerticalHatching(ctx, coords);
    }
  }

  /**
   * 水平方向のハッチングを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawHorizontalHatching(ctx, coords) {
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    const hatchSpacing = 5;
    for (let i = coords.x; i < coords.x + coords.width; i += hatchSpacing) {
      ctx.beginPath();
      ctx.moveTo(i, coords.y);
      ctx.lineTo(i, coords.y + coords.height);
      ctx.stroke();
    }
  }

  /**
   * 垂直方向のハッチングを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} coords - 座標情報
   */
  drawVerticalHatching(ctx, coords) {
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    const hatchSpacing = 5;
    for (let i = coords.y; i < coords.y + coords.height; i += hatchSpacing) {
      ctx.beginPath();
      ctx.moveTo(coords.x, i);
      ctx.lineTo(coords.x + coords.width, i);
      ctx.stroke();
    }
  }

  /**
   * 削除ボタンを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} buttonCoords - ボタン座標
   */
  drawDeleteButton(ctx, buttonCoords) {
    ctx.fillStyle = 'red';
    ctx.fillRect(buttonCoords.x, buttonCoords.y, this.deleteButtonSize, this.deleteButtonSize);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', buttonCoords.x + this.deleteButtonSize / 2, buttonCoords.y + this.deleteButtonSize / 2);
  }

  /**
   * キャンバス座標を取得する（クリック判定用）
   * @param {RoomFeature} feature - 部屋情報
   * @param {number} offset - オフセット（px）
   * @param {number} canvasWidth - キャンバス幅
   * @param {number} canvasHeight - キャンバス高さ
   * @returns {Object|null} キャンバス座標情報
   */
  getCanvasCoordinates(feature, offset, canvasWidth, canvasHeight) {
    const roomW = this.room.width * this.scale;
    const roomD = this.room.depth * this.scale;
    const totalW = roomW + offset * 2;
    const totalD = roomD + offset * 2;
    const centerX = (canvasWidth - totalW) / 2;
    const centerY = (canvasHeight - totalD) / 2;

    const coords = this.calculateCoordinates(feature, offset);
    if (!coords) return null;

    const wallHandlers = {
      top: () => ({
        x: centerX + offset + coords.x,
        y: centerY,
        width: coords.width,
        height: coords.height,
        button: {
          x: centerX + offset + coords.button.x,
          y: centerY + coords.button.y + offset
        }
      }),
      right: () => ({
        x: centerX + offset + coords.x,
        y: centerY + offset + coords.y,
        width: coords.width,
        height: coords.height,
        button: {
          x: centerX + offset + coords.button.x,
          y: centerY + offset + coords.button.y
        }
      }),
      bottom: () => ({
        x: centerX + offset + coords.x,
        y: centerY + offset + coords.y,
        width: coords.width,
        height: coords.height,
        button: {
          x: centerX + offset + coords.button.x,
          y: centerY + offset + coords.button.y
        }
      }),
      left: () => ({
        x: centerX,
        y: centerY + offset + coords.y,
        width: coords.width,
        height: coords.height,
        button: {
          x: centerX + coords.button.x + offset,
          y: centerY + offset + coords.button.y
        }
      })
    };

    const handler = wallHandlers[feature.wall];
    return handler ? handler() : null;
  }
}

