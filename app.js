/**
 * 部屋レイアウトプランナー - メインアプリケーションクラス
 */
class RoomLayoutApp {
  constructor() {
    // 定数
    this.SCALE = 0.1; // 1 mm = 0.1 px
    this.FEATURE_OFFSET = 30; // 部屋の外側へのオフセット（px）

    // 部屋サイズの最大値・最小値（新しい制約に基づく）
    this.ROOM_SIZE_MAX = {
      width: 5000, // 5m
      depth: 5000, // 5m
      height: 3000 // 3m
    };
    this.ROOM_SIZE_MIN = {
      width: 2000, // 2m
      depth: 2000  // 2m
    };

    // Canvasサイズ（topView）- 最大値に基づいて計算
    // 最大値5000mm × スケール0.1 = 500px + オフセット60px = 560px
    const maxRoomWidthPx = this.ROOM_SIZE_MAX.width * this.SCALE;
    const maxRoomDepthPx = this.ROOM_SIZE_MAX.depth * this.SCALE;
    const TOP_CANVAS_WIDTH = Math.ceil(maxRoomWidthPx + this.FEATURE_OFFSET * 2 + 100); // 余裕を持たせる
    const TOP_CANVAS_HEIGHT = Math.ceil(maxRoomDepthPx + this.FEATURE_OFFSET * 2 + 100); // 余裕を持たせる

    // デフォルトの部屋サイズ（6帖・正方形）
    const defaultSize = this.calculateRoomSizeFromJou(6, 'square');
    this.room = new Room(defaultSize.width, defaultSize.depth, 2500);
    
    // 部屋にサイズ制約を設定
    this.room.setSizeConstraints({
      width: { min: this.ROOM_SIZE_MIN.width, max: this.ROOM_SIZE_MAX.width },
      depth: { min: this.ROOM_SIZE_MIN.depth, max: this.ROOM_SIZE_MAX.depth },
      height: { min: 2000, max: this.ROOM_SIZE_MAX.height }
    });

    // マネージャー
    this.objectManager = new ObjectManager(this.room);
    this.featureManager = new FeatureManager(this.room);
    this.groupManager = new GroupManager(this.objectManager);
    this.storageManager = new StorageManager(
      this.room,
      this.objectManager,
      this.featureManager,
      this.groupManager
    );

    // レンダラー
    this.viewRenderer = new ViewRenderer(
      this.room,
      this.objectManager,
      this.featureManager,
      this.SCALE
    );

    // 3Dレンダラー
    this.view3DRenderer = new View3DRenderer(
      this.room,
      this.objectManager,
      this.featureManager,
      this.SCALE
    );

    // ユーティリティ
    this.coordinateConverter = new CoordinateConverter(
      this.room,
      this.SCALE,
      this.FEATURE_OFFSET
    );

    // UI
    this.uiManager = new UIManager(
      this.room,
      this.objectManager,
      this.featureManager,
      this.viewRenderer,
      this.storageManager,
      this, // appインスタンスを渡して帖数計算関数を使えるようにする
      this.view3DRenderer, // 3Dレンダラーを渡す
      this.groupManager // グループマネージャーを渡す
    );
    
    // StorageManagerにUIManagerへの参照を設定
    this.storageManager.setUIManager(this.uiManager);

    this.dragAndDropHandler = new DragAndDropHandler(
      this.room,
      this.objectManager,
      this.featureManager,
      this.viewRenderer,
      this.coordinateConverter,
      this.groupManager // グループマネージャーを渡す
    );
  }

  /**
   * アプリケーションを初期化する
   */
  init() {
    // UIイベントリスナーの設定
    this.uiManager.setup((obj) => this.uiManager.handleDoubleClick(obj));

    // ドラッグ&ドロップの設定
    const topCanvas = document.getElementById('topView');
    this.dragAndDropHandler.setup(topCanvas, (obj) => {
      this.uiManager.handleDoubleClick(obj);
    });

    // 部屋サイズの初期値を設定
    this.uiManager.updateRoomSizeInputs();

    // 3Dビューの初期化
    this.init3DView();

    // 初期描画
    this.viewRenderer.drawAll();
    if (this.view3DRenderer) {
      this.view3DRenderer.rebuild();
      this.update3DZoomLevel();
    }
  }

  /**
   * 3Dビューを初期化する
   */
  init3DView() {
    const container = document.getElementById('view3DContainer');
    if (!container) return;

    // 3Dレンダラーの初期化
    this.view3DRenderer.init(container);

    // 3DビューのUIイベントハンドラーを設定
    this.setup3DViewHandlers();

    // リサイズハンドラー
    window.addEventListener('resize', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.onResize();
      }
    });
  }

  /**
   * 3DビューのUIイベントハンドラーを設定する
   */
  setup3DViewHandlers() {
    // ビュータイプ切り替え
    document.getElementById('view3DIsometric').addEventListener('click', () => {
      this.view3DRenderer.setViewType('isometric');
      this.update3DViewButtons('isometric');
      this.update3DCaption();
    });

    document.getElementById('view3DElevation').addEventListener('click', () => {
      this.view3DRenderer.setViewType('elevation');
      this.update3DViewButtons('elevation');
      this.update3DCaption();
    });

    document.getElementById('view3DPlan').addEventListener('click', () => {
      this.view3DRenderer.setViewType('plan');
      this.update3DViewButtons('plan');
      this.update3DCaption();
    });

    // 方向切り替え
    document.getElementById('view3DFront').addEventListener('click', () => {
      this.view3DRenderer.setDirection('front');
      this.update3DDirectionButtons('front');
      this.update3DCaption();
    });

    document.getElementById('view3DBack').addEventListener('click', () => {
      this.view3DRenderer.setDirection('back');
      this.update3DDirectionButtons('back');
      this.update3DCaption();
    });

    document.getElementById('view3DLeft').addEventListener('click', () => {
      this.view3DRenderer.setDirection('left');
      this.update3DDirectionButtons('left');
      this.update3DCaption();
    });

    document.getElementById('view3DRight').addEventListener('click', () => {
      this.view3DRenderer.setDirection('right');
      this.update3DDirectionButtons('right');
      this.update3DCaption();
    });

    // 30度右回転ボタン
    document.getElementById('view3DRotateRight30').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.rotateRight30();
        this.update3DDirectionButtons(this.view3DRenderer.currentDirection);
        this.update3DCaption();
      }
    });

    // 更新ボタン
    document.getElementById('view3DUpdate').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.rebuild();
      }
    });

    // ズーム制御
    document.getElementById('view3DZoomIn').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.zoomIn();
        this.update3DZoomLevel();
      }
    });

    document.getElementById('view3DZoomOut').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.zoomOut();
        this.update3DZoomLevel();
      }
    });

    document.getElementById('view3DZoomReset').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.setZoomLevel(0);
        this.update3DZoomLevel();
      }
    });

    // フローリング色選択
    document.getElementById('flooringDarkBrown').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.setFlooringColor('darkbrown');
        this.updateFlooringColorButtons('darkbrown');
      }
    });

    document.getElementById('flooringWhite').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.setFlooringColor('white');
        this.updateFlooringColorButtons('white');
      }
    });

    document.getElementById('flooringBeige').addEventListener('click', () => {
      if (this.view3DRenderer) {
        this.view3DRenderer.setFlooringColor('beige');
        this.updateFlooringColorButtons('beige');
      }
    });
  }

  /**
   * 3Dビューのズームレベル表示を更新する
   */
  update3DZoomLevel() {
    const zoomLevelElement = document.getElementById('view3DZoomLevel');
    if (!zoomLevelElement || !this.view3DRenderer) return;

    const zoomLevel = this.view3DRenderer.zoomLevel;
    const zoomLabels = {
      '-1': '縮小',
      '0': '標準',
      '1': '拡大'
    };
    zoomLevelElement.textContent = zoomLabels[zoomLevel.toString()] || '標準';
  }

  /**
   * フローリング色ボタンのスタイルを更新する
   * @param {string} color - 'darkbrown', 'white', 'beige'
   */
  updateFlooringColorButtons(color) {
    document.querySelectorAll('.flooring-color-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonMap = {
      'darkbrown': 'flooringDarkBrown',
      'white': 'flooringWhite',
      'beige': 'flooringBeige'
    };
    
    const activeBtn = document.getElementById(buttonMap[color]);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * 3Dビューのボタンスタイルを更新する
   * @param {string} viewType - ビュータイプ
   */
  update3DViewButtons(viewType) {
    document.querySelectorAll('.view3D-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonMap = {
      'isometric': 'view3DIsometric',
      'elevation': 'view3DElevation',
      'plan': 'view3DPlan'
    };
    
    const activeBtn = document.getElementById(buttonMap[viewType]);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * 3Dビューの方向ボタンスタイルを更新する
   * @param {string} direction - 方向
   */
  update3DDirectionButtons(direction) {
    document.querySelectorAll('.view3D-direction-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonMap = {
      'front': 'view3DFront',
      'back': 'view3DBack',
      'left': 'view3DLeft',
      'right': 'view3DRight'
    };
    
    const activeBtn = document.getElementById(buttonMap[direction]);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  /**
   * 3Dビューのキャプションを更新する
   */
  update3DCaption() {
    const caption = document.getElementById('view3DCaption');
    if (!caption || !this.view3DRenderer) return;

    const viewTypeNames = {
      'isometric': '見取図',
      'elevation': '立面図',
      'plan': '平面図'
    };

    const directionNames = {
      'front': '前',
      'back': '後',
      'left': '左',
      'right': '右'
    };

    const viewType = this.view3DRenderer.currentViewType;
    const direction = this.view3DRenderer.currentDirection;
    
    caption.textContent = `${viewTypeNames[viewType] || '3Dビュー'} - ${directionNames[direction] || '前'}方向`;
  }

  /**
   * 3Dビューのズームレベル表示を更新する
   */
  update3DZoomLevel() {
    const zoomLevelElement = document.getElementById('view3DZoomLevel');
    if (!zoomLevelElement || !this.view3DRenderer) return;

    const zoomLevel = this.view3DRenderer.zoomLevel;
    const zoomLabels = {
      '-1': '縮小',
      '0': '標準',
      '1': '拡大'
    };
    zoomLevelElement.textContent = zoomLabels[zoomLevel.toString()] || '標準';
  }

  /**
   * すべてのビューを更新する（データ変更時）
   */
  updateAllViews() {
    this.viewRenderer.drawAll();
    if (this.view3DRenderer) {
      this.view3DRenderer.rebuild();
    }
  }

  /**
   * 帖数から部屋サイズを計算する
   * @param {number} jou - 帖数（5～8）
   * @param {string} type - タイプ（'square': 正方形, 'vertical': 縦長, 'horizontal': 横長）
   * @returns {{width: number, depth: number}} 部屋サイズ（mm）
   */
  calculateRoomSizeFromJou(jou, type = 'square') {
    // 1帖 = 約1.62m² = 1,620,000 mm²
    const jouArea = 1620000; // mm²
    const totalArea = jou * jouArea;
    
    let width, depth;
    
    switch (type) {
      case 'square':
        // 正方形: 1:1
        const side = Math.sqrt(totalArea);
        width = Math.floor(side);
        depth = Math.floor(side);
        break;
        
      case 'vertical':
        // 縦長: 幅:奥行き = 2:3（奥行きが長い）
        // 面積 = 幅 × 奥行き = (2/3 × 奥行き) × 奥行き = (2/3) × 奥行き²
        // 奥行き² = 面積 × 3/2
        depth = Math.floor(Math.sqrt(totalArea * 3 / 2));
        width = Math.floor(depth * 2 / 3);
        break;
        
      case 'horizontal':
        // 横長: 幅:奥行き = 3:2（幅が長い）
        // 面積 = 幅 × 奥行き = 幅 × (2/3 × 幅) = (2/3) × 幅²
        // 幅² = 面積 × 3/2
        width = Math.floor(Math.sqrt(totalArea * 3 / 2));
        depth = Math.floor(width * 2 / 3);
        break;
        
      default:
        // デフォルトは正方形
        const defaultSide = Math.sqrt(totalArea);
        width = Math.floor(defaultSide);
        depth = Math.floor(defaultSide);
    }
    
    // 最大値・最小値の範囲内に収める
    width = Math.max(
      this.ROOM_SIZE_MIN.width,
      Math.min(this.ROOM_SIZE_MAX.width, width)
    );
    depth = Math.max(
      this.ROOM_SIZE_MIN.depth,
      Math.min(this.ROOM_SIZE_MAX.depth, depth)
    );
    
    return { width, depth };
  }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
  const app = new RoomLayoutApp();
  app.init();
});
