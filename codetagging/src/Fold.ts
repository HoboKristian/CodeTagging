'use strict';
import * as vscode from 'vscode';
import TagInfo from './TagInfo';
import Singleton from './Singleton';

let foldedMethods:string[] = [];

namespace Fold {
    async function getMethodsInCurrentFiles() {
        let methods:vscode.SymbolInformation[] = [];
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            await vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeDocumentSymbolProvider', textEditor.document.uri).then((symbols: vscode.SymbolInformation[] | undefined) => {
                if (symbols) {
                    for (let si of symbols) {
                        if (si.kind === vscode.SymbolKind.Method) {
                            methods.push(si);
                        }
                    }
                }
            });
        }
        return methods;
    }

    function methodContainsHighlightedTag(method:vscode.SymbolInformation, hightlightedTagInfo:TagInfo):boolean {
        let methodStart = method.location.range.start.line;
        let methodEnd = method.location.range.end.line;
        for (let tag of Singleton.getTags()) {
            if (tag.tagInfo === hightlightedTagInfo) {
                let tagStart = tag.start.line;
                let tagEnd = tag.end.line;
                if ((tagStart >= methodStart && tagStart <= methodEnd) ||
                (tagEnd >= methodStart && tagEnd <= methodEnd)) {
                    return true;
                }
            }
        }
        return false;
    }

    export async function unfoldFoldedMethods() {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeDocumentSymbolProvider', textEditor.document.uri).then((symbols: vscode.SymbolInformation[] | undefined) => {
                if (symbols) {
                    let lineNumbers:number[] = [];
                    for (let si of symbols) {
                        if (si.kind === vscode.SymbolKind.Method && foldedMethods.includes(si.name)) {
                            lineNumbers.push(si.location.range.start.line);
                        }
                    }
                    vscode.commands.executeCommand('editor.unfold', {levels: 1, direction: 'up', selectionLines: lineNumbers});
                    foldedMethods = [];
                }
            });
        }
    }
    export async function highlightTag(tag:TagInfo) {
        let linesToCollapse: number[] = [];
        for (let method of await getMethodsInCurrentFiles()) {
            if (!methodContainsHighlightedTag(method, tag)) {
                foldedMethods.push(method.name);
                linesToCollapse.push(method.location.range.start.line);
            }
        }
        vscode.commands.executeCommand('editor.fold', {levels: 1, direction: 'up', selectionLines: linesToCollapse});
    }
}

export default Fold;