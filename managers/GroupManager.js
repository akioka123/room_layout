/**
 * オブジェクトグループの管理を行うクラス
 */
class GroupManager {
  constructor(objectManager) {
    this.objectManager = objectManager;
    this.groups = [];
  }

  /**
   * グループを作成する
   * @param {string} name - グループ名
   * @param {string[]} objectIds - オブジェクトIDの配列
   * @returns {ObjectGroup} 作成されたグループ
   */
  createGroup(name = '', objectIds = []) {
    // 既に他のグループに属しているオブジェクトを除外
    const availableIds = objectIds.filter(id => !this.getGroupByObjectId(id));
    
    if (availableIds.length === 0) {
      throw new Error('グループに追加できるオブジェクトがありません。');
    }

    const group = new ObjectGroup({
      name: name || `グループ ${this.groups.length + 1}`,
      objectIds: availableIds
    });

    this.groups.push(group);
    return group;
  }

  /**
   * グループを削除する
   * @param {string} groupId - 削除するグループID
   */
  removeGroup(groupId) {
    const index = this.groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      this.groups.splice(index, 1);
    }
  }

  /**
   * グループを取得する
   * @param {string} groupId - グループID
   * @returns {ObjectGroup|null} 見つかったグループ、なければnull
   */
  getGroup(groupId) {
    return this.groups.find(g => g.id === groupId) || null;
  }

  /**
   * オブジェクトIDから所属するグループを取得する
   * @param {string} objectId - オブジェクトID
   * @returns {ObjectGroup|null} 見つかったグループ、なければnull
   */
  getGroupByObjectId(objectId) {
    return this.groups.find(g => g.containsObjectId(objectId)) || null;
  }

  /**
   * すべてのグループを取得する
   * @returns {ObjectGroup[]} グループの配列
   */
  getAll() {
    return this.groups;
  }

  /**
   * グループ内のオブジェクトを取得する
   * @param {string} groupId - グループID
   * @returns {LayoutObject[]} オブジェクトの配列
   */
  getObjectsInGroup(groupId) {
    const group = this.getGroup(groupId);
    if (!group) return [];

    return group.objectIds
      .map(id => this.objectManager.getAll().find(obj => obj.id === id))
      .filter(obj => obj !== undefined);
  }

  /**
   * グループ全体を移動する
   * @param {string} groupId - グループID
   * @param {number} deltaX - X方向の移動量
   * @param {number} deltaY - Y方向の移動量
   * @param {Room} room - 部屋オブジェクト（境界チェック用）
   */
  moveGroup(groupId, deltaX, deltaY, room) {
    const group = this.getGroup(groupId);
    if (!group) return;

    const objects = this.getObjectsInGroup(groupId);
    if (objects.length === 0) return;

    // すべてのオブジェクトが移動可能かチェック
    const canMove = objects.every(obj => {
      const newX = obj.x + deltaX;
      const newY = obj.y + deltaY;
      return newX >= 0 && newX + obj.w <= room.width &&
             newY >= 0 && newY + obj.d <= room.depth;
    });

    if (!canMove) return;

    // すべてのオブジェクトを移動
    objects.forEach(obj => {
      obj.x += deltaX;
      obj.y += deltaY;
      obj.constrainToRoom(room);
    });
  }

  /**
   * グループを解除する
   * @param {string} groupId - 解除するグループID
   */
  ungroup(groupId) {
    this.removeGroup(groupId);
  }

  /**
   * すべてのグループをクリアする
   */
  clear() {
    this.groups = [];
  }

  /**
   * JSONデータからグループを復元する
   * @param {Array} dataArray - グループデータの配列
   * @param {ObjectManager} objectManager - オブジェクトマネージャー（オブジェクトIDの検証用）
   */
  loadFromJSON(dataArray) {
    this.groups = dataArray.map(data => ObjectGroup.fromJSON(data));
    
    // 存在しないオブジェクトIDをグループから削除
    const allObjectIds = new Set(this.objectManager.getAll().map(obj => obj.id));
    this.groups.forEach(group => {
      group.objectIds = group.objectIds.filter(id => allObjectIds.has(id));
    });
    
    // 空のグループを削除
    this.groups = this.groups.filter(group => group.objectIds.length > 0);
  }
}

