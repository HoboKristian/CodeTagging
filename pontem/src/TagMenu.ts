import * as vscode from 'vscode';
import Singleton from './Singleton';
import TagInfo from './TagInfo';
import Fold from './Fold';
import FileUtility from './FileUtility';
import Hiding from './Hiding';

export default class TagMenu {
    private tagIsolated:boolean;
    private createNewTagString:string = 'Create New Tag';
    private highlightCurrentString:string = "Highlight Current Tag: ";

    hightlightedTagInfo:TagInfo|undefined;
    redrawCallBack:Function;
    tagSelectionCallBack:Function;
    constructor(redraw:Function, tagSelection:Function) {
        this.redrawCallBack = redraw;
        this.tagSelectionCallBack = tagSelection;
        this.tagIsolated = false;
    }

    async showTagMenu() {
        // "Tag selection"
        // key: ctrl/cmd + shift + T
        // Command for tagging the currently selected code

        let existingTags = Singleton.getTagInfos().map(tagInfo => tagInfo.name);        
        existingTags.unshift(this.createNewTagString); // add option to create a new tag to array

        // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
        let input = await vscode.window.showQuickPick(existingTags);
        // executes when user presses Enter or selects a suggested tag name
        // if 'Create New Tag' is selected or entered, open InputBox to enter new tag name
        // if no tag name is entered or the tag name is not an existing tag, code is not tagged
        // if an existing tag is entered or selected, add the current code selection to that tag
        if (input === undefined) {
            vscode.window.showErrorMessage('No tag was selected, code was not tagged');
            return;
        }
        console.log(input);
        if (input === this.createNewTagString) {
            // open InputBox to create a new tag
            let value = await vscode.window.showInputBox({prompt: 'Enter new tag name'});
            console.log(value);
            // executes when user presses Enter
            // if no tag name is entered, no tag is created
            // if the entered tag name already exists, no tag is created
            // otherwise, create new tag and add the selected code to the new tag
            if (value === undefined) {
                return;
            }
            if (existingTags.includes(value)) {
                vscode.window.showErrorMessage('Tag already exists, code was not tagged');
            } else {
                this.createNewTagSelected(value);
            }
        } else if (existingTags.includes(input)) {
            this.oldTagSelected(input);
        }
    }

    async showIsolateMenu() {
        // "Isolate tag"
        // key: ctrl/cmd + shift + R
        // Command for isolating a specified tag
        let existingTags = Singleton.getTagInfos().map(tagInfo => tagInfo.name);
        let existingTagsWithCurrentLine = existingTags.slice(0, existingTags.length);
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            let currentLine = textEditor.selection.start.line + 1;
            let currentTag = Singleton.getTags()
            .find(tag => tag.start <= currentLine && tag.end >= currentLine);
            if (currentTag) {
                existingTagsWithCurrentLine.unshift(this.highlightCurrentString + currentTag.tagInfo.name);
            }
        }
        if (this.tagIsolated) {
            this.tagIsolated = !this.tagIsolated;
            this.removeCurrentIsolation(true);
        } else {
            // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
            let input = await vscode.window.showQuickPick(existingTagsWithCurrentLine);
            // executes when user presses Enter or selects a suggested tag name
            // if no tag name is entered or the tag name is not an existing tag, no tag is isolated
            // if an existing tag is entered or selected, isolate that tag
            if (input === undefined) {
                vscode.window.showErrorMessage('No tag was isolated');
                return;
            }
            if (input.startsWith(this.highlightCurrentString)) {
                input = input.replace(this.highlightCurrentString, "");
            }
            this.isolateTagInfoName(input, true);
        }
    }

    private removeCurrentIsolation(output:boolean){
        this.hightlightedTagInfo = undefined;
        Hiding.unhideFiles();
        Fold.unfoldFoldedMethods();
        this.redrawCallBack();
        if (output) {
            //vscode.window.showInformationMessage('Isolation deactivated');
        }
    }

    async isolateTagInfoName(tagInfoName:string, output:boolean) {
        if (this.tagIsolated) {
            this.removeCurrentIsolation(false);
        }
        this.hightlightedTagInfo = Singleton.getTagInfos().find(tagInfo => tagInfo.name === tagInfoName);

        if (this.hightlightedTagInfo) {
            let allFiles = FileUtility.filesThatDoNotContainTagInfo(this.hightlightedTagInfo);
            if (allFiles) {
                Hiding.hideFiles(allFiles);
            }
            for (let textEditor of vscode.window.visibleTextEditors) {
                let document = await vscode.workspace.openTextDocument(textEditor.document.uri);
                await vscode.window.showTextDocument(document);
    
                Fold.highlightTag(this.hightlightedTagInfo);                
            }
            if (output) {
                //vscode.window.showInformationMessage('\"' + tagInfoName + '\" tag is isolated');
            }
            this.tagIsolated = true;
        }
        this.redrawCallBack();
    }

    private createNewTagSelected(value:string) {
        let newTagInfo = Singleton.createNewTagInfo(value);
        this.tagSelectionCallBack(newTagInfo);
        this.redrawCallBack();
        vscode.window.showInformationMessage('Tag created, code was tagged with \"' + value + '\"');
    }

    private oldTagSelected(input:string) {
        let tagInfo = Singleton.getTagInfos().find(tagInfo => tagInfo.name === input);
        if (tagInfo) {
            this.tagSelectionCallBack(tagInfo);
        }
        this.redrawCallBack();
        //vscode.window.showInformationMessage('Code was tagged with \"' + input + '\"');
    }
}