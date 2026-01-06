/**
 * レイアウトオブジェクトを管理するクラス
 */
class LayoutObject {
  constructor({
    id = null,
    name = '',
    w = 1000,
    d = 1000,
    h = 1000,
    x = 0,
    y = 0,
    z = 0,
    color = 'rgba(0,150,255,0.5)',
    stackable = true
  } = {}) {
    this.id = id || this.generateId();
    this.name = name;
    this.w = w; // 幅
    this.d = d; // 奥行き
    this.h = h; // 高さ
    this.x = x; // X座標
    this.y = y; // Y座標
    this.z = z; // Z座標
    this.color = color;
    this.stackable = stackable;
  }

  /**
   * 一意のIDを生成する
   * @returns {string} 生成されたID
   */
  generateId() {
    return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * オブジェクトの中心座標を取得する
   * @returns {{x: number, y: number}} 中心座標
   */
  getCenter() {
    return {
      x: this.x + this.w / 2,
      y: this.y + this.d / 2
    };
  }

  /**
   * オブジェクトを90度回転させる
   * @param {Room} room - 部屋オブジェクト（境界チェック用）
   */
  rotate90(room) {
    const center = this.getCenter();
    const tempW = this.w;
    this.w = this.d;
    this.d = tempW;
    this.x = center.x - this.w / 2;
    this.y = center.y - this.d / 2;
    this.constrainToRoom(room);
  }

  /**
   * 部屋の境界内に収める
   * @param {Room} room - 部屋オブジェクト
   */
  constrainToRoom(room) {
    this.x = Math.max(0, Math.min(room.width - this.w, this.x));
    this.y = Math.max(0, Math.min(room.depth - this.d, this.y));
    this.z = Math.max(0, Math.min(room.height - this.h, this.z));
  }

  /**
   * オブジェクトのデータをコピーして返す
   * @returns {Object} オブジェクトデータのコピー
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      w: this.w,
      d: this.d,
      h: this.h,
      x: this.x,
      y: this.y,
      z: this.z,
      color: this.color,
      stackable: this.stackable
    };
  }

  /**
   * JSONデータからオブジェクトを復元する
   * @param {Object} data - オブジェクトデータ
   * @returns {LayoutObject} 復元されたLayoutObjectインスタンス
   */
  static fromJSON(data) {
    return new LayoutObject({
      id: data.id || null,
      name: data.name || '',
      w: data.w,
      d: data.d,
      h: data.h,
      x: data.x,
      y: data.y,
      z: data.z || 0,
      color: data.color || 'rgba(0,150,255,0.5)',
      stackable: data.stackable !== undefined ? data.stackable : true
    });
  }
}

