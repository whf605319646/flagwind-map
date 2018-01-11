/// <reference path="../base/flagwind.layer.ts" />
namespace flagwind {

    export class EsriEditLayer extends FlagwindFeatureLayer implements IEditLayer {

        public editObj: any;
        public options: any;
        public deviceLayer: DeviceLayer;
        public flagwindMap: FlagwindMap;
        public mapService: IMapService;

        public constructor(
            flagwindMap: FlagwindMap,
            deviceLayer: DeviceLayer,
            options: any) {
            options = { ...editLayerOptions, ...options };
            super(flagwindMap.mapService, "edit_" + deviceLayer.id, "编辑图层");
            this.flagwindMap = flagwindMap;
            this.mapService = flagwindMap.mapService;
            this.deviceLayer = deviceLayer;
            this.options = options;

            this.editObj = new esri.toolbars.Edit(this.flagwindMap.innerMap); // 编辑对象,在编辑图层进行操作
            this.flagwindMap.addDeviceLayer(this);
            if (this.flagwindMap.innerMap.loaded) {
                this.onLoad();
            } else {
                const me = this;
                this.flagwindMap.innerMap.on("load", function () {
                    me.onLoad();
                });
            }
        }

        /**
         * 激活编辑事件
         * @param key 要编辑要素的id
         */
        public activateEdit(key: string): void {

            let graphic = this.deviceLayer.getGraphicById(key);
            if (!graphic) {
                console.log("无效的代码：" + key);
                return;
            }
            this.deviceLayer.hide();
            this.show();
            let editGraphic = this.deviceLayer.creatGraphicByDevice(graphic.attributes);
            this.layer.add(editGraphic);
            editGraphic.attributes.eventName = "start";
            let tool = esri.toolbars.Edit.MOVE;
            // map.disableDoubleClickZoom();//禁掉鼠标双击事件
            this.editObj.activate(tool, editGraphic, null); // 激活编辑工具
            this.deviceLayer.showInfoWindow({
                graphic: graphic
            });
        }

        /**
         * 取消编辑要素
         */
        public cancelEdit(key: string) {
            this.editObj.deactivate();
            this.clear();
            this.hide();
            this.flagwindMap.innerMap.infoWindow.hide();
            this.deviceLayer.show();

            let graphic = this.deviceLayer.getGraphicById(key);
            graphic.attributes.eventName = "delete";
            this.deviceLayer.showInfoWindow({
                graphic: graphic
            });
        }

        public bindModifyEvent(modifySeletor: string): void {
            const me = this;
            dojo.connect(dojo.byId(modifySeletor), "onclick", function (evt: any) {
                const key = evt.target.attributes["key"].value;
                me.activateEdit(key);
            });
        }

        public bindDeleteEvent(deleteSeletor: string): void {
            const _editLayer = this;
            dojo.connect(dojo.byId(deleteSeletor), "onclick", function (evt: any) {
                const key = evt.target.attributes["key"].value;
                _editLayer.cancelEdit(key);
            });
        }

        public onLoad() {
            if (!this.layer._map) {
                this.layer._map = this.flagwindMap.innerMap;
            }
            try {
                this.registerEvent();
            } catch (error) {
                console.error(error);
            }
        }

        public get map(): any {
            return this.flagwindMap.map;
        }

        public get spatial(): any {
            return this.flagwindMap.spatial;
        }

        public onChanged(options: any, isSave: boolean): Promise<boolean> {
            return this.options.onEditInfo(options, isSave);
        }

        protected registerEvent(): void {
            let _editLayer = this;
            dojo.connect(this.layer, "onClick", function (evt: any) {
                _editLayer.onLayerClick(_editLayer, evt);
            });

            let originInfo: any = {}; // 存放资源的初始值		
            console.log("编辑对象：" + this.editObj);
            dojo.on(this.editObj, "graphic-first-move", function (ev: any) {
                console.log("要素移动---------graphic-first-move");
                _editLayer.flagwindMap.innerMap.infoWindow.hide();
                originInfo = ev.graphic.attributes;
            });
            dojo.on(this.editObj, "graphic-move-stop", function (ev: any) { // 这里要更新一下属性值	
                console.log("要素移动---------graphic-move-stop");
                _editLayer.editObj.deactivate();
                let key = ev.graphic.attributes.id;

                (<any>window).$Modal.confirm({
                    title: "确定要进行更改吗？",
                    content: "初始坐标值（经度）:" + originInfo.longitude +
                        ",（纬度）:" + originInfo.latitude +
                        "\r当前坐标值（经度）:" + ev.graphic.geometry.x.toFixed(8) +
                        ",（纬度）:" + ev.graphic.geometry.y.toFixed(8),
                    onOk: () => {
                        let pt = ev.graphic.geometry;
                        let lonlat = _editLayer.deviceLayer.formPoint(pt);
                        let changeInfo = { ...ev.graphic.attributes, ...lonlat };

                        // 异步更新，请求成功才更新位置，否则不处理，
                        _editLayer.onChanged({
                            id: key,
                            latitude: changeInfo.latitude,
                            longitude: changeInfo.longitude
                        }, true).then(success => {
                            if (success) {
                                _editLayer.deviceLayer.removeGraphicById(changeInfo.id);
                                _editLayer.deviceLayer.addGraphicByDevice(changeInfo);
                            }
                        });
                    },
                    onCancel: () => {
                        _editLayer.onChanged({
                            id: key,
                            latitude: originInfo.latitude,
                            longitude: originInfo.longitude
                        }, false);
                    }
                });
                ev.graphic.attributes.eventName = "stop";
                _editLayer.clear();
                _editLayer.hide();
                _editLayer.flagwindMap.innerMap.infoWindow.hide();
                _editLayer.deviceLayer.show();
            });
        }

        protected onLayerClick(editLayer: this, evt: any) {

            if (editLayer.deviceLayer.options.onLayerClick) {
                editLayer.deviceLayer.options.onLayerClick(evt);
            }

            if (editLayer.deviceLayer.options.showInfoWindow) {
                editLayer.deviceLayer.showInfoWindow(evt);
            }
        }
    }
}