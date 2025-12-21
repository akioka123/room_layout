/**
 * レイアウトデータの保存・読み込みを行うクラス
 */
class StorageManager {
  constructor(room, objectManager, featureManager) {
    this.room = room;
    this.objectManager = objectManager;
    this.featureManager = featureManager;
    this.storageKey = 'roomLayout';
    this.version = '1.0';
  }

  /**
   * レイアウトデータを保存する
   */
  save() {
    const layoutData = {
      room: this.room.toJSON(),
      objects: this.objectManager.getAll().map(obj => obj.toJSON()),
      roomFeatures: this.featureManager.getAll().map(feature => feature.toJSON()),
      version: this.version,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(layoutData));
  }

  /**
   * ローカルストレージからレイアウトデータを読み込む
   * @returns {boolean} 読み込み成功時true
   */
  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      return false;
    }
    
    try {
      const layoutData = JSON.parse(saved);
      this.applyLayoutData(layoutData);
      return true;
    } catch (e) {
      throw new Error('レイアウトの読み込みに失敗しました: ' + e.message);
    }
  }

  /**
   * ファイルからレイアウトデータを読み込む
   * @param {File} file - 読み込むファイル
   * @returns {Promise<boolean>} 読み込み成功時true
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const layoutData = JSON.parse(e.target.result);
          this.applyLayoutData(layoutData);
          resolve(true);
        } catch (err) {
          reject(new Error('ファイルの読み込みに失敗しました: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsText(file);
    });
  }

  /**
   * レイアウトデータをダウンロードする
   */
  download() {
    const layoutData = {
      room: this.room.toJSON(),
      objects: this.objectManager.getAll().map(obj => obj.toJSON()),
      roomFeatures: this.featureManager.getAll().map(feature => feature.toJSON()),
      version: this.version,
      savedAt: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room_layout_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * レイアウトデータを適用する（共通処理）
   * @param {Object} layoutData - レイアウトデータ
   */
  applyLayoutData(layoutData) {
    this.room.updateSize(layoutData.room.width, layoutData.room.depth, layoutData.room.height);
    this.objectManager.loadFromJSON(layoutData.objects);
    this.featureManager.loadFromJSON(layoutData.roomFeatures);
  }
}

