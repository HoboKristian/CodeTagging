import * as vscode from 'vscode';

//class to represent a tag object
export class Tag {

    //define some properties for this class
    name: string;
    color: string;

    //constructor for this class
    //constructor will take a string argument and initialize it to the "message" variabel
    constructor(name: string, color: string){
        //initialize the private class variabel name with the constructors arguments
        this.name = name;
        this.color = color;
    }

    //method that prints out the name of the tag
    getName(){
        return this.name + this.color;
    }

}