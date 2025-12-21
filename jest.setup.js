// Jestのセットアップファイル
// ブラウザ環境をシミュレートするために、DOM APIをモック

// DOM要素のモック
global.document = {
  getElementById: jest.fn((id) => {
    const elements = {
      topView: {
        width: 1000,
        height: 480,
        getContext: jest.fn(() => ({
          clearRect: jest.fn(),
          strokeRect: jest.fn(),
          fillRect: jest.fn(),
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          arc: jest.fn(),
          stroke: jest.fn(),
          fill: jest.fn(),
          fillText: jest.fn(),
          save: jest.fn(),
          restore: jest.fn(),
          translate: jest.fn(),
          strokeStyle: '',
          fillStyle: '',
          lineWidth: 0,
          font: '',
          textAlign: '',
          textBaseline: ''
        })),
        getBoundingClientRect: jest.fn(() => ({
          left: 0,
          top: 0,
          width: 1000,
          height: 480
        })),
        addEventListener: jest.fn(),
        width: 1000,
        height: 480
      },
      frontView: {
        width: 800,
        height: 400,
        getContext: jest.fn(() => ({
          clearRect: jest.fn(),
          strokeRect: jest.fn(),
          fillRect: jest.fn()
        }))
      },
      sideView: {
        width: 800,
        height: 400,
        getContext: jest.fn(() => ({
          clearRect: jest.fn(),
          strokeRect: jest.fn(),
          fillRect: jest.fn()
        }))
      },
      roomWidth: { value: 5000, addEventListener: jest.fn() },
      roomDepth: { value: 4000, addEventListener: jest.fn() },
      roomHeight: { value: 2500, addEventListener: jest.fn() },
      topCaption: { textContent: '' },
      frontCaption: { textContent: '' },
      sideCaption: { textContent: '' }
    };
    return elements[id] || { value: '', addEventListener: jest.fn(), classList: { add: jest.fn(), remove: jest.fn() } };
  }),
  createElement: jest.fn((tag) => ({
    tagName: tag,
    href: '',
    download: '',
    click: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.URL = {
  createObjectURL: jest.fn(() => 'blob:url'),
  revokeObjectURL: jest.fn()
};

global.File = class File {
  constructor(parts, name, options) {
    this.name = name;
    this.type = options.type;
    this.parts = parts;
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onerror = null;
  }
  readAsText(file) {
    setTimeout(() => {
      this.result = file.parts.join('');
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
};

// クラスファイルを読み込む
// ブラウザ環境をシミュレートするため、クラスをグローバルに定義
// 実際のテストでは、HTMLファイルから読み込まれる前提で、テスト環境でも同様に扱う

// 注意: 実際のテスト実行時には、ブラウザ環境でクラスが読み込まれている必要があります
// このファイルはDOM APIのモックのみを提供します

