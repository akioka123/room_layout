// グローバルクラスとして扱う（ブラウザ環境を想定）
describe('RoomFeature', () => {
  let feature;
  let room;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    feature = new RoomFeature();
  });

  describe('constructor', () => {
    test('デフォルト値で初期化される', () => {
      expect(feature.type).toBe('window');
      expect(feature.wall).toBe('top');
      expect(feature.position).toBe(0);
      expect(feature.width).toBe(1000);
    });

    test('カスタム値で初期化される', () => {
      const customFeature = new RoomFeature({
        type: 'door',
        wall: 'right',
        position: 1000,
        width: 800
      });
      expect(customFeature.type).toBe('door');
      expect(customFeature.wall).toBe('right');
      expect(customFeature.position).toBe(1000);
      expect(customFeature.width).toBe(800);
    });
  });

  describe('getWallLength', () => {
    test('top壁面の長さを正しく取得する', () => {
      feature.wall = 'top';
      expect(feature.getWallLength(room)).toBe(room.width);
    });

    test('bottom壁面の長さを正しく取得する', () => {
      feature.wall = 'bottom';
      expect(feature.getWallLength(room)).toBe(room.width);
    });

    test('right壁面の長さを正しく取得する', () => {
      feature.wall = 'right';
      expect(feature.getWallLength(room)).toBe(room.depth);
    });

    test('left壁面の長さを正しく取得する', () => {
      feature.wall = 'left';
      expect(feature.getWallLength(room)).toBe(room.depth);
    });
  });

  describe('validateBounds', () => {
    test('位置が負の値の場合は0に調整される', () => {
      feature.position = -100;
      feature.validateBounds(room);
      expect(feature.position).toBe(0);
    });

    test('位置と幅が壁面を超える場合は調整される', () => {
      feature.wall = 'top';
      feature.position = 4500;
      feature.width = 1000;
      feature.validateBounds(room);
      expect(feature.position + feature.width).toBeLessThanOrEqual(room.width);
    });

    test('幅が壁面を超える場合は調整される', () => {
      feature.wall = 'top';
      feature.position = 0;
      feature.width = 6000;
      feature.validateBounds(room);
      expect(feature.width).toBeLessThanOrEqual(room.width);
    });
  });

  describe('toJSON', () => {
    test('JSON形式でデータを返す', () => {
      const json = feature.toJSON();
      expect(json).toHaveProperty('type');
      expect(json).toHaveProperty('wall');
      expect(json).toHaveProperty('position');
      expect(json).toHaveProperty('width');
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからRoomFeatureインスタンスを復元できる', () => {
      const data = {
        type: 'door',
        wall: 'right',
        position: 1000,
        width: 800
      };
      const restored = RoomFeature.fromJSON(data);
      expect(restored.type).toBe('door');
      expect(restored.wall).toBe('right');
      expect(restored.position).toBe(1000);
      expect(restored.width).toBe(800);
    });
  });
});

