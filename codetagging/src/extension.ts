'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';
import Color from './Color';
import Fold from './Fold';
import * as Hiding from './Hiding';
import { GenerateSerialization } from './generateSerialization';
import { LoadSerialization } from "./loadSerialization";
import TextDocumentChanged from './FileChangeListener';

const fs = require('fs');
const path = require('path');

let codeChangeListener:CodeChangeListener;
let textDocumentChanged:TextDocumentChanged;
let hightlightedTagInfo:TagInfo|undefined;

function relativeFilePathForDocument(document:vscode.TextDocument):string {
    let ws = vscode.workspace.getWorkspaceFolder(document.uri);
    let fileName = document.fileName;
    return (ws) ? fileName.replace(ws.uri.fsPath, '') : fileName;
}

function tagIndex(tagIndex: number) {
    tagSelection(Singleton.getTagInfos()[tagIndex]);
}

function tagSelection(tagInfo: TagInfo) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    let tags: Tag[] = Singleton.getTags();
    let fileName = relativeFilePathForDocument(textEditor.document);
    for (let selection of textEditor.selections) {
        let tag = new Tag(tagInfo, fileName, selection.start.line + 1, selection.end.line);
        if (selection.start.line === selection.end.line || selection.end.character > 0) {
            tag = new Tag(tagInfo, fileName, selection.start.line + 1, selection.end.line + 1);
        }
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
    }
    redraw();
}

let activeDecorations: vscode.TextEditorDecorationType[] = [];

function redraw() {
    activeDecorations.forEach(dec => dec.dispose());
    activeDecorations = [];

    let textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
        let editor = textEditor; // For some reason not doing this gives might be undefined error
        let fileName = relativeFilePathForDocument(textEditor.document);
        Singleton.getTags()
        .filter(tag => tag.file === fileName)
        .forEach(tag => {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig(hightlightedTagInfo));
            editor.setDecorations(co, [new vscode.Range(new vscode.Position(tag.start - 1, 0), new vscode.Position(tag.end - 1, 0))]);
            activeDecorations.push(co);
        });
    }
}

function walkSync(dir:string):string[] {
    if (!fs.lstatSync(dir).isDirectory()) {
        return [dir];
    }
    
    return (<string[]>fs.readdirSync(dir))
    .map(f => walkSync(path.join(dir, f)))
    .reduce((a, b) => a.concat(b), []);
}

function filesThatDoNotContainTagInfo(tagInfo:TagInfo):string[]|undefined {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
        let ws = vscode.workspace.workspaceFolders;
        if (ws) {
            const tagPaths = Singleton.getTags()
            .filter(tag => tag.tagInfo === tagInfo)
            .map(tag => tag.file);

            console.log(tagPaths);

            return ws
            .map(workspace => workspace.uri.fsPath)
            .map(folder => walkSync(folder)
                        .map(e => e.replace(folder, ''))
                        .filter(f => !tagPaths.includes(f)))
            .reduce((a, b) => a.concat(b), []);
        }
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');

    setupSerializingActions(context);
    createTagMenu(context);

    let disposable = vscode.commands.registerCommand('extension.tag1', () => {
        tagIndex(0);
    });
    let disposable2 = vscode.commands.registerCommand('extension.tag2', () => {
        tagIndex(1);
    });
    let disposable3 = vscode.commands.registerCommand('extension.tag3', () => {
        tagIndex(2);
    });

    /*vscode.languages.registerHoverProvider('javascript', {
        provideHover(document, position, token) {
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor === undefined) {
                return new vscode.Hover('');
            }

            let fileName = relativeFilePathForDocument(textEditor.document);
            let highlightedTag = Singleton.getTags()
            .filter(tag => tag.file === fileName)
            .find(tag => (position.line >= tag.start && position.line <= tag.end));

            hightlightedTagInfo = undefined;
            if (highlightedTag) {
                hightlightedTagInfo = highlightedTag.tagInfo;
            }
            
            if (hightlightedTagInfo) {
                let allFiles = filesThatDoNotContainTagInfo(hightlightedTagInfo);
                if (allFiles) {
                    Hiding.hideFiles(allFiles);
                }
                Fold.highlightTag(hightlightedTagInfo);
            } else {
                Fold.unfoldFoldedMethods();
                Hiding.unhideFiles();
                console.log("unhide");
            }

            redraw();
            return new vscode.Hover('');
        }
    });*/
    codeChangeListener = new CodeChangeListener(context, redraw);
    textDocumentChanged = new TextDocumentChanged(context, redraw);

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}

//instantiate our class that serializes objects
//we pass it the location of the where we want to save the file
//this is showing as an error but it works, something about string | undefined cant be assigned to string
function setupSerializingActions(context:vscode.ExtensionContext) {
    if (vscode.workspace.rootPath) {
        let mySerializer = new GenerateSerialization(vscode.Uri.parse(vscode.workspace.rootPath));
        //command to save taging to disk
        let saveToDisk = vscode.commands.registerCommand('extension.serialize', () => {
            //call the serialize method passing it the json of serialized tag objects to write to file
            mySerializer.serialize();
        });
        context.subscriptions.push(saveToDisk);

        let myLoader = new LoadSerialization(vscode.workspace.rootPath);

        let loadFromFile = vscode.commands.registerCommand('extension.load', () => {
            //call the serialize method passing it the json of serialized tag objects to write to file
            myLoader.readFile();
            redraw();
        });
        context.subscriptions.push(loadFromFile);
    }
}

// The command has been defined in the package.json file
// Now provide the implementation of the command with  registerCommand
// The commandId parameter must match the command field in package.json
function createTagMenu(context:vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.tagMenu', () => {
        // "Tag selection"
        // key: ctrl/cmd + shift + T
        // Command for tagging the currently selected code
        let existingTags = Singleton.getTagInfos().map(tagInfo => tagInfo.name);
        existingTags.unshift("Create New Tag"); // add option to create a new tag to array

        // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
        vscode.window.showQuickPick(existingTags).then(input => {
            // executes when user presses Enter or selects a suggested tag name
            // if 'Create New Tag' is selected or entered, open InputBox to enter new tag name
            // if no tag name is entered or the tag name is not an existing tag, code is not tagged
            // if an existing tag is entered or selected, add the current code selection to that tag
            if (typeof input !== 'undefined') {
                if (input === 'Create New Tag') {
                    // open InputBox to create a new tag
                    vscode.window.showInputBox({prompt: 'Enter new tag name'}).then(value => {
                        // executes when user presses Enter
                        // if no tag name is entered, no tag is created
                        // if the entered tag name already exists, no tag is created
                        // otherwise, create new tag and add the selected code to the new tag
                        if (!value) {
                            //vscode.window.showErrorMessage('No tag name was entered, code was not tagged');
                        } else if (existingTags.includes(value)) {
                            //vscode.window.showErrorMessage('Tag already exists, code was not tagged');
                        } else {
                            // new taginfo.name = input
                            // TODO actually create taginfo and add code selection to the new tag
                            let newTagInfo = new TagInfo(new Color(2), input);
                            Singleton.getTagInfos().push(newTagInfo);
                            if (newTagInfo) {
                                tagSelection(newTagInfo);
                            }
                            redraw();
                            //vscode.window.showInformationMessage('Tag created, code was tagged with \"' + value + '\"');
                        }
                    });
                } else if (existingTags.includes(input)) {
                    let tagInfo = Singleton.getTagInfos().find(tagInfo => tagInfo.name === input);
                    if (tagInfo) {
                        tagSelection(tagInfo);
                    }
                    redraw();
                    //vscode.window.showInformationMessage('Code was tagged with \"' + input + '\"');
                } else {
                    // shouldn't reach this point
                    //vscode.window.showErrorMessage('Code was not tagged');
                }
            } else {
                //vscode.window.showErrorMessage('No tag was selected, code was not tagged');
            }
        });
    }));
    let tagIsolated = false;
    context.subscriptions.push(vscode.commands.registerCommand('extension.tagIsolate', () => {
        // "Isolate tag"
        // key: ctrl/cmd + shift + R
        // Command for isolating a specified tag
        let existingTags = Singleton.getTagInfos().map(tagInfo => tagInfo.name);

        if (tagIsolated) {
            hightlightedTagInfo = undefined;
            tagIsolated = !tagIsolated;
            Hiding.unhideFiles();
            Fold.unfoldFoldedMethods();
            redraw();
            //vscode.window.showInformationMessage('Isolation deactivated');
        } else {
            // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
            vscode.window.showQuickPick(existingTags).then(input => {
                // executes when user presses Enter or selects a suggested tag name
                // if no tag name is entered or the tag name is not an existing tag, no tag is isolated
                // if an existing tag is entered or selected, isolate that tag
                if (typeof input !== 'undefined') {
                    if (existingTags.includes(input)) {
                        // TODO actually isolate the selected tag
                        tagIsolated = !tagIsolated;
                        hightlightedTagInfo = Singleton.getTagInfos().find(tagInfo => tagInfo.name === input);
                        if (hightlightedTagInfo) {
                            let allFiles = filesThatDoNotContainTagInfo(hightlightedTagInfo);
                            if (allFiles) {
                                Hiding.hideFiles(allFiles);
                            }
                            Fold.highlightTag(hightlightedTagInfo);
                        }
                        redraw();
                        //vscode.window.showInformationMessage('\"' + input + '\" tag is isolated');
                    } else {
                        // shouldn't reach this point
                        //vscode.window.showErrorMessage('No tag was isolated');
                    }
                } else {
                    //vscode.window.showErrorMessage('No tag was isolated');
                }
            });
        }
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
    codeChangeListener.dispose();
    textDocumentChanged.dispose();
}
