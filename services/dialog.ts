export interface DialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'alert' | 'confirm';
}

type DialogCallback = (result: boolean) => void;

class DialogService {
    private listeners: ((options: DialogOptions, callback: DialogCallback) => void)[] = [];

    subscribe(listener: (options: DialogOptions, callback: DialogCallback) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private show(options: DialogOptions): Promise<boolean> {
        return new Promise(resolve => {
            if (this.listeners.length === 0) {
                // Fallback to native if UI is not mounted yet
                if (options.type === 'confirm') {
                    resolve(window.confirm(options.message));
                } else {
                    window.alert(options.message);
                    resolve(true);
                }
                return;
            }

            this.listeners.forEach(listener => listener(options, resolve));
        });
    }

    alert(message: string, title?: string): Promise<void> {
        return this.show({ type: 'alert', message, title, confirmText: '确定' }).then(() => { });
    }

    confirm(message: string, title?: string): Promise<boolean> {
        return this.show({ type: 'confirm', message, title, confirmText: '确定', cancelText: '取消' });
    }
}

export const dialog = new DialogService();
