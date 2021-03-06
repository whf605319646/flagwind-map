namespace flagwind {

    export class MinemapGroupLayer extends FlagwindGroupLayer {
        public addListener(type: string, listener: Function, scope?: any, once?: boolean): void {
            this.layer.addListener(type, listener, scope, once);
        }
        public removeListener(type: string, listener: Function, scope?: any): void {
            this.layer.removeListener(type, listener, scope);
        }
        public hasListener(type: string): boolean {
            return this.layer.hasListener(type);
        }
        public dispatchEvent(type: string, data?: any): void;
        public dispatchEvent(args: EventArgs): void;
        public dispatchEvent(type: any, data?: any) {
            return this.layer.dispatchEvent(type, data);
        }

        public onCreateGraphicsLayer(options: any) {
            return new MinemapGraphicsLayer(options);
        }

    }
}
