/**
 * ドラッグ&ドロップ処理を行うクラス
 */
class DragAndDropHandler {
  constructor(room, objectManager, featureManager, viewRenderer, coordinateConverter) {
    this.room = room;
    this.objectManager = objectManager;
    this.featureManager = featureManager;
    this.viewRenderer = viewRenderer;
    this.coordinateConverter = coordinateConverter;
    this.dragging = null; // {obj, offsetX, offsetY}
    this.draggingFeature = null; // {feature, offset}
  }

  /**
   * キャンバスにイベントリスナーを設定する
   * @param {HTMLCanvasElement} canvas - キャンバス要素
   * @param {Function} onDoubleClick - ダブルクリック時のコールバック
   */
  setup(canvas, onDoubleClick) {
    this.canvas = canvas;
    this.onDoubleClick = onDoubleClick;

    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseup', () => this.handleMouseUp());
    canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
  }

  /**
   * マウスダウンイベントを処理する
   * @param {MouseEvent} event - マウスイベント
   */
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseXPx = event.clientX - rect.left;
    const mouseYPx = event.clientY - rect.top;
    const roomCoords = this.coordinateConverter.getRoomCoordinatesFromEvent(event, this.canvas);

    // 削除ボタンのチェック
    const featureToDelete = this.featureManager.getFeatureByDeleteButton(
      mouseXPx,
      mouseYPx,
      this.viewRenderer.getButtonCoordinatesFunction(this.canvas)
    );

    if (featureToDelete) {
      this.featureManager.remove(featureToDelete);
      this.viewRenderer.drawAll();
      return;
    }

    // 部屋情報のドラッグ開始
    const feature = this.featureManager.getFeatureAt(
      mouseXPx,
      mouseYPx,
      this.viewRenderer.getCanvasCoordinatesFunction(this.canvas)
    );

    if (feature) {
      this.startFeatureDrag(feature, roomCoords);
      return;
    }

    // オブジェクトのドラッグ開始
    const obj = this.objectManager.getObjectAt(roomCoords.x, roomCoords.y);
    if (obj) {
      this.startObjectDrag(obj, roomCoords);
    }
  }

  /**
   * 部屋情報のドラッグを開始する
   * @param {RoomFeature} feature - 部屋情報
   * @param {{x: number, y: number}} roomCoords - 部屋座標
   */
  startFeatureDrag(feature, roomCoords) {
    const centerPos = feature.position + feature.width / 2;
    const isHorizontal = feature.wall === 'top' || feature.wall === 'bottom';
    const mousePos = isHorizontal ? roomCoords.x : roomCoords.y;
    this.draggingFeature = { feature, offset: mousePos - centerPos };
  }

  /**
   * オブジェクトのドラッグを開始する
   * @param {LayoutObject} obj - オブジェクト
   * @param {{x: number, y: number}} roomCoords - 部屋座標
   */
  startObjectDrag(obj, roomCoords) {
    this.dragging = {
      obj,
      offsetX: roomCoords.x - obj.x,
      offsetY: roomCoords.y - obj.y
    };
  }

  /**
   * マウスムーブイベントを処理する
   * @param {MouseEvent} event - マウスイベント
   */
  handleMouseMove(event) {
    const roomCoords = this.coordinateConverter.getRoomCoordinatesFromEvent(event, this.canvas);

    if (this.draggingFeature) {
      this.updateFeaturePosition(this.draggingFeature.feature, roomCoords);
      this.viewRenderer.drawAll();
      return;
    }

    if (!this.dragging) return;

    this.updateObjectPosition(this.dragging.obj, roomCoords);
    this.viewRenderer.drawAll();
  }

  /**
   * 部屋情報の位置を更新する
   * @param {RoomFeature} feature - 部屋情報
   * @param {{x: number, y: number}} roomCoords - 部屋座標
   */
  updateFeaturePosition(feature, roomCoords) {
    const wallLength = feature.getWallLength(this.room);
    const isHorizontal = feature.wall === 'top' || feature.wall === 'bottom';
    const mousePos = isHorizontal ? roomCoords.x : roomCoords.y;
    const centerPos = mousePos - this.draggingFeature.offset;
    feature.position = Math.max(0, Math.min(wallLength - feature.width, centerPos - feature.width / 2));
  }

  /**
   * オブジェクトの位置を更新する
   * @param {LayoutObject} obj - オブジェクト
   * @param {{x: number, y: number}} roomCoords - 部屋座標
   */
  updateObjectPosition(obj, roomCoords) {
    let newX = Math.max(0, Math.min(this.room.width - obj.w, roomCoords.x - this.dragging.offsetX));
    let newY = Math.max(0, Math.min(this.room.depth - obj.d, roomCoords.y - this.dragging.offsetY));

    if (!obj.stackable && this.objectManager.checkOverlap(obj, newX, newY)) {
      return;
    }

    obj.x = newX;
    obj.y = newY;
  }

  /**
   * マウスアップイベントを処理する
   */
  handleMouseUp() {
    this.dragging = null;
    this.draggingFeature = null;
  }

  /**
   * ダブルクリックイベントを処理する
   * @param {MouseEvent} event - マウスイベント
   */
  handleDoubleClick(event) {
    const roomCoords = this.coordinateConverter.getRoomCoordinatesFromEvent(event, this.canvas);
    const obj = this.objectManager.getObjectAt(roomCoords.x, roomCoords.y);
    if (obj && this.onDoubleClick) {
      this.onDoubleClick(obj);
    }
  }
}

