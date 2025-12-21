/**
 * 部屋の情報（窓、ドア、クローゼットなど）を管理するクラス
 */
class RoomFeature {
  constructor({
    type = 'window',
    wall = 'top',
    position = 0,
    width = 1000
  } = {}) {
    this.type = type; // 'window', 'door', 'closet'
    this.wall = wall; // 'top', 'right', 'bottom', 'left'
    this.position = position;
    this.width = width;
  }

  /**
   * 壁面の長さを取得する
   * @param {Room} room - 部屋オブジェクト
   * @returns {number} 壁面の長さ（mm）
   */
  getWallLength(room) {
    return (this.wall === 'top' || this.wall === 'bottom') 
      ? room.width 
      : room.depth;
  }

  /**
   * 位置と幅を検証して調整する
   * @param {Room} room - 部屋オブジェクト
   */
  validateBounds(room) {
    const wallLength = this.getWallLength(room);
    this.position = Math.max(0, Math.min(wallLength - this.width, this.position));
    this.width = Math.min(this.width, wallLength - this.position);
  }

  /**
   * 部屋情報のデータをコピーして返す
   * @returns {Object} 部屋情報データのコピー
   */
  toJSON() {
    return {
      type: this.type,
      wall: this.wall,
      position: this.position,
      width: this.width
    };
  }

  /**
   * JSONデータから部屋情報を復元する
   * @param {Object} data - 部屋情報データ
   * @returns {RoomFeature} 復元されたRoomFeatureインスタンス
   */
  static fromJSON(data) {
    return new RoomFeature({
      type: data.type,
      wall: data.wall,
      position: data.position,
      width: data.width
    });
  }
}

