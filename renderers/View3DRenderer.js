/**
 * 3Dビュー（見取図・立面図・平面図）の描画を行うクラス
 */
class View3DRenderer {
    constructor(room, objectManager, featureManager, scale) {
        this.room = room;
        this.objectManager = objectManager;
        this.featureManager = featureManager;
        this.scale = scale;

        // 3Dシーンの基本要素
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container = null;

        // 現在のビュータイプと方向
        this.currentViewType = 'isometric'; // 'isometric', 'elevation', 'plan'
        this.currentDirection = 'front'; // 'front', 'back', 'left', 'right'
        
        // 回転角度（度単位、0～360）
        this.rotationAngle = 0;

        // ズームレベル: -1 (縮小), 0 (標準・少し拡大), 1 (拡大)
        this.zoomLevel = 0;

        // フローリング色: 'darkbrown' (こげ茶), 'white' (白), 'beige' (ベージュ)
        this.flooringColor = 'darkbrown';

        // 3Dオブジェクトの参照
        this.roomMesh = null;
        this.floorMesh = null;
        this.objectMeshes = [];
        this.featureMeshes = [];
    }

    /**
     * 3Dレンダラーを初期化する
     * @param {HTMLElement} container - 3Dビューを表示するコンテナ要素
     */
    init(container) {
        this.container = container;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xfafafa);

        // カメラの作成（初期は等角投影）
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
        this.updateCamera();

        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // ライトの追加
        this.setupLights();

        // 初期描画
        this.buildScene();
        this.render();
    }

    /**
     * ライトを設定する
     */
    setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 指向性ライト
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight1.position.set(1, 1, 1);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        directionalLight2.position.set(-1, 1, -1);
        this.scene.add(directionalLight2);
    }

    /**
     * シーンを構築する
     */
    buildScene() {
        // 既存のメッシュをクリア
        this.clearScene();

        // 部屋の作成
        this.createRoom();

        // オブジェクトの作成
        this.createObjects();

        // 部屋情報（窓・ドア・クローゼット）の作成
        this.createFeatures();
    }

    /**
     * シーンをクリアする
     */
    clearScene() {
        // 既存のメッシュを削除
        if (this.roomMesh) {
            this.scene.remove(this.roomMesh);
            this.roomMesh.geometry.dispose();
            this.roomMesh.material.dispose();
            this.roomMesh = null;
        }

        // 床面を削除
        if (this.floorMesh) {
            this.scene.remove(this.floorMesh);
            this.floorMesh.geometry.dispose();
            this.floorMesh.material.dispose();
            this.floorMesh = null;
        }

        // オブジェクトメッシュを削除
        this.objectMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        this.objectMeshes = [];

        // 部屋情報メッシュを削除
        this.featureMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        this.featureMeshes = [];
    }

    /**
     * 部屋の3Dメッシュを作成する
     */
    createRoom() {
        // 座標系変換: 既存X → Three.js X、既存Y → Three.js Z、既存Z → Three.js Y
        const width = this.room.width / 1000; // mm → m
        const depth = this.room.depth / 1000;
        const height = this.room.height / 1000;

        // 部屋のワイヤーフレームを作成
        const roomGeometry = new THREE.BoxGeometry(width, height, depth);
        const roomMaterial = new THREE.MeshBasicMaterial({
            color: 0xbbbbbb,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });

        this.roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
        // 部屋の中心を原点に配置（座標系変換後）
        this.roomMesh.position.set(width / 2, height / 2, depth / 2);
        this.scene.add(this.roomMesh);

        // 床面を追加（フローリングテクスチャを使用）
        const floorGeometry = new THREE.PlaneGeometry(width, depth);
        const floorTexture = this.createFlooringTexture();
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        this.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floorMesh.rotation.x = -Math.PI / 2;
        this.floorMesh.position.set(width / 2, 0, depth / 2);
        this.floorMesh.receiveShadow = true;
        this.scene.add(this.floorMesh);
    }

    /**
     * オブジェクトの3Dメッシュを作成する
     */
    createObjects() {
        this.objectManager.getAll().forEach(obj => {
            // 座標系変換
            const w = obj.w / 1000; // mm → m
            const d = obj.d / 1000;
            const h = obj.h / 1000;
            const x = obj.x / 1000;
            const y = obj.y / 1000;
            const z = obj.z / 1000;

            // 色の変換（rgba文字列からTHREE.Colorに変換）
            const color = this.parseColor(obj.color);

            // ボックスメッシュの作成
            const geometry = new THREE.BoxGeometry(w, h, d);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);

            // 位置設定（座標系変換: X→X, Y→Z, Z→Y）
            mesh.position.set(x + w / 2, z + h / 2, y + d / 2);

            // 影を有効化
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.scene.add(mesh);
            this.objectMeshes.push(mesh);
        });
    }

    /**
     * 部屋情報（窓・ドア・クローゼット）の3Dメッシュを作成する
     */
    createFeatures() {
        const featureOffset = 0.05;
        this.featureManager.getAll().forEach(feature => {
            const width = feature.width / 1000; // mm → m
            const position = feature.position / 1000;
            const roomWidth = this.room.width / 1000;
            const roomDepth = this.room.depth / 1000;
            const roomHeight = this.room.height / 1000;

            let geometry, material, mesh;
            let x, y, z;

            // 特徴に応じた色と高さ
            let color, featureHeight;
            switch (feature.type) {
                case 'window':
                    color = 0x87ceeb; // スカイブルー
                    featureHeight = 1.2; // 窓の高さ（m）
                    break;
                case 'door':
                    color = 0x8b4513; // 茶色
                    featureHeight = 2.0; // ドアの高さ（m）
                    break;
                case 'closet':
                    color = 0x696969; // グレー
                    featureHeight = roomHeight; // クローゼットは天井まで
                    break;
                default:
                    color = 0xcccccc;
                    featureHeight = 1.5;
            }

            // 壁面に応じた配置
            switch (feature.wall) {
                case 'top': // 奥の壁（Z軸方向）
                    geometry = new THREE.BoxGeometry(width, featureHeight, 0.1);
                    x = position + width / 2;
                    y = featureHeight / 2;
                    z = -featureOffset;
                    break;
                case 'right': // 右の壁（X軸方向）
                    geometry = new THREE.BoxGeometry(0.1, featureHeight, width);
                    x = roomWidth + featureOffset;
                    y = featureHeight / 2;
                    z = position + width / 2;
                    break;
                case 'bottom': // 手前の壁（Z軸方向）
                    geometry = new THREE.BoxGeometry(width, featureHeight, 0.1);
                    x = position + width / 2;
                    y = featureHeight / 2;
                    z = roomDepth + featureOffset;
                    break;
                case 'left': // 左の壁（X軸方向）
                    geometry = new THREE.BoxGeometry(0.1, featureHeight, width);
                    x = -featureOffset;
                    y = featureHeight / 2;
                    z = position + width / 2;
                    break;
            }

            material = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.15
            });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);

            this.scene.add(mesh);
            this.featureMeshes.push(mesh);
        });
    }

    /**
     * 色文字列をTHREE.Colorに変換する
     * @param {string} colorStr - rgba文字列
     * @returns {number} 色の数値
     */
    parseColor(colorStr) {
        if (!colorStr) return 0x0096ff;

        // rgba(0,150,255,0.5) 形式を解析
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return (r << 16) | (g << 8) | b;
        }
        return 0x0096ff;
    }

    /**
     * フローリングテクスチャを生成する
     * @returns {THREE.Texture} フローリングテクスチャ
     */
    createFlooringTexture() {
        const canvas = document.createElement('canvas');
        const size = 512; // テクスチャサイズ
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // フローリングの色設定
        const colorMap = {
            'darkbrown': {
                base: '#5C4033',      // こげ茶（ベース）
                light: '#8B6F47',     // 明るいこげ茶
                dark: '#3D2817',      // 暗いこげ茶
                line: '#2F1F14'       // ライン色
            },
            'white': {
                base: '#F5F5F5',      // 白（ベース）
                light: '#FFFFFF',     // 純白
                dark: '#E0E0E0',      // グレー
                line: '#D0D0D0'       // ライン色
            },
            'beige': {
                base: '#F5E6D3',      // ベージュ（ベース）
                light: '#FAF0E6',     // 明るいベージュ
                dark: '#E6D5C3',      // 暗いベージュ
                line: '#D4C4B0'       // ライン色
            }
        };

        const colors = colorMap[this.flooringColor] || colorMap['darkbrown'];

        // 背景をベース色で塗りつぶし
        ctx.fillStyle = colors.base;
        ctx.fillRect(0, 0, size, size);

        // フローリングの板目パターンを描画
        const boardWidth = size / 8; // 板の幅
        const boardLength = size; // 板の長さ

        for (let i = 0; i < 8; i++) {
            const x = i * boardWidth;

            // 板のグラデーション効果
            const gradient = ctx.createLinearGradient(x, 0, x + boardWidth, 0);
            gradient.addColorStop(0, colors.dark);
            gradient.addColorStop(0.5, colors.light);
            gradient.addColorStop(1, colors.dark);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, boardWidth, boardLength);

            // 板の間のライン
            if (i > 0) {
                ctx.strokeStyle = colors.line;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, boardLength);
                ctx.stroke();
            }
        }

        // 木目風のテクスチャを追加
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < 20; i++) {
            const y = Math.random() * size;
            const w = Math.random() * 30 + 10;
            const h = Math.random() * 5 + 2;
            ctx.fillRect(0, y, size, h);
        }

        // テクスチャを作成
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // テクスチャを4x4回繰り返し
        texture.needsUpdate = true;

        return texture;
    }

    /**
     * フローリングの色を変更する
     * @param {string} color - 'darkbrown', 'white', 'beige'
     */
    setFlooringColor(color) {
        if (!['darkbrown', 'white', 'beige'].includes(color)) return;

        this.flooringColor = color;

        // 既存の床面がある場合、テクスチャを更新
        if (this.floorMesh && this.floorMesh.material) {
            // 古いテクスチャを破棄
            if (this.floorMesh.material.map) {
                this.floorMesh.material.map.dispose();
            }

            // 新しいテクスチャを生成して適用
            const newTexture = this.createFlooringTexture();
            this.floorMesh.material.map = newTexture;
            this.floorMesh.material.needsUpdate = true;
        }

        this.render();
    }

    /**
     * カメラを更新する（ビュータイプと方向に応じて）
     */
    updateCamera() {
        if (!this.camera || !this.room) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const roomWidth = this.room.width / 1000;
        const roomDepth = this.room.depth / 1000;
        const roomHeight = this.room.height / 1000;

        // 部屋の中心
        const centerX = roomWidth / 2;
        const centerY = roomHeight / 2;
        const centerZ = roomDepth / 2;

        // 部屋の最大サイズ
        const maxSize = Math.max(roomWidth, roomDepth, roomHeight);

        // ズーム係数を計算（-1: 1.5倍, 0: 1.0倍（標準・少し拡大）, 1: 0.7倍）
        const zoomFactors = { '-1': 1.8, '0': 1.0, '1': 0.55 };
        const zoomFactor = zoomFactors[this.zoomLevel.toString()] || 1.0;

        switch (this.currentViewType) {
            case 'isometric':
                // 等角投影（見取図）
                this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
                const distance = maxSize * 2.5 * zoomFactor;
                
                // 角度をラジアンに変換
                const angleRad = (this.rotationAngle * Math.PI) / 180;
                
                // 角度に基づいてカメラ位置を計算
                const camX = centerX + Math.sin(angleRad) * distance;
                const camZ = centerZ + Math.cos(angleRad) * distance;
                this.camera.position.set(camX, centerY + distance * 0.5, camZ);
                this.camera.lookAt(centerX, centerY, centerZ);
                break;

            case 'elevation':
                // 立面図（各壁面から見た図）
                const elevationSize = maxSize / zoomFactor;
                this.camera = new THREE.OrthographicCamera(
                    -elevationSize / 2, elevationSize / 2,
                    elevationSize / 2, -elevationSize / 2,
                    1, 10000
                );
                const elevationDistance = maxSize * 3;
                
                // 角度に基づいてカメラ位置を計算
                const elevAngleRad = (this.rotationAngle * Math.PI) / 180;
                const elevCamX = centerX + Math.sin(elevAngleRad) * elevationDistance;
                const elevCamZ = centerZ + Math.cos(elevAngleRad) * elevationDistance;
                this.camera.position.set(elevCamX, centerY, elevCamZ);
                this.camera.lookAt(centerX, centerY, centerZ);
                break;

            case 'plan':
                // 平面図（上面から見た図）
                const planSize = maxSize / zoomFactor;
                this.camera = new THREE.OrthographicCamera(
                    -planSize / 2, planSize / 2,
                    planSize / 2, -planSize / 2,
                    1, 10000
                );
                const planHeight = roomHeight + maxSize * 2;

                // カメラを真上に配置
                this.camera.position.set(centerX, planHeight, centerZ);
                this.camera.lookAt(centerX, 0, centerZ);

                // 角度に基づいてカメラのupベクトルを計算
                // 角度をラジアンに変換
                const planAngleRad = (this.rotationAngle * Math.PI) / 180;
                
                // upベクトルを角度に基づいて計算
                // 0度: (0, 0, 1) - 前方向が上
                // 90度: (-1, 0, 0) - 右方向が上
                // 180度: (0, 0, -1) - 後方向が上
                // 270度: (1, 0, 0) - 左方向が上
                const upX = -Math.sin(planAngleRad);
                const upZ = Math.cos(planAngleRad);
                this.camera.up.set(upX, 0, upZ);
                
                // lookAtを再設定してupベクトルの変更を反映
                this.camera.lookAt(centerX, 0, centerZ);
                break;
        }

        this.camera.updateProjectionMatrix();
    }

    /**
     * ビュータイプを設定する
     * @param {string} viewType - 'isometric', 'elevation', 'plan'
     */
    setViewType(viewType) {
        this.currentViewType = viewType;
        this.updateCamera();
        this.render();
    }

    /**
     * 方向を設定する
     * @param {string} direction - 'front', 'back', 'left', 'right'
     */
    setDirection(direction) {
        this.currentDirection = direction;
        // 方向に応じて角度を設定
        const directionToAngle = {
            'front': 0,
            'right': 90,
            'back': 180,
            'left': 270
        };
        this.rotationAngle = directionToAngle[direction] || 0;
        this.updateCamera();
        this.render();
    }

    /**
     * 右に30度回転する
     */
    rotateRight30() {
        this.rotationAngle = (this.rotationAngle + 30) % 360;
        // 角度に基づいて方向を更新（表示用）
        if (this.rotationAngle < 45 || this.rotationAngle >= 315) {
            this.currentDirection = 'front';
        } else if (this.rotationAngle >= 45 && this.rotationAngle < 135) {
            this.currentDirection = 'right';
        } else if (this.rotationAngle >= 135 && this.rotationAngle < 225) {
            this.currentDirection = 'back';
        } else {
            this.currentDirection = 'left';
        }
        this.updateCamera();
        this.render();
    }

    /**
     * ズームレベルを設定する
     * @param {number} level - -1 (縮小), 0 (標準), 1 (拡大)
     */
    setZoomLevel(level) {
        if (level < -1 || level > 1) return;
        this.zoomLevel = level;
        this.updateCamera();
        this.render();
    }

    /**
     * ズームイン（拡大）
     */
    zoomIn() {
        if (this.zoomLevel < 1) {
            this.setZoomLevel(this.zoomLevel + 1);
        }
    }

    /**
     * ズームアウト（縮小）
     */
    zoomOut() {
        if (this.zoomLevel > -1) {
            this.setZoomLevel(this.zoomLevel - 1);
        }
    }

    /**
     * シーンを再構築する（データ変更時）
     */
    rebuild() {
        this.buildScene();
        this.render();
    }

    /**
     * レンダリングを実行する
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * リサイズ処理
     */
    onResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (width === 0 || height === 0) return;

        // カメラを再設定（リサイズ時にupdateCameraを呼ぶ）
        this.updateCamera();

        this.renderer.setSize(width, height);
        this.render();
    }
}

