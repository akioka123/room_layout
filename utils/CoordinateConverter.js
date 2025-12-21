/**
 * 座標変換を行うクラス
 */
class CoordinateConverter {
  constructor(room, scale, featureOffset) {
    this.room = room;
    this.scale = scale;
    this.featureOffset = featureOffset;
  }

  /**
   * キャンバス座標を部屋座標（mm）に変換する
   * @param {number} canvasX - キャンバスX座標（px）
   * @param {number} canvasY - キャンバスY座標（px）
   * @param {HTMLCanvasElement} canvas - キャンバス要素
   * @returns {{x: number, y: number}} 部屋座標（mm）
   */
  canvasToRoom(canvasX, canvasY, canvas) {
    const roomW = this.room.width * this.scale;
    const roomD = this.room.depth * this.scale;
    const totalW = roomW + this.featureOffset * 2;
    const totalD = roomD + this.featureOffset * 2;
    const centerX = (canvas.width - totalW) / 2;
    const centerY = (canvas.height - totalD) / 2;

    const roomX = (canvasX - centerX - this.featureOffset) / this.scale;
    const roomY = (canvasY - centerY - this.featureOffset) / this.scale;

    return { x: roomX, y: roomY };
  }

  /**
   * マウスイベントから部屋座標（mm）を取得する
   * @param {MouseEvent} event - マウスイベント
   * @param {HTMLCanvasElement} canvas - キャンバス要素
   * @returns {{x: number, y: number}} 部屋座標（mm）
   */
  getRoomCoordinatesFromEvent(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    return this.canvasToRoom(canvasX, canvasY, canvas);
  }
}

