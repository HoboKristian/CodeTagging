'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';
import TextDocumentChanged from './FileChangeListener';
import { TextDocumentContentProvider } from './tagVisualizationProvider';
import TagMenu from './TagMenu';

let codeChangeListener:CodeChangeListener;
let textDocumentChanged:TextDocumentChanged;
let tagMenu:TagMenu;

function relativeFilePathForDocument(document:vscode.TextDocument):string {
    let ws = vscode.workspace.getWorkspaceFolder(document.uri);
    let fileName = document.fileName;
    return (ws) ? fileName.replace(ws.uri.fsPath, '') : fileName;
}

function tagSelection(tagInfo: TagInfo) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    for (let selection of textEditor.selections) {
        let from = selection.start.line + 1;
        let to = selection.end.line;
        if (selection.start.line === selection.end.line || selection.end.character > 0) {
            to = selection.end.line + 1;
        }
        tagLines(tagInfo, from ,to);
    }
}
function tagLines(tagInfo:TagInfo, from: number, to: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    let tags: Tag[] = Singleton.getTags();
    let fileName = relativeFilePathForDocument(textEditor.document);
    let tag = new Tag(tagInfo, fileName, from, to);

    let overlappingTag;
    for (let oldTag of tags) {
        if (oldTag.overlaps(tag)) {
            overlappingTag = oldTag;
        }
    }
    if (overlappingTag !== undefined) {
        overlappingTag.start = Math.min(tag.start, overlappingTag.start);
        overlappingTag.end = Math.max(tag.end, overlappingTag.end);
    } else {
        Singleton.addTag(tag);
    }
    redraw();
}

let activeDecorations: vscode.TextEditorDecorationType[] = [];

async function redraw() {
    activeDecorations.forEach(dec => dec.dispose());
    activeDecorations = [];

    for (let textEditor of vscode.window.visibleTextEditors) {
        let fileName = relativeFilePathForDocument(textEditor.document);
        let tags = Singleton.getTags()
        .filter(tag => tag.file === fileName);
        tags.forEach(tag => {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig(tagMenu.hightlightedTagInfo));
            //console.log(tag.tagInfo.getDecorationConfig(tagMenu.hightlightedTagInfo));
            textEditor.setDecorations(co, [new vscode.Range(new vscode.Position(tag.start - 1, 0), new vscode.Position(tag.end - 1, 0))]);
            activeDecorations.push(co);
        });
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');
    codeChangeListener = new CodeChangeListener(context, redraw);
    textDocumentChanged = new TextDocumentChanged(context, redraw);
    tagMenu = new TagMenu(redraw, tagSelection);

    //section for setting up the html preview
    //this is the uri for our visualization that will be generated (its a virtual document no actual html file will exist)
    let previewUri = vscode.Uri.parse('tag-preview://authority/tag-preview');

    //create a new instance  of our TextDocumentContentProvider that returns  
    let provider = new TextDocumentContentProvider();
    //register a provider giving our provider class and a name 
    let registration = vscode.workspace.registerTextDocumentContentProvider('tag-preview', provider);
    //whenever a new tab(editor) is swtiched to update the 
    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor|undefined) => {
		//if (e.document === vscode.window.activeTextEditor.document) {
			provider.update(previewUri);
		//}
	});
    
    //create our disposable//change the 2 column thing here
    let htmlPreviewDisposable = vscode.commands.registerCommand('extension.showTagPreview', () => {
		return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Tag Visualization').then((success) => {
		}, (reason) => {
			vscode.window.showErrorMessage(reason);
		});
    });
    
    //when a user clicks a file link in the visulizatoin open the file in a new tab in the editor
    vscode.commands.registerCommand('extension.revealTaggedFile', (passedTag) => {
        revealTag(passedTag);
    });
    
    //when a user clicks a tag type link in the html preview have it filter the ui 
    vscode.commands.registerCommand('extension.modifyUiForTag', (tagInfoName: string) => {
        console.log("run given command for: " + tagInfoName);
        tagMenu.isolateTagInfoName(tagInfoName, true);
    });

    //end section

    // for html preview
    context.subscriptions.push(htmlPreviewDisposable, registration);

    context.subscriptions.push(vscode.commands.registerCommand('extension.tagMenu', () => tagMenu.showTagMenu()));
    context.subscriptions.push(vscode.commands.registerCommand('extension.tagIsolate', () => tagMenu.showIsolateMenu()));

    Singleton.load();
    redraw();
}

async function revealTag(passedTag:any) {
    let fileName:string = passedTag.fileName;
    let tagStart:number = passedTag.tagStart;
    let tagEnd:number = passedTag.tagEnd;
    //get workspace url
    let  workspacePath = vscode.workspace.rootPath;
    //create uri object for a local file
    let path = vscode.Uri.file(workspacePath + fileName);

    let document = await vscode.workspace.openTextDocument(path);
    let textEditor = await vscode.window.showTextDocument(document);

    if (textEditor) {
        textEditor.revealRange(new vscode.Range(tagStart, 0, tagEnd, 0), vscode.TextEditorRevealType.InCenter);
    }
    return;
}

// this method is called when your extension is deactivated
export function deactivate() {
    codeChangeListener.dispose();
    textDocumentChanged.dispose();
}
