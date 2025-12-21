/**
 * 部屋情報（窓、ドア、クローゼットなど）の管理を行うクラス
 */
class FeatureManager {
  constructor(room) {
    this.room = room;
    this.features = [];
  }

  /**
   * 部屋情報を追加する
   * @param {RoomFeature} feature - 追加する部屋情報
   */
  add(feature) {
    feature.validateBounds(this.room);
    if (feature.width > 0) {
      this.features.push(feature);
    }
  }

  /**
   * 部屋情報を削除する
   * @param {RoomFeature} feature - 削除する部屋情報
   */
  remove(feature) {
    const index = this.features.indexOf(feature);
    if (index !== -1) {
      this.features.splice(index, 1);
    }
  }

  /**
   * 指定座標にある部屋情報を取得する（上位優先）
   * @param {number} x - X座標（px）
   * @param {number} y - Y座標（px）
   * @param {Function} getCanvasCoordinates - キャンバス座標を取得する関数
   * @returns {RoomFeature|null} 見つかった部屋情報、なければnull
   */
  getFeatureAt(x, y, getCanvasCoordinates) {
    for (let i = this.features.length - 1; i >= 0; i--) {
      const feature = this.features[i];
      const coords = getCanvasCoordinates(feature);
      if (coords && this.isPointInRect(x, y, coords)) {
        return feature;
      }
    }
    return null;
  }

  /**
   * 指定座標が削除ボタン内かチェックする
   * @param {number} x - X座標（px）
   * @param {number} y - Y座標（px）
   * @param {Function} getButtonCoordinates - ボタン座標を取得する関数
   * @returns {RoomFeature|null} 見つかった部屋情報、なければnull
   */
  getFeatureByDeleteButton(x, y, getButtonCoordinates) {
    for (let i = this.features.length - 1; i >= 0; i--) {
      const feature = this.features[i];
      const btnCoords = getButtonCoordinates(feature);
      if (btnCoords && this.isPointInRect(x, y, btnCoords, 14)) {
        return feature;
      }
    }
    return null;
  }

  /**
   * 点が矩形内にあるかチェックする
   * @param {number} x - 点のX座標
   * @param {number} y - 点のY座標
   * @param {Object} rect - 矩形 {x, y, width, height}
   * @param {number} size - サイズ（正方形の場合）
   * @returns {boolean} 矩形内にある場合true
   */
  isPointInRect(x, y, rect, size = null) {
    if (size) {
      return x >= rect.x && x <= rect.x + size &&
             y >= rect.y && y <= rect.y + size;
    }
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  /**
   * すべての部屋情報を取得する
   * @returns {RoomFeature[]} 部屋情報の配列
   */
  getAll() {
    return this.features;
  }

  /**
   * 部屋情報をクリアする
   */
  clear() {
    this.features = [];
  }

  /**
   * JSONデータから部屋情報を復元する
   * @param {Array} dataArray - 部屋情報データの配列
   */
  loadFromJSON(dataArray) {
    this.features = (dataArray || []).map(data => RoomFeature.fromJSON(data));
  }
}

