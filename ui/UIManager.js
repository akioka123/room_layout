/**
 * UI操作を管理するクラス
 */
class UIManager {
  constructor(room, objectManager, featureManager, viewRenderer, storageManager, app) {
    this.room = room;
    this.objectManager = objectManager;
    this.featureManager = featureManager;
    this.viewRenderer = viewRenderer;
    this.storageManager = storageManager;
    this.app = app;
    this.editingObject = null;
  }

  /**
   * すべてのUIイベントリスナーを設定する
   * @param {Function} onDoubleClick - ダブルクリック時のコールバック
   */
  setup(onDoubleClick) {
    this.setupRoomSizeHandlers();
    this.setupObjectHandlers();
    this.setupFeatureHandlers();
    this.setupStorageHandlers();
    this.setupEditHandlers();
    this.onDoubleClick = onDoubleClick;
  }

  /**
   * 部屋サイズのイベントハンドラを設定する
   */
  setupRoomSizeHandlers() {
    document.getElementById('roomWidth').addEventListener('change', (e) => {
      try {
        this.room.updateSize(+e.target.value, this.room.depth, this.room.height);
        this.updateRoomSizeInputs();
        this.viewRenderer.drawAll();
      } catch (error) {
        alert(error.message);
        this.updateRoomSizeInputs();
      }
    });

    document.getElementById('roomDepth').addEventListener('change', (e) => {
      try {
        this.room.updateSize(this.room.width, +e.target.value, this.room.height);
        this.updateRoomSizeInputs();
        this.viewRenderer.drawAll();
      } catch (error) {
        alert(error.message);
        this.updateRoomSizeInputs();
      }
    });

    document.getElementById('roomHeight').addEventListener('change', (e) => {
      try {
        this.room.updateSize(this.room.width, this.room.depth, +e.target.value);
        this.viewRenderer.drawAll();
      } catch (error) {
        alert(error.message);
        this.updateRoomSizeInputs();
      }
    });

    // 帖数選択のイベントハンドラ
    const jouSelect = document.getElementById('roomJou');
    if (jouSelect) {
      jouSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        // フォーマット: "6-square", "6-vertical", "6-horizontal" など
        const match = value.match(/^(\d+)-(square|vertical|horizontal)$/);
        if (match && this.app) {
          const jou = parseInt(match[1]);
          const type = match[2];
          if (jou >= 5 && jou <= 8) {
            const size = this.app.calculateRoomSizeFromJou(jou, type);
            try {
              this.room.updateSize(size.width, size.depth, this.room.height);
              this.updateRoomSizeInputs();
              this.viewRenderer.drawAll();
            } catch (error) {
              alert(error.message);
              this.updateRoomSizeInputs();
            }
          }
        }
      });
    }
  }

  /**
   * オブジェクト関連のイベントハンドラを設定する
   */
  setupObjectHandlers() {
    document.getElementById('addObjectBtn').addEventListener('click', () => {
      document.getElementById('objectForm').classList.remove('hidden');
    });

    document.getElementById('confirmAddBtn').addEventListener('click', () => {
      this.addObject();
    });

    document.getElementById('cancelAddBtn').addEventListener('click', () => {
      document.getElementById('objectForm').classList.add('hidden');
    });
  }

  /**
   * オブジェクトを追加する
   */
  addObject() {
    const obj = new LayoutObject({
      name: document.getElementById('objName').value,
      w: +document.getElementById('objW').value,
      d: +document.getElementById('objD').value,
      h: +document.getElementById('objH').value,
      x: +document.getElementById('objX').value,
      y: +document.getElementById('objY').value,
      z: +document.getElementById('objZ').value,
      color: document.getElementById('objColor').value,
      stackable: document.getElementById('objStackable').checked
    });

    this.objectManager.add(obj);
    this.viewRenderer.drawAll();
    document.getElementById('objectForm').classList.add('hidden');
  }

  /**
   * 部屋情報関連のイベントハンドラを設定する
   */
  setupFeatureHandlers() {
    document.getElementById('addFeatureBtn').addEventListener('click', () => {
      document.getElementById('featureForm').classList.remove('hidden');
    });

    document.getElementById('confirmFeatureBtn').addEventListener('click', () => {
      this.addFeature();
    });

    document.getElementById('cancelFeatureBtn').addEventListener('click', () => {
      document.getElementById('featureForm').classList.add('hidden');
    });
  }

  /**
   * 部屋情報を追加する
   */
  addFeature() {
    const feature = new RoomFeature({
      type: document.getElementById('featureType').value,
      wall: document.getElementById('featureWall').value,
      position: +document.getElementById('featurePosition').value,
      width: +document.getElementById('featureWidth').value
    });

    this.featureManager.add(feature);
    this.viewRenderer.drawAll();
    document.getElementById('featureForm').classList.add('hidden');
  }

  /**
   * 保存・読み込み関連のイベントハンドラを設定する
   */
  setupStorageHandlers() {
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.storageManager.save();
      alert('レイアウトを保存しました！');
    });

    document.getElementById('loadBtn').addEventListener('click', () => {
      if (this.storageManager.load()) {
        this.updateRoomSizeInputs();
        this.viewRenderer.drawAll();
        alert('レイアウトを読み込みました！');
      } else {
        alert('保存されたレイアウトが見つかりません。');
      }
    });

    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.storageManager.download();
    });

    document.getElementById('loadFileBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        await this.storageManager.loadFromFile(file);
        this.updateRoomSizeInputs();
        this.viewRenderer.drawAll();
        alert('ファイルからレイアウトを読み込みました！');
      } catch (err) {
        alert(err.message);
      }

      event.target.value = '';
    });
  }

  /**
   * 部屋サイズの入力フィールドを更新する
   */
  updateRoomSizeInputs() {
    document.getElementById('roomWidth').value = this.room.width;
    document.getElementById('roomDepth').value = this.room.depth;
    document.getElementById('roomHeight').value = this.room.height;
    
    // 面積を計算して表示（mm² → m²）
    const areaMm2 = this.room.width * this.room.depth;
    const areaM2 = areaMm2 / 1000000; // mm²をm²に変換
    const roomAreaInput = document.getElementById('roomArea');
    if (roomAreaInput) {
      roomAreaInput.value = areaM2.toFixed(2); // 小数点以下2桁で表示
    }
    
    // 帖数選択も更新（現在のサイズに最も近い帖数とタイプを選択）
    if (this.app) {
      const jouSelect = document.getElementById('roomJou');
      if (jouSelect) {
        const area = this.room.width * this.room.depth;
        const jouArea = 1620000; // 1帖 = 1.62m²
        const estimatedJou = Math.round(area / jouArea);
        const jou = Math.max(5, Math.min(8, estimatedJou));
        
        // 現在のサイズからタイプを判定
        const ratio = this.room.width / this.room.depth;
        let type = 'square';
        if (ratio < 0.8) {
          type = 'vertical'; // 縦長（奥行きが長い）
        } else if (ratio > 1.2) {
          type = 'horizontal'; // 横長（幅が長い）
        }
        
        jouSelect.value = `${jou}-${type}`;
      }
    }
  }

  /**
   * 編集関連のイベントハンドラを設定する
   */
  setupEditHandlers() {
    document.getElementById('updateObjectBtn').addEventListener('click', () => {
      this.updateObject();
    });

    document.getElementById('deleteObjectBtn').addEventListener('click', () => {
      this.deleteEditingObject();
    });

    document.getElementById('rotateObjectBtn').addEventListener('click', () => {
      this.rotateEditingObject();
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      this.closeEditPanel();
    });
  }

  /**
   * 編集パネルを開く
   * @param {LayoutObject} obj - 編集するオブジェクト
   */
  openEditPanel(obj) {
    this.editingObject = obj;

    document.getElementById('editObjName').value = obj.name || '';
    document.getElementById('editObjW').value = obj.w;
    document.getElementById('editObjD').value = obj.d;
    document.getElementById('editObjH').value = obj.h;
    document.getElementById('editObjX').value = obj.x;
    document.getElementById('editObjY').value = obj.y;
    document.getElementById('editObjZ').value = obj.z || 0;
    document.getElementById('editObjColor').value = obj.color || 'rgba(0,150,255,0.5)';
    document.getElementById('editObjStackable').checked = obj.stackable !== undefined ? obj.stackable : true;

    document.getElementById('editObjectForm').classList.remove('hidden');
  }

  /**
   * 編集パネルを閉じる
   */
  closeEditPanel() {
    this.editingObject = null;
    document.getElementById('editObjectForm').classList.add('hidden');
  }

  /**
   * オブジェクトを更新する
   */
  updateObject() {
    if (!this.editingObject) return;

    try {
      this.objectManager.update(this.editingObject, {
        name: document.getElementById('editObjName').value,
        w: +document.getElementById('editObjW').value,
        d: +document.getElementById('editObjD').value,
        h: +document.getElementById('editObjH').value,
        x: +document.getElementById('editObjX').value,
        y: +document.getElementById('editObjY').value,
        z: +document.getElementById('editObjZ').value,
        color: document.getElementById('editObjColor').value,
        stackable: document.getElementById('editObjStackable').checked
      });

      this.updateEditFormValues();
      this.viewRenderer.drawAll();
      this.closeEditPanel();
    } catch (error) {
      alert(error.message);
    }
  }

  /**
   * 編集フォームの値を更新する
   */
  updateEditFormValues() {
    if (!this.editingObject) return;
    document.getElementById('editObjW').value = this.editingObject.w;
    document.getElementById('editObjD').value = this.editingObject.d;
    document.getElementById('editObjX').value = this.editingObject.x;
    document.getElementById('editObjY').value = this.editingObject.y;
  }

  /**
   * 編集中のオブジェクトを削除する
   */
  deleteEditingObject() {
    if (!this.editingObject) return;

    this.objectManager.remove(this.editingObject);
    this.viewRenderer.drawAll();
    this.closeEditPanel();
  }

  /**
   * 編集中のオブジェクトを回転させる
   */
  rotateEditingObject() {
    if (!this.editingObject) return;

    this.editingObject.rotate90(this.room);
    this.updateEditFormValues();
    this.viewRenderer.drawAll();
  }

  /**
   * ダブルクリック時の処理
   * @param {LayoutObject} obj - オブジェクト
   */
  handleDoubleClick(obj) {
    this.openEditPanel(obj);
  }
}

