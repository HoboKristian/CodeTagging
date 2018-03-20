import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';

export default class Singleton
{
    private static _instance: Singleton;
    private tagInfos: TagInfo[] = [];
    private tags: Tag[] = [];
    private constructor() {
    }

    public static getTags() {
        return singleton.tags;
    }

    public static removeTag(tag:Tag) {
        singleton.tags.splice(singleton.tags.indexOf(tag), 1);
    }

    public static addTag(tag:Tag) {
        singleton.tags.push(tag);
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