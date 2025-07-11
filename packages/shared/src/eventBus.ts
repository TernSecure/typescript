export class EventEmitter {
    private listeners: { [eventName: string]: Array<(...args: any[]) => void> } = {};

    on(eventName: string, listener: (...args: any[]) => void): () => void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(listener);
        return () => {
            this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
        };
    }

    emit(eventName: string, ...args: any[]): void {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(listener => listener(...args));
        }
    }

    off(eventName: string, listener: (...args: any[]) => void): void {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
        }
    }

    getListeners(eventName: string): Array<(...args: any[]) => void> {
        return this.listeners[eventName] ? [...this.listeners[eventName]] : [];
    }
}