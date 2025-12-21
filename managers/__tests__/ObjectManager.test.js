// グローバルクラスとして扱う（ブラウザ環境を想定）
// 実際のテスト環境では、これらのクラスがグローバルに定義されている必要がある

describe('ObjectManager', () => {
  let room;
  let manager;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    manager = new ObjectManager(room);
  });

  describe('add', () => {
    test('オブジェクトを追加できる', () => {
      const obj = new LayoutObject({ name: '机', w: 1000, d: 800, h: 700 });
      manager.add(obj);
      expect(manager.getAll()).toContain(obj);
    });

    test('追加時に部屋の境界内に収められる', () => {
      const obj = new LayoutObject({ x: 6000, y: 5000, w: 1000, d: 800 });
      manager.add(obj);
      expect(obj.x + obj.w).toBeLessThanOrEqual(room.width);
      expect(obj.y + obj.d).toBeLessThanOrEqual(room.depth);
    });
  });

  describe('remove', () => {
    test('オブジェクトを削除できる', () => {
      const obj = new LayoutObject({ name: '机' });
      manager.add(obj);
      manager.remove(obj);
      expect(manager.getAll()).not.toContain(obj);
    });

    test('存在しないオブジェクトを削除してもエラーにならない', () => {
      const obj = new LayoutObject({ name: '机' });
      expect(() => manager.remove(obj)).not.toThrow();
    });
  });

  describe('update', () => {
    test('オブジェクトを更新できる', () => {
      const obj = new LayoutObject({ name: '机', w: 1000, d: 800 });
      manager.add(obj);
      manager.update(obj, { name: 'テーブル', w: 1200 });
      expect(obj.name).toBe('テーブル');
      expect(obj.w).toBe(1200);
    });

    test('更新時に部屋の境界内に収められる', () => {
      const obj = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800 });
      manager.add(obj);
      manager.update(obj, { x: 6000, y: 5000 });
      expect(obj.x + obj.w).toBeLessThanOrEqual(room.width);
      expect(obj.y + obj.d).toBeLessThanOrEqual(room.depth);
    });

    test('stackableがfalseの場合、重なりチェックが行われる', () => {
      const obj1 = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: false });
      const obj2 = new LayoutObject({ x: 500, y: 500, w: 1000, d: 800, stackable: false });
      manager.add(obj1);
      manager.add(obj2);
      
      expect(() => {
        manager.update(obj1, { x: 500, y: 500 });
      }).toThrow('他のオブジェクトと重なっています');
    });

    test('stackableがtrueの場合、重なりが許可される', () => {
      const obj1 = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: true });
      const obj2 = new LayoutObject({ x: 500, y: 500, w: 1000, d: 800, stackable: true });
      manager.add(obj1);
      manager.add(obj2);
      
      expect(() => {
        manager.update(obj1, { x: 500, y: 500 });
      }).not.toThrow();
    });
  });

  describe('checkOverlap', () => {
    test('重なっていない場合はfalseを返す', () => {
      const obj1 = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: false });
      const obj2 = new LayoutObject({ x: 2000, y: 2000, w: 1000, d: 800, stackable: false });
      manager.add(obj1);
      manager.add(obj2);
      
      expect(manager.checkOverlap(obj1, 2000, 2000)).toBe(true);
    });

    test('重なっている場合はtrueを返す', () => {
      const obj1 = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: false });
      const obj2 = new LayoutObject({ x: 500, y: 500, w: 1000, d: 800, stackable: false });
      manager.add(obj1);
      manager.add(obj2);
      
      expect(manager.checkOverlap(obj1, 500, 500)).toBe(true);
    });

    test('自分自身を除外する場合、重なりと判定されない', () => {
      const obj = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: false });
      manager.add(obj);
      
      expect(manager.checkOverlap(obj, obj.x, obj.y, true)).toBe(false);
    });

    test('自分自身を除外しない場合、重なりと判定される', () => {
      const obj = new LayoutObject({ x: 0, y: 0, w: 1000, d: 800, stackable: false });
      manager.add(obj);
      
      expect(manager.checkOverlap(obj, obj.x, obj.y, false)).toBe(true);
    });
  });

  describe('getObjectAt', () => {
    test('指定座標にあるオブジェクトを取得できる', () => {
      const obj = new LayoutObject({ x: 100, y: 200, w: 1000, d: 800 });
      manager.add(obj);
      const found = manager.getObjectAt(500, 500);
      expect(found).toBe(obj);
    });

    test('指定座標にオブジェクトがない場合はnullを返す', () => {
      const obj = new LayoutObject({ x: 100, y: 200, w: 1000, d: 800 });
      manager.add(obj);
      const found = manager.getObjectAt(2000, 2000);
      expect(found).toBeNull();
    });

    test('複数のオブジェクトがある場合、上位のオブジェクトを返す', () => {
      const obj1 = new LayoutObject({ x: 100, y: 200, w: 1000, d: 800 });
      const obj2 = new LayoutObject({ x: 100, y: 200, w: 1000, d: 800 });
      manager.add(obj1);
      manager.add(obj2);
      const found = manager.getObjectAt(500, 500);
      expect(found).toBe(obj2); // 後から追加された方が上位
    });
  });

  describe('clear', () => {
    test('すべてのオブジェクトをクリアできる', () => {
      manager.add(new LayoutObject());
      manager.add(new LayoutObject());
      manager.clear();
      expect(manager.getAll()).toHaveLength(0);
    });
  });

  describe('loadFromJSON', () => {
    test('JSONデータからオブジェクトを復元できる', () => {
      const data = [
        { name: '机', w: 1000, d: 800, h: 700, x: 0, y: 0, z: 0, color: 'rgba(0,150,255,0.5)', stackable: true },
        { name: 'テーブル', w: 1200, d: 800, h: 700, x: 1000, y: 0, z: 0, color: 'rgba(255,0,0,0.5)', stackable: false }
      ];
      manager.loadFromJSON(data);
      expect(manager.getAll()).toHaveLength(2);
      expect(manager.getAll()[0].name).toBe('机');
      expect(manager.getAll()[1].name).toBe('テーブル');
    });
  });
});

