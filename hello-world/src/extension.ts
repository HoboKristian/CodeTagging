'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
//use this npm library to handle serilizaiton and deseriliazation of classes
import {serialize} from "serializer.ts/Serializer";
import {deserialize} from "serializer.ts/Serializer";

import * as vscode from 'vscode';

import { Tag } from './tag';

import { GenerateSerialization } from './generateSerialization';
import { LoadSerialization } from "./loadSerialization";



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "hello-world" is now active!');
    
    //Create several instances of a tag class
    let tag1 = new Tag('Database', 'red');
    let tag2 = new Tag("UI", 'blue');
    let tag3 = new Tag("Dashboard", 'green');
 
   console.log(tag1.getName());

   //create array of type Tag
    let arrOfTags:Tag[] = [];
    //load our array
    arrOfTags.push(tag1);
    arrOfTags.push(tag2);
    arrOfTags.push(tag3);

    //try to serialize objects to json
    let tagJson = JSON.stringify(serialize(arrOfTags));
    console.log(tagJson);

    // uri object that represents the current workspace path
    let uriString = vscode.workspace.rootPath;
    console.log(uriString);

     // uri object that represents the current location of the serialized file
    let serializedFileLoc = uriString + '/.serializedfile';
    console.log(serializedFileLoc);

    //instantiate our class that serializes objects
    //this is showing as an error but it works, something about string | undefined cant be assigned to string
    let mySerializer = new GenerateSerialization(vscode.Uri.parse(uriString);

    //instantiate file loader class that will load the seriialized file
    let myLoader = new LoadSerialization(serializedFileLoc);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.serialize', () => {
        //call the serialize method passing it the json of serialized tag objects to write to file
        mySerializer.serialize(tagJson);
    });

    let disposable2 = vscode.commands.registerCommand('extension.load', () => {
        //call the load method
        myLoader.readFile();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {
}