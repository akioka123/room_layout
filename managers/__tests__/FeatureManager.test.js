describe('FeatureManager', () => {
  let room;
  let manager;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    manager = new FeatureManager(room);
  });

  describe('add', () => {
    test('部屋情報を追加できる', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      manager.add(feature);
      expect(manager.getAll()).toContain(feature);
    });

    test('追加時に境界が検証される', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: -100, width: 6000 });
      manager.add(feature);
      expect(feature.position).toBeGreaterThanOrEqual(0);
      expect(feature.width).toBeLessThanOrEqual(room.width);
    });

    test('幅が0以下の場合は追加されない', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 0 });
      manager.add(feature);
      expect(manager.getAll()).not.toContain(feature);
    });
  });

  describe('remove', () => {
    test('部屋情報を削除できる', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top' });
      manager.add(feature);
      manager.remove(feature);
      expect(manager.getAll()).not.toContain(feature);
    });
  });

  describe('getFeatureAt', () => {
    test('指定座標にある部屋情報を取得できる', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      manager.add(feature);
      
      const getCanvasCoordinates = (f) => ({
        x: 100,
        y: 100,
        width: 100,
        height: 30
      });
      
      const found = manager.getFeatureAt(150, 115, getCanvasCoordinates);
      expect(found).toBe(feature);
    });

    test('指定座標に部屋情報がない場合はnullを返す', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      manager.add(feature);
      
      const getCanvasCoordinates = (f) => ({
        x: 100,
        y: 100,
        width: 100,
        height: 30
      });
      
      const found = manager.getFeatureAt(500, 500, getCanvasCoordinates);
      expect(found).toBeNull();
    });
  });

  describe('getFeatureByDeleteButton', () => {
    test('削除ボタン内の座標で部屋情報を取得できる', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      manager.add(feature);
      
      const getButtonCoordinates = (f) => ({
        x: 100,
        y: 100
      });
      
      const found = manager.getFeatureByDeleteButton(107, 107, getButtonCoordinates);
      expect(found).toBe(feature);
    });

    test('削除ボタン外の座標の場合はnullを返す', () => {
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      manager.add(feature);
      
      const getButtonCoordinates = (f) => ({
        x: 100,
        y: 100
      });
      
      const found = manager.getFeatureByDeleteButton(200, 200, getButtonCoordinates);
      expect(found).toBeNull();
    });
  });

  describe('isPointInRect', () => {
    test('点が矩形内にある場合、trueを返す', () => {
      const rect = { x: 100, y: 100, width: 200, height: 150 };
      expect(manager.isPointInRect(150, 150, rect)).toBe(true);
    });

    test('点が矩形外にある場合、falseを返す', () => {
      const rect = { x: 100, y: 100, width: 200, height: 150 };
      expect(manager.isPointInRect(500, 500, rect)).toBe(false);
    });

    test('正方形の場合、sizeパラメータを使用する', () => {
      const rect = { x: 100, y: 100 };
      expect(manager.isPointInRect(107, 107, rect, 14)).toBe(true);
      expect(manager.isPointInRect(200, 200, rect, 14)).toBe(false);
    });
  });

  describe('clear', () => {
    test('すべての部屋情報をクリアできる', () => {
      manager.add(new RoomFeature({ type: 'window', wall: 'top' }));
      manager.add(new RoomFeature({ type: 'door', wall: 'right' }));
      manager.clear();
      expect(manager.getAll()).toHaveLength(0);
    });
  });

  describe('loadFromJSON', () => {
    test('JSONデータから部屋情報を復元できる', () => {
      const data = [
        { type: 'window', wall: 'top', position: 0, width: 1000 },
        { type: 'door', wall: 'right', position: 1000, width: 800 }
      ];
      manager.loadFromJSON(data);
      expect(manager.getAll()).toHaveLength(2);
      expect(manager.getAll()[0].type).toBe('window');
      expect(manager.getAll()[1].type).toBe('door');
    });

    test('nullまたはundefinedの場合は空配列になる', () => {
      manager.loadFromJSON(null);
      expect(manager.getAll()).toHaveLength(0);
    });
  });
});

