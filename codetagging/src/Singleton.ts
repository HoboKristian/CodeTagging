import * as vscode from 'vscode';
import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';
import { GenerateSerialization } from './generateSerialization';
import { LoadSerialization } from './LoadSerialization';

export default class Singleton
{
    private static _instance: Singleton;
    private tagInfos: TagInfo[] = [];
    private tags: Tag[] = [];
    private mySerializer:GenerateSerialization|undefined;
    private myLoader:LoadSerialization|undefined;
    private constructor() {
        let workspaceRootPath = vscode.workspace.rootPath;
        if (workspaceRootPath) {
            this.myLoader = new LoadSerialization(workspaceRootPath);
            this.mySerializer = new GenerateSerialization(vscode.Uri.parse(workspaceRootPath));
        }
    }

    private static serialize() {
        if (singleton.mySerializer) {
            singleton.mySerializer.serialize();
        }
    }

    public static load() {
        if (singleton.myLoader) {
            singleton.myLoader.readFile();
        } 
    }

    public static getTags() {
        return singleton.tags;
    }

    public static removeTag(tag:Tag) {
        singleton.tags.splice(singleton.tags.indexOf(tag), 1);
    }

    public static addTag(tag:Tag) {
        singleton.tags.push(tag);
        Singleton.serialize();
    }

    public static getTagInfos() {
        return singleton.tagInfos;
    }

    public static getTagInfosAsStrings() {
        let strings:string[] = [];
        for (let taginfo of singleton.tagInfos) {
            strings.push(taginfo.name);
        }
        return strings;
    }

    public static createNewTagInfo(tagName: string):TagInfo {
        let newTagInfo = new TagInfo(new Color(this.getTagInfos().length), tagName);
        this.getTagInfos().push(newTagInfo);
        return newTagInfo;
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}

const singleton = Singleton.Instance;