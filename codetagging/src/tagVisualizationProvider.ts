'use strict';

import * as vscode from 'vscode';
//import * as fs from 'fs';
//improt the singleton which we use for reading the values of our tags in order to visualize them in the html preview
import Singleton from './Singleton';

//class for providing the contents of our html preivew, (the visualization of tags)
export class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
    
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    //returns the content that will be in the preview panel (when is this called?) i think it's part of what
    //is inherited from this classes parent
    public provideTextDocumentContent(uri: vscode.Uri): string {
        return this.createCssSnippet();
    }

    //used for realtime editing of the css file
    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri) {
        this._onDidChange.fire(uri);
    }

    //checks which method to call, based on if there is tags or not
    private createCssSnippet() {
        // check if there is a singleton
        if ((Singleton.getTags().length === 0)) {
            //call our error snippet method because the file we have open in the editor, 
            //that were trying to generate a preview for, isn't a css file
            return this.errorSnippet("There are no tags to dsiplay.");
        }
        //if our editor contains a css file get the contents
        return this.snippet();
    }

    //method to return error snippet when the active editor isnt a css file to preview or another css error
    private errorSnippet(error: string): string {
        return `
            <body>
                ${error}
            </body>`;
    }

    // method to return a snippet of html to preview
    private snippet(): string {
        const tags = Singleton.getTags();
        console.log(tags);
        let tagString = '';
        for(let i=0; i<tags.length; i++) {
            tagString = tagString.concat(" "+tags[i].author); 
        }
        return `
        <body>
            ${tagString}
        </body>`;
    }

}