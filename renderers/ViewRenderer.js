/**
 * ビュー（上面・正面・側面）の描画を行うクラス
 */
class ViewRenderer {
  constructor(room, objectManager, featureManager, scale) {
    this.room = room;
    this.objectManager = objectManager;
    this.featureManager = featureManager;
    this.scale = scale;
    this.featureOffset = 30;
    this.featureRenderer = new RoomFeatureRenderer(room, scale);
  }

  /**
   * すべてのビューを描画する
   */
  drawAll() {
    this.drawTop();
    this.drawFront();
    this.drawSide();
    this.updateCaptions();
  }

  /**
   * 上面ビューを描画する
   */
  drawTop() {
    const canvas = document.getElementById('topView');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roomW = this.room.width * this.scale;
    const roomD = this.room.depth * this.scale;
    const totalW = roomW + this.featureOffset * 2;
    const totalD = roomD + this.featureOffset * 2;
    const centerX = (canvas.width - totalW) / 2;
    const centerY = (canvas.height - totalD) / 2;

    ctx.save();
    ctx.translate(centerX + this.featureOffset, centerY + this.featureOffset);

    this.drawRoomFrame(ctx, roomW, roomD);
    this.drawRoomFeatures(ctx);
    this.drawObjects(ctx);

    ctx.restore();
  }

  /**
   * 部屋の枠を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} width - 幅（px）
   * @param {number} depth - 奥行き（px）
   */
  drawRoomFrame(ctx, width, depth) {
    ctx.strokeStyle = '#000';
    ctx.strokeRect(0, 0, width, depth);
  }

  /**
   * 部屋情報を描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   */
  drawRoomFeatures(ctx) {
    this.featureManager.getAll().forEach(feature => {
      this.featureRenderer.draw(ctx, feature, this.featureOffset);
    });
  }

  /**
   * オブジェクトを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   */
  drawObjects(ctx) {
    this.objectManager.getAll().forEach(obj => {
      this.drawObject(ctx, obj);
    });
  }

  /**
   * オブジェクトを描画する
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {LayoutObject} obj - オブジェクト
   */
  drawObject(ctx, obj) {
    ctx.fillStyle = obj.color || 'rgba(0,150,255,0.5)';
    ctx.fillRect(obj.x * this.scale, obj.y * this.scale, obj.w * this.scale, obj.d * this.scale);

    const centerX = (obj.x + obj.w / 2) * this.scale;
    const centerY = (obj.y + obj.d / 2) * this.scale;

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (obj.name) {
      ctx.font = '12px sans-serif';
      ctx.fillText(obj.name, centerX, centerY - 8);
    }

    ctx.font = '10px sans-serif';
    const sizeText = `${obj.w}mm × ${obj.d}mm`;
    const sizeY = obj.name ? centerY + 8 : centerY;
    ctx.fillText(sizeText, centerX, sizeY);
  }

  /**
   * 正面ビューを描画する
   */
  drawFront() {
    const canvas = document.getElementById('frontView');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roomW = this.room.width * this.scale;
    const roomH = this.room.height * this.scale;
    ctx.strokeRect(0, 0, roomW, roomH);

    this.objectManager.getAll().forEach(obj => {
      ctx.fillStyle = obj.color || 'rgba(0,150,255,0.5)';
      const y = (this.room.height - obj.h - obj.z) * this.scale;
      ctx.fillRect(obj.x * this.scale, y, obj.w * this.scale, obj.h * this.scale);
    });
  }

  /**
   * 側面ビューを描画する
   */
  drawSide() {
    const canvas = document.getElementById('sideView');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roomD = this.room.depth * this.scale;
    const roomH = this.room.height * this.scale;
    ctx.strokeRect(0, 0, roomD, roomH);

    this.objectManager.getAll().forEach(obj => {
      ctx.fillStyle = obj.color || 'rgba(0,150,255,0.5)';
      const y = (this.room.height - obj.h - obj.z) * this.scale;
      ctx.fillRect(obj.y * this.scale, y, obj.d * this.scale, obj.h * this.scale);
    });
  }

  /**
   * キャプションを更新する
   */
  updateCaptions() {
    document.getElementById('topCaption').textContent = 
      `上面ビュー (${this.room.width}mm × ${this.room.depth}mm)`;
    document.getElementById('frontCaption').textContent = 
      `正面ビュー (${this.room.width}mm × ${this.room.height}mm)`;
    document.getElementById('sideCaption').textContent = 
      `側面ビュー (${this.room.depth}mm × ${this.room.height}mm)`;
  }

  /**
   * キャンバス座標を取得する関数を返す（FeatureManager用）
   * @param {HTMLCanvasElement} canvas - キャンバス要素
   * @returns {Function} 座標取得関数
   */
  getCanvasCoordinatesFunction(canvas) {
    return (feature) => {
      return this.featureRenderer.getCanvasCoordinates(
        feature,
        this.featureOffset,
        canvas.width,
        canvas.height
      );
    };
  }

  /**
   * ボタン座標を取得する関数を返す（FeatureManager用）
   * @param {HTMLCanvasElement} canvas - キャンバス要素
   * @returns {Function} ボタン座標取得関数
   */
  getButtonCoordinatesFunction(canvas) {
    return (feature) => {
      const coords = this.featureRenderer.getCanvasCoordinates(
        feature,
        this.featureOffset,
        canvas.width,
        canvas.height
      );
      return coords ? coords.button : null;
    };
  }
}

