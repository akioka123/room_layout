/**
 * 部屋データを管理するクラス
 */
class Room {
  constructor(width = 5900, depth = 2200, height = 2500) {
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.sizeConstraints = null; // サイズ制約（最大値・最小値）
  }

  /**
   * サイズ制約を設定する
   * @param {{width: {min: number, max: number}, depth: {min: number, max: number}, height?: {min: number, max: number}}} constraints - サイズ制約
   */
  setSizeConstraints(constraints) {
    this.sizeConstraints = constraints;
  }

  /**
   * 部屋のサイズを更新する（バリデーション付き）
   * @param {number} width - 幅（mm）
   * @param {number} depth - 奥行き（mm）
   * @param {number} height - 高さ（mm）
   * @throws {Error} サイズが制約範囲外の場合
   */
  updateSize(width, depth, height) {
    if (this.sizeConstraints) {
      const { width: widthConstraints, depth: depthConstraints, height: heightConstraints } = this.sizeConstraints;
      
      if (width < widthConstraints.min || width > widthConstraints.max) {
        throw new Error(
          `幅は${widthConstraints.min}mm～${widthConstraints.max}mmの範囲で設定してください。`
        );
      }
      
      if (depth < depthConstraints.min || depth > depthConstraints.max) {
        throw new Error(
          `奥行きは${depthConstraints.min}mm～${depthConstraints.max}mmの範囲で設定してください。`
        );
      }
      
      if (heightConstraints && (height < heightConstraints.min || height > heightConstraints.max)) {
        throw new Error(
          `高さは${heightConstraints.min}mm～${heightConstraints.max}mmの範囲で設定してください。`
        );
      }
    }
    
    this.width = width;
    this.depth = depth;
    this.height = height;
  }

  /**
   * 部屋のデータをコピーして返す
   * @returns {Object} 部屋データのコピー
   */
  toJSON() {
    return {
      width: this.width,
      depth: this.depth,
      height: this.height
    };
  }

  /**
   * JSONデータから部屋を復元する
   * @param {Object} data - 部屋データ
   * @returns {Room} 復元されたRoomインスタンス
   */
  static fromJSON(data) {
    return new Room(data.width, data.depth, data.height);
  }
}

