describe('StorageManager', () => {
  let room;
  let objectManager;
  let featureManager;
  let storageManager;

  beforeEach(() => {
    room = new Room(5000, 4000, 2500);
    objectManager = new ObjectManager(room);
    featureManager = new FeatureManager(room);
    storageManager = new StorageManager(room, objectManager, featureManager);
    
    // localStorageをモック
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
  });

  describe('save', () => {
    test('レイアウトデータを保存できる', () => {
      const obj = new LayoutObject({ name: '机', w: 1000, d: 800, h: 700 });
      objectManager.add(obj);
      const feature = new RoomFeature({ type: 'window', wall: 'top', position: 0, width: 1000 });
      featureManager.add(feature);
      
      storageManager.save();
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'roomLayout',
        expect.stringContaining('"room"')
      );
    });
  });

  describe('load', () => {
    test('保存されたレイアウトデータを読み込める', () => {
      const layoutData = {
        room: { width: 6000, depth: 4500, height: 2800 },
        objects: [
          { name: '机', w: 1000, d: 800, h: 700, x: 0, y: 0, z: 0, color: 'rgba(0,150,255,0.5)', stackable: true }
        ],
        roomFeatures: [
          { type: 'window', wall: 'top', position: 0, width: 1000 }
        ],
        version: '1.0',
        savedAt: new Date().toISOString()
      };
      
      global.localStorage.getItem.mockReturnValue(JSON.stringify(layoutData));
      
      const result = storageManager.load();
      
      expect(result).toBe(true);
      expect(room.width).toBe(6000);
      expect(room.depth).toBe(4500);
      expect(room.height).toBe(2800);
      expect(objectManager.getAll()).toHaveLength(1);
      expect(featureManager.getAll()).toHaveLength(1);
    });

    test('保存されたデータがない場合はfalseを返す', () => {
      global.localStorage.getItem.mockReturnValue(null);
      
      const result = storageManager.load();
      
      expect(result).toBe(false);
    });

    test('無効なJSONの場合はエラーをスローする', () => {
      global.localStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => storageManager.load()).toThrow();
    });
  });

  describe('loadFromFile', () => {
    test('ファイルからレイアウトデータを読み込める', async () => {
      const layoutData = {
        room: { width: 6000, depth: 4500, height: 2800 },
        objects: [
          { name: '机', w: 1000, d: 800, h: 700, x: 0, y: 0, z: 0, color: 'rgba(0,150,255,0.5)', stackable: true }
        ],
        roomFeatures: [
          { type: 'window', wall: 'top', position: 0, width: 1000 }
        ],
        version: '1.0',
        savedAt: new Date().toISOString()
      };
      
      const file = new File([JSON.stringify(layoutData)], 'test.json', { type: 'application/json' });
      
      const result = await storageManager.loadFromFile(file);
      
      expect(result).toBe(true);
      expect(room.width).toBe(6000);
      expect(objectManager.getAll()).toHaveLength(1);
    });

    test('無効なJSONファイルの場合はエラーをスローする', async () => {
      const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
      
      await expect(storageManager.loadFromFile(file)).rejects.toThrow();
    });
  });

  describe('download', () => {
    test('レイアウトデータをダウンロードできる', () => {
      // DOM操作をモック
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      const clickSpy = jest.fn();
      const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
      
      const mockAnchor = {
        href: '',
        download: '',
        click: clickSpy
      };
      createElementSpy.mockReturnValue(mockAnchor);
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      
      storageManager.download();
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });
});

