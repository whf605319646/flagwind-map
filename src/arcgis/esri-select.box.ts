/// <reference path="../events/EventProvider" />
namespace flagwind {

    export const SELECT_BOX_OPTIONS_ESRI: any = {

        onCheckChanged: function (evt: any) {
            console.log("onCheckChanged");
        }
    };
    /**
     * 线
     */
    export class EsriSelectBox extends EventProvider {

        private draw: any;

        public mode: string;

        public layers: Array<FlagwindBusinessLayer> = [];

        public constructor(public flagwindMap: FlagwindMap, public options: any) {
            super(null);
            options = { ...SELECT_BOX_OPTIONS_ESRI, ...options };
            this.options = options;
            this.draw = new esri.toolbars.Draw(flagwindMap.map, {
                drawTime: 75,
                showTooltips: true,
                tolerance: 8,
                tooltipOffset: 15
            });
            const me = this;
            this.draw.on("draw-complete", function (evt: any) {
                me.onCreateRecord(me, evt);
            });

        }

        public onCreateRecord(me: this, e: any): void {
            let polygon = e.geometry;

            me.layers.forEach(layer => {
                let checkGrahpics: Array<any> = [];
                layer.graphics.forEach(g => {
                    if (polygon.contains(g.geometry)) {
                        console.log(g);
                        checkGrahpics.push(g);
                    }
                });
                let checkItems = checkGrahpics.map(g => g.attributes);
                layer.setSelectStatusByModels(checkItems, false);
            });

            me.clear();

        }

        public addLayer(layer: FlagwindBusinessLayer): void {
            layer.options.enableSelectMode = true;
            this.layers.push(layer);
        }

        public deleteSelectBar(): void {
            let ele = document.getElementById("edit-ctrl-group");
            if(ele) ele.remove();
        }

        public showSelectBar(mapId: string): void {
            let me = this;
            let mapEle = document.getElementById(mapId);
            let container = document.createElement("div");
            container.setAttribute("id", "edit-ctrl-group");
            container.innerHTML = `<div class="edit-btn" title="画圆" data-operate="circle"><span class="iconfont icon-draw-circle"></span></div>
                <div class="edit-btn" title="画矩形" data-operate="rectangle"><span class="iconfont icon-draw-square"></span></div>
                <div class="edit-btn" title="画多边形" data-operate="polygon"><span class="iconfont icon-draw-polygon1"></span></div>`;
                // <div class="edit-btn" title="撤销上一步操作" data-operate="undo"><span class="iconfont icon-undo"></span></div>
                // <div class="edit-btn" title="重复上一步操作" data-operate="redo"><span class="iconfont icon-redo"></span></div>
                // <div class="edit-btn" title="删除所选" data-operate="trash"><span class="iconfont icon-tool-trash"></span></div>`;
            mapEle.appendChild(container);
            let operateBtns = document.querySelectorAll(`#${mapId} .edit-btn`) as NodeListOf<HTMLElement>;
            for (let i = 0; i < operateBtns.length; i++) {
                operateBtns[i].onclick = function () {
                    me.active(this.dataset.operate);
                };
            }
        }

        public clear() {
            if (this.draw) {
                this.draw.deactivate();
                this.flagwindMap.map.enableMapNavigation();
                this.mode = "trash";
            }
        }

        public active(mode: string) {
            if (this.draw && mode) {
                let tool = mode.toUpperCase().replace(/ /g, "_");
                this.flagwindMap.map.disableMapNavigation();
                this.draw.activate(esri.toolbars.Draw[tool]);
                this.mode = mode;
            }
        }
    }

}