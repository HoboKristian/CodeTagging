'use strict';
import * as vscode from 'vscode';
import TagInfo from './TagInfo';
import Tag from './Tag';
import Singleton from './Singleton';

let foldedMethods:string[] = [];

namespace Fold {
    async function getMethodsInCurrentFiles() {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            let symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeDocumentSymbolProvider', textEditor.document.uri);
            if (symbols) {
                return symbols.filter(element => element.kind === vscode.SymbolKind.Method || element.kind === vscode.SymbolKind.Function);
            }
        }
        return [];
    }

    function methodContainsHighlightedTags(method:vscode.SymbolInformation, highlightedTags:Tag[]):boolean {
        const lineInMethod = (line:number, method:vscode.SymbolInformation) => {
            let methodStart = method.location.range.start.line;
            let methodEnd = method.location.range.end.line;
            return (line >= methodStart && line <= methodEnd);
        }
        
        return highlightedTags.some(tag => (lineInMethod(tag.start, method) || lineInMethod(tag.end, method)));
    }

    export async function unfoldFoldedMethods() {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            let symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>('vscode.executeDocumentSymbolProvider', textEditor.document.uri);
            if (symbols) {
                let lineNumbers:number[] = symbols
                .filter(si => (si.kind === vscode.SymbolKind.Method || si.kind === vscode.SymbolKind.Function))
                .filter(si => (foldedMethods.includes(si.name)))
                .map(si => si.location.range.start.line);
                vscode.commands.executeCommand('editor.unfold', {levels: 1, direction: 'up', selectionLines: lineNumbers});
                foldedMethods = [];
            }
        }
    }
    export async function highlightTag(highlightedTagInfo:TagInfo) {
        let linesToCollapse: number[] = [];
        let highlightedTags = Singleton.getTags().filter(e => e.tagInfo === highlightedTagInfo);
        (await getMethodsInCurrentFiles())
        .filter(method => !methodContainsHighlightedTags(method, highlightedTags))
        .forEach(method => {
            foldedMethods.push(method.name);
            linesToCollapse.push(method.location.range.start.line);
        });
        console.log(foldedMethods, linesToCollapse);
        vscode.commands.executeCommand('editor.fold', {levels: 1, direction: 'up', selectionLines: linesToCollapse});
    }
}

export default Fold;