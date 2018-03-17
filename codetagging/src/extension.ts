'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';


let tagInfos: TagInfo[] = [new TagInfo(new Color(0), "DB"), new TagInfo(new Color(1), "API"), new TagInfo(new Color(2), "BUG")];
let tags: Tag[] = [];

function tagSelection(tagIndex: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        let tagsToRemove: Tag[] = [];
        for (let selection of textEditor.selections) {
            let tag = new Tag(tagInfos[tagIndex], textEditor.document.fileName, selection.start, selection.end);
            let overlappingTag;
            for (let oldTag of tags) {
                if (oldTag.overlaps(tag)) {
                    overlappingTag = oldTag;
                }
            }
            if (overlappingTag !== undefined) {
                tag = new Tag(tagInfos[tagIndex],
                    textEditor.document.fileName,
                    new vscode.Position(Math.min(selection.start.line, overlappingTag.start.line), 0),
                    new vscode.Position(Math.max(selection.end.line, overlappingTag.end.line), 0)
                );
                tagsToRemove.push(overlappingTag);
                console.log("OVERLAPPING");
            }
            tags.push(tag);
        }
        for (let tag of tagsToRemove) {
            tags.splice(tags.indexOf(tag), 1);
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
        console.log("DRAWING:", tags.length);
        for (let tag of tags) {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig());
            textEditor.setDecorations(co, [new vscode.Range(tag.start, tag.end)]);
            activeDecorations.push(co);
        }
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');

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
    let disposable4 = vscode.commands.registerCommand('extension.hideFiles', () => {
        hideFiles();
    });

    // commands for folding and unfolding
    let foldRegion = vscode.commands.registerCommand('extension.foldRegion', () => {
        vscode.commands.executeCommand('editor.fold');
    });
    let unfoldRegion = vscode.commands.registerCommand('extension.unfoldRegion', () => {
        vscode.commands.executeCommand('editor.unfold');
    });

    // "Tag selection"
    // key: ctrl/cmd + shift + T
    // command for tagging the currently selected code
    let tagSelectedCode = vscode.commands.registerCommand('extension.tagSelectedCode', () => {
        let existingTags = ["tag1", "tag2", "tag3", "tag4", "testTag1", "testTag2", "testTag3"]; // TODO this should be changed to generate the array from the current list of tag objects
        existingTags.unshift("Create New Tag"); // add option to create a new tag to array

        // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
        vscode.window.showQuickPick(existingTags).then(input => {
            // executes when user presses Enter or selects a suggested tag name
            // if 'Create New Tag' is selected or entered, open InputBox to enter new tag name
            // if no tag name is entered or the tag name is not an existing tag, code is not tagged
            // if an existing tag is entered or selected, add the current code selection to that tag
            if (typeof input !== 'undefined') {
                if (input == 'Create New Tag') {
                    // open InputBox to create a new tag
                    vscode.window.showInputBox({prompt: 'Enter new tag name'}).then(value => {
                        // executes when user presses Enter
                        // if no tag name is entered, no tag is created
                        // if the entered tag name already exists, no tag is created
                        // otherwise, create new tag and add the selected code to the new tag
                        if (!value) {
                            vscode.window.showInformationMessage('No tag name was entered, code was not tagged');
                        } else if (existingTags.includes(value)) {
                            vscode.window.showInformationMessage('Tag already exists, code was not tagged');
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
                    vscode.window.showInformationMessage('Code was not tagged');
                }
            } else {
                vscode.window.showInformationMessage('No tag was selected, code was not tagged');
            }
        });
    });

    function hideFiles() {
        // this function takes an array of file paths and hides them in the explorer pane
        let projDir = '';
        let settingsFile = '';
        let settingsBackup = '';
        let settingsJSON = JSON.parse('{"files.exclude": {"out": false},"search.exclude": {"out": false}}');

        // TODO below array is a placeholder, should be a parameter
        let files = ["/src/Color.ts", "/src/Tag.ts", "/README.md"];

        if (typeof vscode.workspace.workspaceFolders != 'undefined') {
            projDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
            settingsFile = path.join(projDir, '.vscode', 'settings.json');
            settingsBackup = path.join(projDir, '.vscode', 'settings-backup.json');
        } else {
            vscode.window.showInformationMessage('No workspace folder is open');
        }

        // copy user's settings.json file (create backup)
        // fs.createReadStream(settingsFile).pipe(fs.createWriteStream(settingsBackup)));

        // add files to the settings.json file (in files.exclude section)
        fs.readFile(settingsFile, 'utf8', function (err, data) {
            if (err) {
               vscode.window.showErrorMessage(err.message);
               return;
           }
           settingsJSON = JSON.parse(data);
        });

        let filesLength = files.length;
        for (let i = 0; i < filesLength; i++) {
            settingsJSON['files.exclude']['**' + files[i]] = true;
        }
        let newData = JSON.stringify(settingsJSON);

        // save settings.json file
        fs.writeFile(settingsFile, newData, err => {
            if (err) {
                vscode.window.showErrorMessage(err.message);
                return;
            }
        });

    }

    /*vscode.languages.registerHoverProvider('python', {
        provideHover(document, position, token) {
            console.log(document, position, token);
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor !== undefined) {
            }
            return new vscode.Hover('I am a hover!');
        }
    });*/
    let listener = new Listener(context);

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
    context.subscriptions.push(disposable4);
    context.subscriptions.push(foldRegion);
    context.subscriptions.push(unfoldRegion);
    context.subscriptions.push(tagSelectedCode);
}

class Listener {
    constructor(context: vscode.ExtensionContext) {
        vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
    }
    _onEvent(e: vscode.TextDocumentChangeEvent) {
        console.log("CYKA");
        for (let msg of e.contentChanges) {
            if (msg) {
                console.log(msg.text, msg.range);
            }
        }
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
