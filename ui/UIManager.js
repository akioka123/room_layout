/**
 * UI操作を管理するクラス
 */
class UIManager {
  constructor(room, objectManager, featureManager, viewRenderer, storageManager, app, view3DRenderer = null, groupManager = null) {
    this.room = room;
    this.objectManager = objectManager;
    this.featureManager = featureManager;
    this.viewRenderer = viewRenderer;
    this.storageManager = storageManager;
    this.app = app;
    this.view3DRenderer = view3DRenderer;
    this.groupManager = groupManager;
    this.editingObject = null;
    this.selectedObjectIds = new Set(); // 選択されたオブジェクトIDのセット
    
    // デフォルト色の定義
    this.defaultColors = [
      { name: '青', value: 'rgba(0,150,255,0.5)' },
      { name: '赤', value: 'rgba(255,99,71,0.5)' },
      { name: '緑', value: 'rgba(34,139,34,0.5)' },
      { name: '黄', value: 'rgba(255,215,0,0.5)' },
      { name: '紫', value: 'rgba(138,43,226,0.5)' },
      { name: '黒', value: 'rgba(0,0,0,0.5)' },
      { name: '茶色', value: 'rgba(103,78,64,0.5)' },
      { name: 'ベージュ', value: 'rgba(230,120,50,0.5)' },
      { name: '白', value: 'rgba(240,240,240,0.5)' },
      { name: '透明', value: 'rgba(255,255,255,0.5)' }
    ];
    
    // ユーザーが追加した色のリスト
    this.customColors = [];
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
    this.setupColorHandlers();
    this.setupGroupHandlers();
    this.updateColorSelects();
    this.onDoubleClick = onDoubleClick;
    this.updateObjectList();
    this.updateGroupList();
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
        if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
        if (this.view3DRenderer) this.view3DRenderer.rebuild();
      } catch (error) {
        alert(error.message);
        this.updateRoomSizeInputs();
      }
    });

    document.getElementById('roomHeight').addEventListener('change', (e) => {
      try {
        this.room.updateSize(this.room.width, this.room.depth, +e.target.value);
        this.viewRenderer.drawAll();
        if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
              if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
    if (this.view3DRenderer) this.view3DRenderer.rebuild();
    document.getElementById('objectForm').classList.add('hidden');
    this.updateObjectList();
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
    if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
        if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
        if (this.view3DRenderer) this.view3DRenderer.rebuild();
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
      if (this.view3DRenderer) this.view3DRenderer.rebuild();
      this.closeEditPanel();
      this.updateObjectList();
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
    if (this.view3DRenderer) this.view3DRenderer.rebuild();
    this.closeEditPanel();
    this.updateObjectList();
  }

  /**
   * 編集中のオブジェクトを回転させる
   */
  rotateEditingObject() {
    if (!this.editingObject) return;

    this.editingObject.rotate90(this.room);
    this.updateEditFormValues();
    this.viewRenderer.drawAll();
    if (this.view3DRenderer) this.view3DRenderer.rebuild();
  }

  /**
   * ダブルクリック時の処理
   * @param {LayoutObject} obj - オブジェクト
   */
  handleDoubleClick(obj) {
    this.openEditPanel(obj);
  }

  /**
   * 色追加関連のイベントハンドラを設定する
   */
  setupColorHandlers() {
    // オブジェクト追加フォームの色追加ボタン
    const addColorBtn = document.getElementById('addColorBtn');
    if (addColorBtn) {
      addColorBtn.addEventListener('click', () => {
        this.addCustomColor('objColor');
      });
    }

    // 編集フォームの色追加ボタン
    const addEditColorBtn = document.getElementById('addEditColorBtn');
    if (addEditColorBtn) {
      addEditColorBtn.addEventListener('click', () => {
        this.addCustomColor('editObjColor');
      });
    }
  }

  /**
   * カスタム色を追加する
   * @param {string} selectId - 色を選択するセレクトボックスのID
   */
  addCustomColor(selectId) {
    const colorInput = document.getElementById(selectId === 'objColor' ? 'newColorPicker' : 'newEditColorPicker');
    const colorNameInput = document.getElementById(selectId === 'objColor' ? 'newColorName' : 'newEditColorName');
    
    if (!colorInput || !colorNameInput) return;

    const hexColor = colorInput.value;
    const colorName = colorNameInput.value.trim();

    if (!colorName) {
      alert('色名を入力してください。');
      return;
    }

    // 16進数カラーをrgba形式に変換
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    const rgbaValue = `rgba(${r},${g},${b},0.5)`;

    // 既に同じ色が存在するかチェック
    const existingColor = this.customColors.find(c => c.value === rgbaValue);
    if (existingColor) {
      alert('この色は既に追加されています。');
      return;
    }

    // カスタム色を追加
    const newColor = {
      name: colorName,
      value: rgbaValue
    };
    this.customColors.push(newColor);

    // セレクトボックスを更新
    this.updateColorSelects();

    // 追加した色を選択
    const select = document.getElementById(selectId);
    if (select) {
      select.value = rgbaValue;
    }

    // 入力フィールドをクリア
    colorNameInput.value = '';
    colorInput.value = '#0096ff'; // デフォルト色にリセット
  }

  /**
   * 色選択セレクトボックスを更新する
   */
  updateColorSelects() {
    const objColorSelect = document.getElementById('objColor');
    const editObjColorSelect = document.getElementById('editObjColor');

    // すべての色を統合
    const allColors = [...this.defaultColors, ...this.customColors];

    // セレクトボックスを更新する関数
    const updateSelect = (select) => {
      if (!select) return;
      
      const currentValue = select.value;
      select.innerHTML = '';

      allColors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.value;
        option.textContent = color.name;
        select.appendChild(option);
      });

      // 以前の値を復元（存在する場合）
      if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
        select.value = currentValue;
      }
    };

    updateSelect(objColorSelect);
    updateSelect(editObjColorSelect);
  }

  /**
   * カスタム色リストを設定する（読み込み時用）
   * @param {Array} colors - カスタム色の配列
   */
  setCustomColors(colors) {
    this.customColors = colors || [];
    this.updateColorSelects();
  }

  /**
   * カスタム色リストを取得する
   * @returns {Array} カスタム色の配列
   */
  getCustomColors() {
    return this.customColors;
  }

  /**
   * グループ関連のイベントハンドラを設定する
   */
  setupGroupHandlers() {
    document.getElementById('createGroupBtn').addEventListener('click', () => {
      this.createGroup();
    });
  }

  /**
   * オブジェクト一覧を更新する
   */
  updateObjectList() {
    const objectList = document.getElementById('objectList');
    const objects = this.objectManager.getAll();

    if (objects.length === 0) {
      objectList.innerHTML = '<p class="text-gray-500 text-sm">オブジェクトがありません</p>';
      document.getElementById('createGroupBtn').disabled = true;
      return;
    }

    objectList.innerHTML = '';
    objects.forEach(obj => {
      const group = this.groupManager ? this.groupManager.getGroupByObjectId(obj.id) : null;
      const isInGroup = group !== null;
      const isSelected = this.selectedObjectIds.has(obj.id);

      const item = document.createElement('div');
      item.className = `flex items-center gap-2 p-2 border rounded ${isInGroup ? 'bg-blue-50' : ''}`;
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'w-4 h-4';
      checkbox.checked = isSelected;
      checkbox.disabled = isInGroup; // 既にグループに属している場合は無効化
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedObjectIds.add(obj.id);
        } else {
          this.selectedObjectIds.delete(obj.id);
        }
        this.updateCreateGroupButton();
      });

      const label = document.createElement('label');
      label.className = 'flex-1 cursor-pointer';
      label.textContent = obj.name || `オブジェクト (${obj.w}mm × ${obj.d}mm)`;
      if (isInGroup) {
        label.textContent += ` [${group.name}]`;
      }
      label.addEventListener('click', () => {
        if (!isInGroup) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });

      item.appendChild(checkbox);
      item.appendChild(label);
      objectList.appendChild(item);
    });

    this.updateCreateGroupButton();
  }

  /**
   * グループ作成ボタンの状態を更新する
   */
  updateCreateGroupButton() {
    const btn = document.getElementById('createGroupBtn');
    const availableCount = Array.from(this.selectedObjectIds).filter(id => {
      return !this.groupManager || !this.groupManager.getGroupByObjectId(id);
    }).length;
    btn.disabled = availableCount < 2;
  }

  /**
   * グループを作成する
   */
  createGroup() {
    if (!this.groupManager) return;

    const availableIds = Array.from(this.selectedObjectIds).filter(id => {
      return !this.groupManager.getGroupByObjectId(id);
    });

    if (availableIds.length < 2) {
      alert('グループを作成するには、2つ以上のオブジェクトを選択してください。');
      return;
    }

    const groupNameInput = document.getElementById('groupNameInput');
    const groupName = groupNameInput.value.trim();

    try {
      const group = this.groupManager.createGroup(groupName, availableIds);
      this.selectedObjectIds.clear();
      groupNameInput.value = '';
      this.updateObjectList();
      this.updateGroupList();
      this.viewRenderer.drawAll();
      if (this.view3DRenderer) this.view3DRenderer.rebuild();
    } catch (error) {
      alert(error.message);
    }
  }

  /**
   * グループ一覧を更新する
   */
  updateGroupList() {
    if (!this.groupManager) return;

    const groupList = document.getElementById('groupList');
    const groups = this.groupManager.getAll();

    if (groups.length === 0) {
      groupList.innerHTML = '<p class="text-gray-500 text-sm">グループがありません</p>';
      return;
    }

    groupList.innerHTML = '';
    groups.forEach(group => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-2 border rounded bg-blue-50';

      const info = document.createElement('div');
      info.className = 'flex-1';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-semibold';
      nameSpan.textContent = group.name;
      const countSpan = document.createElement('span');
      countSpan.className = 'text-sm text-gray-600 ml-2';
      countSpan.textContent = `(${group.objectIds.length}個のオブジェクト)`;
      info.appendChild(nameSpan);
      info.appendChild(countSpan);

      const ungroupBtn = document.createElement('button');
      ungroupBtn.className = 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600';
      ungroupBtn.textContent = '解除';
      ungroupBtn.addEventListener('click', () => {
        this.ungroup(group.id);
      });

      item.appendChild(info);
      item.appendChild(ungroupBtn);
      groupList.appendChild(item);
    });
  }

  /**
   * グループを解除する
   * @param {string} groupId - 解除するグループID
   */
  ungroup(groupId) {
    if (!this.groupManager) return;

    this.groupManager.ungroup(groupId);
    this.updateObjectList();
    this.updateGroupList();
    this.viewRenderer.drawAll();
    if (this.view3DRenderer) this.view3DRenderer.rebuild();
  }
}

