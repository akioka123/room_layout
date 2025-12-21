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
    this.storageManager = new StorageManager(
      this.room,
      this.objectManager,
      this.featureManager
    );

    // レンダラー
    this.viewRenderer = new ViewRenderer(
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
      this // appインスタンスを渡して帖数計算関数を使えるようにする
    );

    this.dragAndDropHandler = new DragAndDropHandler(
      this.room,
      this.objectManager,
      this.featureManager,
      this.viewRenderer,
      this.coordinateConverter
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

    // 初期描画
    this.viewRenderer.drawAll();
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
