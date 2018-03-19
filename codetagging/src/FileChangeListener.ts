import * as vscode from 'vscode';

export default class TextDocumentChanged {
    callback: Function;
    disposable: vscode.Disposable;
    constructor(context: vscode.ExtensionContext, callback: Function) {
        this.disposable = vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, context.subscriptions);
        this.callback = callback;
    }
    _onEvent(e: vscode.TextEditor|undefined) {
        this.callback();
    }
    dispose() {
        this.disposable.dispose();
    }
}