// グローバルクラスとして扱う（ブラウザ環境を想定）
describe('LayoutObject', () => {
  let obj;
  let room;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    obj = new LayoutObject();
  });

  describe('constructor', () => {
    test('デフォルト値で初期化される', () => {
      expect(obj.name).toBe('');
      expect(obj.w).toBe(1000);
      expect(obj.d).toBe(1000);
      expect(obj.h).toBe(1000);
      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
      expect(obj.z).toBe(0);
      expect(obj.color).toBe('rgba(0,150,255,0.5)');
      expect(obj.stackable).toBe(true);
    });

    test('カスタム値で初期化される', () => {
      const customObj = new LayoutObject({
        name: '机',
        w: 1200,
        d: 800,
        h: 700,
        x: 100,
        y: 200,
        z: 0,
        color: 'rgba(255,0,0,0.5)',
        stackable: false
      });
      expect(customObj.name).toBe('机');
      expect(customObj.w).toBe(1200);
      expect(customObj.stackable).toBe(false);
    });
  });

  describe('getCenter', () => {
    test('中心座標を正しく計算する', () => {
      obj.x = 100;
      obj.y = 200;
      obj.w = 1000;
      obj.d = 800;
      const center = obj.getCenter();
      expect(center.x).toBe(600);
      expect(center.y).toBe(600);
    });
  });

  describe('rotate90', () => {
    test('90度回転できる', () => {
      obj.x = 100;
      obj.y = 200;
      obj.w = 1000;
      obj.d = 800;
      const centerX = obj.getCenter().x;
      const centerY = obj.getCenter().y;
      
      obj.rotate90(room);
      
      expect(obj.w).toBe(800);
      expect(obj.d).toBe(1000);
      expect(obj.getCenter().x).toBe(centerX);
      expect(obj.getCenter().y).toBe(centerY);
    });

    test('回転後も部屋の境界内に収まる', () => {
      obj.x = 4500;
      obj.y = 3500;
      obj.w = 1000;
      obj.d = 800;
      
      obj.rotate90(room);
      
      expect(obj.x + obj.w).toBeLessThanOrEqual(room.width);
      expect(obj.y + obj.d).toBeLessThanOrEqual(room.depth);
    });
  });

  describe('constrainToRoom', () => {
    test('部屋の境界内に収める', () => {
      obj.x = -100;
      obj.y = -200;
      obj.z = -50;
      obj.constrainToRoom(room);
      expect(obj.x).toBe(0);
      expect(obj.y).toBe(0);
      expect(obj.z).toBe(0);
    });

    test('部屋の境界を超える場合は調整される', () => {
      obj.x = 6000;
      obj.y = 5000;
      obj.z = 3000;
      obj.w = 1000;
      obj.d = 1000;
      obj.h = 1000;
      obj.constrainToRoom(room);
      expect(obj.x).toBe(room.width - obj.w);
      expect(obj.y).toBe(room.depth - obj.d);
      expect(obj.z).toBe(room.height - obj.h);
    });
  });

  describe('toJSON', () => {
    test('JSON形式でデータを返す', () => {
      const json = obj.toJSON();
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('w');
      expect(json).toHaveProperty('d');
      expect(json).toHaveProperty('h');
      expect(json).toHaveProperty('x');
      expect(json).toHaveProperty('y');
      expect(json).toHaveProperty('z');
      expect(json).toHaveProperty('color');
      expect(json).toHaveProperty('stackable');
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからLayoutObjectインスタンスを復元できる', () => {
      const data = {
        name: '机',
        w: 1200,
        d: 800,
        h: 700,
        x: 100,
        y: 200,
        z: 0,
        color: 'rgba(255,0,0,0.5)',
        stackable: false
      };
      const restored = LayoutObject.fromJSON(data);
      expect(restored.name).toBe('机');
      expect(restored.w).toBe(1200);
      expect(restored.stackable).toBe(false);
    });

    test('stackableが未定義の場合はtrueになる', () => {
      const data = {
        w: 1000,
        d: 1000,
        h: 1000,
        x: 0,
        y: 0,
        z: 0
      };
      const restored = LayoutObject.fromJSON(data);
      expect(restored.stackable).toBe(true);
    });

    test('zが未定義の場合は0になる', () => {
      const data = {
        w: 1000,
        d: 1000,
        h: 1000,
        x: 0,
        y: 0
      };
      const restored = LayoutObject.fromJSON(data);
      expect(restored.z).toBe(0);
    });
  });
});

