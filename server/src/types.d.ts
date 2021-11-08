export type IResponseFn<T = {}> = (res: IResponse<T>) => any

export type IResponse<T = {}> = IResponseERR | (IResponseOK & T)

export interface IUser extends ISettings {
    lastMessageAt: number
}
export interface IResponseERR {
    ok: false
    err: string
}
export interface IResponseOK {
    ok: true
}
export interface IResponseInit extends ISettings {
    id: string
    idLock: boolean
    serverTime: number
    version: string
}
export interface ISettings {
    settings: {
        timerStart?: number
        timerStop?: number
        timerGreen?: number | string
        timerYellow?: number | string
        timerRed?: number | string
        timerOvertime?: number | string
        speakerName?: string
        presetTime?: number | string
        colorOverride?: string
        speakers?: ISpeakerInput[]
        speakerIndex?: number
        speakersHide?: boolean
        [key: string]: any
    }
}
export interface ISpeakerInput {
    id: number
    name?: string
    timeStart?: number
    timeStop?: number
    preset?: string | number
}
export type IKeyVal<T> = { [key: string]: T }
export type IKeyNVal<T> = { [key: number]: T }
export type IFun<T = any> = (val: T) => any
export type ISetting = string | number | boolean

export interface IParamOptions {
    bool?: boolean
    num?: boolean
    str?: boolean | 'lower' | 'upper'
    requireVal?: boolean
    keyword?: string
    alias?: string | string[]
    callback: IFun
}

export interface VersionCheckStatus {
    status: string
    version: string
}

interface GithubReleaseResponse {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: GithubAuthor;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: Date;
    published_at: Date;
    assets: GithubAsset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
}
interface GithubAsset {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label?: any;
    uploader: GithubUploader;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: Date;
    updated_at: Date;
    browser_download_url: string;
}
interface GithubUploader {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}
interface GithubAuthor {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}