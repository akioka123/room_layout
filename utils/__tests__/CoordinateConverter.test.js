describe('CoordinateConverter', () => {
  let room;
  let converter;
  let canvas;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    converter = new CoordinateConverter(room, 0.1, 30);
    
    // キャンバスをモック
    canvas = {
      width: 1000,
      height: 480,
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 480
      }))
    };
  });

  describe('canvasToRoom', () => {
    test('キャンバス座標を部屋座標に変換できる', () => {
      const roomW = room.width * 0.1;
      const roomD = room.depth * 0.1;
      const totalW = roomW + 30 * 2;
      const totalD = roomD + 30 * 2;
      const centerX = (canvas.width - totalW) / 2;
      const centerY = (canvas.height - totalD) / 2;
      
      const canvasX = centerX + 30 + 1000; // 1000mmの位置
      const canvasY = centerY + 30 + 2000; // 2000mmの位置
      
      const result = converter.canvasToRoom(canvasX, canvasY, canvas);
      
      expect(result.x).toBeCloseTo(1000, 1);
      expect(result.y).toBeCloseTo(2000, 1);
    });
  });

  describe('getRoomCoordinatesFromEvent', () => {
    test('マウスイベントから部屋座標を取得できる', () => {
      const event = {
        clientX: 500,
        clientY: 240
      };
      
      const result = converter.getRoomCoordinatesFromEvent(event, canvas);
      
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });
  });
});

