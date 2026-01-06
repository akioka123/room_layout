/**
 * オブジェクトグループを管理するクラス
 */
class ObjectGroup {
  constructor({
    id = null,
    name = '',
    objectIds = []
  } = {}) {
    this.id = id || this.generateId();
    this.name = name;
    this.objectIds = objectIds; // オブジェクトIDの配列
    this.createdAt = new Date();
  }

  /**
   * 一意のIDを生成する
   * @returns {string} 生成されたID
   */
  generateId() {
    return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * オブジェクトIDを追加する
   * @param {string} objectId - 追加するオブジェクトID
   */
  addObjectId(objectId) {
    if (!this.objectIds.includes(objectId)) {
      this.objectIds.push(objectId);
    }
  }

  /**
   * オブジェクトIDを削除する
   * @param {string} objectId - 削除するオブジェクトID
   */
  removeObjectId(objectId) {
    const index = this.objectIds.indexOf(objectId);
    if (index !== -1) {
      this.objectIds.splice(index, 1);
    }
  }

  /**
   * グループにオブジェクトが含まれているかチェック
   * @param {string} objectId - チェックするオブジェクトID
   * @returns {boolean} 含まれている場合true
   */
  containsObjectId(objectId) {
    return this.objectIds.includes(objectId);
  }

  /**
   * グループのデータをコピーして返す
   * @returns {Object} グループデータのコピー
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      objectIds: this.objectIds,
      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * JSONデータからグループを復元する
   * @param {Object} data - グループデータ
   * @returns {ObjectGroup} 復元されたObjectGroupインスタンス
   */
  static fromJSON(data) {
    return new ObjectGroup({
      id: data.id || null,
      name: data.name || '',
      objectIds: data.objectIds || []
    });
  }
}

