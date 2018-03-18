'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';
import { GenerateSerialization } from './generateSerialization';



let hightlightedTagInfo:TagInfo|undefined;
let foldedMethods:string[] = [];

function tagSelection(tagIndex: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        let tags: Tag[] = Singleton.getTags();
        let tagInfos: TagInfo[] = Singleton.getTagInfos();
        for (let selection of textEditor.selections) {
            let tag = new Tag(tagInfos[tagIndex], textEditor.document.fileName, selection.start, selection.end);
            let overlappingTag;
            for (let oldTag of tags) {
                if (oldTag.overlaps(tag)) {
                    overlappingTag = oldTag;
                }
            }
            if (overlappingTag !== undefined) {
                overlappingTag.start = new vscode.Position(Math.min(selection.start.line, overlappingTag.start.line), 0);
                overlappingTag.start = new vscode.Position(Math.max(selection.end.line, overlappingTag.end.line), 0);
            } else {
                Singleton.addTag(tag);
            }
        }
    }
    redraw();
}

let activeDecorations: vscode.TextEditorDecorationType[] = [];

function redraw() {
    for (let dec of activeDecorations) {
        if (dec) {
            dec.dispose();
        }
    }
    activeDecorations = [];

    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        for (let tag of Singleton.getTags()) {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig(hightlightedTagInfo));
            textEditor.setDecorations(co, [new vscode.Range(tag.start, tag.end)]);
            activeDecorations.push(co);
        }
    }
}

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

function methodContainsHighlightedTag(method:vscode.SymbolInformation):boolean {
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

async function unfoldFoldedMethods() {
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
async function highlightTag() {
    let linesToCollapse: number[] = [];
    for (let method of await getMethodsInCurrentFiles()) {
        if (!methodContainsHighlightedTag(method)) {
            foldedMethods.push(method.name);
            linesToCollapse.push(method.location.range.start.line);
        }
    }
    vscode.commands.executeCommand('editor.fold', {levels: 1, direction: 'up', selectionLines: linesToCollapse});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');

    //instantiate our class that serializes objects
    //we pass it the location of the where we want to save the file
    //this is showing as an error but it works, something about string | undefined cant be assigned to string
    if (vscode.workspace.rootPath) {
        let mySerializer = new GenerateSerialization(vscode.Uri.parse(vscode.workspace.rootPath));
        //command to save taging to disk
        let saveToDisk = vscode.commands.registerCommand('extension.serialize', () => {
            //call the serialize method passing it the json of serialized tag objects to write to file
            mySerializer.serialize();
        });
        context.subscriptions.push(saveToDisk);
    }
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.tag1', () => {
        tagSelection(0);
    });
    let disposable2 = vscode.commands.registerCommand('extension.tag2', () => {
        tagSelection(1);
    });
    let disposable3 = vscode.commands.registerCommand('extension.tag3', () => {
        tagSelection(2);
    });

    vscode.languages.registerHoverProvider('javascript', {
        provideHover(document, position, token) {
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor !== undefined) {
                let hoveredLine = position.line;
                hightlightedTagInfo = undefined;
                for (let tag of Singleton.getTags()) {
                    if (hoveredLine >= tag.start.line && hoveredLine <= tag.end.line) {
                        hightlightedTagInfo = tag.tagInfo;
                        console.log("highlight");
                    }
                }
            }

            if (hightlightedTagInfo === undefined) {
                unfoldFoldedMethods();
            } else {
                highlightTag();
            }

            console.log("redraw");
            redraw();
            return new vscode.Hover('');
        }
    });
    let codeChangeListener = new CodeChangeListener(context, redraw);

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}


// this method is called when your extension is deactivated
export function deactivate() {
}