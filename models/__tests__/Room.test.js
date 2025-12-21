// グローバルクラスとして扱う（ブラウザ環境を想定）
describe('Room', () => {
  let room;

  beforeEach(() => {
    room = new Room();
  });

  describe('constructor', () => {
    test('デフォルト値で初期化される', () => {
      expect(room.width).toBe(5900);
      expect(room.depth).toBe(2200);
      expect(room.height).toBe(2500);
    });

    test('カスタム値で初期化される', () => {
      const customRoom = new Room(6000, 3000, 2800);
      expect(customRoom.width).toBe(6000);
      expect(customRoom.depth).toBe(3000);
      expect(customRoom.height).toBe(2800);
    });
  });

  describe('updateSize', () => {
    test('サイズを更新できる', () => {
      room.updateSize(5000, 4000, 2500);
      expect(room.width).toBe(5000);
      expect(room.depth).toBe(4000);
      expect(room.height).toBe(2500);
    });
  });

  describe('toJSON', () => {
    test('JSON形式でデータを返す', () => {
      const json = room.toJSON();
      expect(json).toEqual({
        width: 5900,
        depth: 2200,
        height: 2500
      });
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからRoomインスタンスを復元できる', () => {
      const data = { width: 5000, depth: 4000, height: 2500 };
      const restored = Room.fromJSON(data);
      expect(restored.width).toBe(5000);
      expect(restored.depth).toBe(4000);
      expect(restored.height).toBe(2500);
    });
  });
});

