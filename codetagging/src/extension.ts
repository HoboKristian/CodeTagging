'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';
import Fold from './Fold';
import * as Hiding from './Hiding';
import { GenerateSerialization } from './generateSerialization';
import { LoadSerialization } from "./loadSerialization";

const fs = require('fs');
const path = require('path');

let hightlightedTagInfo:TagInfo|undefined;

function tagSelection(tagIndex: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        let tags: Tag[] = Singleton.getTags();
        let tagInfos: TagInfo[] = Singleton.getTagInfos();
        for (let selection of textEditor.selections) {
            let tag = new Tag(tagInfos[tagIndex], textEditor.document.fileName, selection.start.line + 1, selection.end.line);
            if (selection.start.line === selection.end.line || selection.end.character > 0) {
                tag = new Tag(tagInfos[tagIndex], textEditor.document.fileName, selection.start.line + 1, selection.end.line + 1);
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
        Singleton.getTags()
        .filter(tag => tag.file === editor.document.fileName)
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
            const pruneTagPathForFolder = (folder:string) => Singleton.getTags()
            .filter(tag => tag.tagInfo === tagInfo)
            .map(tag => tag.file)
            .map(e => e.replace(folder, ''));

            return ws
            .map(workspace => workspace.uri.fsPath)
            .map(folder => walkSync(folder)
                        .map(e => e.replace(folder, ''))
                        .filter(f => !pruneTagPathForFolder(folder).includes(f)))
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

    // uri object that represents the current workspace path
    let uriString = vscode.workspace.rootPath;
    console.log(uriString);

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

        let myLoader = new LoadSerialization(vscode.workspace.rootPath);

        let loadFromFile = vscode.commands.registerCommand('extension.load', () => {
            //call the serialize method passing it the json of serialized tag objects to write to file
            myLoader.readFile();
            redraw();
        });
        context.subscriptions.push(loadFromFile);

    }

    let tagMenu = vscode.commands.registerCommand('extension.tagMenu', () => {
        // "Tag selection"
        // key: ctrl/cmd + shift + T
        // Command for tagging the currently selected code
        let existingTags = ["tag1", "tag2", "tag3", "tag4", "testTag1", "testTag2", "testTag3"]; // TODO this should be changed to generate the array from the current list of tag objects
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
                            vscode.window.showErrorMessage('No tag name was entered, code was not tagged');
                        } else if (existingTags.includes(value)) {
                            vscode.window.showErrorMessage('Tag already exists, code was not tagged');
                        } else {
                            // TODO actually create tag and add code selection to the new tag
                            vscode.window.showInformationMessage('Tag created, code was tagged with \"' + value + '\"');
                        }
                    });
                } else if (existingTags.includes(input)) {
                    // TODO actually add current code selection to the chosen tag
                    vscode.window.showInformationMessage('Code was tagged with \"' + input + '\"');
                } else {
                    // shouldn't reach this point
                    vscode.window.showErrorMessage('Code was not tagged');
                }
            } else {
                vscode.window.showErrorMessage('No tag was selected, code was not tagged');
            }
        });
    });
    let tagIsolated = false;
    let tagIsolate = vscode.commands.registerCommand('extension.tagIsolate', () => {
        // "Isolate tag"
        // key: ctrl/cmd + shift + R
        // Command for isolating a specified tag
        let existingTags = ["tag1", "tag2", "tag3", "tag4", "testTag1", "testTag2", "testTag3"]; // TODO this should be changed to generate the array from the current list of tag objects

        if (tagIsolated) {
            // TODO turn off all isolation
            vscode.window.showInformationMessage('Isolation deactivated');
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
                        vscode.window.showInformationMessage('\"' + input + '\" tag is isolated');
                    } else {
                        // shouldn't reach this point
                        vscode.window.showErrorMessage('No tag was isolated');
                    }
                } else {
                    vscode.window.showErrorMessage('No tag was isolated');
                }
            });
        }
    });
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
                    if (hoveredLine >= tag.start && hoveredLine <= tag.end) {
                        hightlightedTagInfo = tag.tagInfo;
                        console.log("highlight");
                    }
                }
            }

            if (hightlightedTagInfo === undefined) {
                Fold.unfoldFoldedMethods();
                Hiding.unhideFiles();
                console.log("unhide");
            } else {
                let allFiles = filesThatDoNotContainTagInfo(hightlightedTagInfo);
                if (allFiles) {
                    Hiding.hideFiles(allFiles);
                }
                Fold.highlightTag(hightlightedTagInfo);
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
    context.subscriptions.push(tagMenu);
    context.subscriptions.push(tagIsolate);
}


// this method is called when your extension is deactivated
export function deactivate() {
}