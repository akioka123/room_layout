/**
 * レイアウトオブジェクトの管理を行うクラス
 */
class ObjectManager {
  constructor(room) {
    this.room = room;
    this.objects = [];
  }

  /**
   * オブジェクトを追加する
   * @param {LayoutObject} obj - 追加するオブジェクト
   */
  add(obj) {
    obj.constrainToRoom(this.room);
    this.objects.push(obj);
  }

  /**
   * オブジェクトを削除する
   * @param {LayoutObject} obj - 削除するオブジェクト
   */
  remove(obj) {
    const index = this.objects.indexOf(obj);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }

  /**
   * オブジェクトを更新する
   * @param {LayoutObject} obj - 更新するオブジェクト
   * @param {Object} updates - 更新内容
   */
  update(obj, updates) {
    // 一時的に更新を適用してサイズを調整
    const oldValues = {
      w: obj.w,
      d: obj.d,
      h: obj.h,
      x: obj.x,
      y: obj.y,
      z: obj.z
    };

    Object.assign(obj, updates);
    
    // 部屋の境界内に収める
    const newX = Math.max(0, Math.min(this.room.width - obj.w, obj.x));
    const newY = Math.max(0, Math.min(this.room.depth - obj.d, obj.y));
    const newZ = Math.max(0, Math.min(this.room.height - obj.h, obj.z));
    
    // サイズが部屋を超えないようにする
    const validW = Math.min(obj.w, this.room.width - newX);
    const validD = Math.min(obj.d, this.room.depth - newY);
    const validH = Math.min(obj.h, this.room.height - newZ);
    
    // 重なりチェック（stackableがfalseの場合）
    if (!obj.stackable) {
      const tempObj = { ...obj, w: validW, d: validD, stackable: false };
      if (this.checkOverlap(tempObj, newX, newY, true)) {
        // 元の値に戻す
        Object.assign(obj, oldValues);
        throw new Error('他のオブジェクトと重なっています。重ねられるオプションを有効にするか、位置を変更してください。');
      }
    }
    
    // 更新を確定
    obj.w = validW;
    obj.d = validD;
    obj.h = validH;
    obj.x = newX;
    obj.y = newY;
    obj.z = newZ;
  }

  /**
   * オブジェクトの重なりをチェックする
   * @param {LayoutObject} obj - チェックするオブジェクト
   * @param {number} newX - 新しいX座標
   * @param {number} newY - 新しいY座標
   * @param {boolean} excludeSelf - 自分自身を除外するか
   * @returns {boolean} 重なっている場合true
   */
  checkOverlap(obj, newX, newY, excludeSelf = true) {
    const newRect = {
      x: newX,
      y: newY,
      w: obj.w,
      d: obj.d
    };

    for (const other of this.objects) {
      if (excludeSelf && other === obj) continue;
      
      if (!obj.stackable && !other.stackable) {
        const otherRect = {
          x: other.x,
          y: other.y,
          w: other.w,
          d: other.d
        };

        if (this.isRectOverlapping(newRect, otherRect)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 2つの矩形が重なっているかチェックする
   * @param {Object} rect1 - 矩形1
   * @param {Object} rect2 - 矩形2
   * @returns {boolean} 重なっている場合true
   */
  isRectOverlapping(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.d &&
           rect1.y + rect1.d > rect2.y;
  }

  /**
   * 指定座標にあるオブジェクトを取得する（上位優先）
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {LayoutObject|null} 見つかったオブジェクト、なければnull
   */
  getObjectAt(x, y) {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (x >= obj.x && x <= obj.x + obj.w &&
          y >= obj.y && y <= obj.y + obj.d) {
        return obj;
      }
    }
    return null;
  }

  /**
   * すべてのオブジェクトを取得する
   * @returns {LayoutObject[]} オブジェクトの配列
   */
  getAll() {
    return this.objects;
  }

  /**
   * オブジェクトをクリアする
   */
  clear() {
    this.objects = [];
  }

  /**
   * JSONデータからオブジェクトを復元する
   * @param {Array} dataArray - オブジェクトデータの配列
   */
  loadFromJSON(dataArray) {
    this.objects = dataArray.map(data => LayoutObject.fromJSON(data));
  }
}

